import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApartmentsService } from '../apartments/apartments.service';
import {
  BillingAccount,
  Charge,
  MeterReading,
  MeterType,
  Payment,
} from './billing.entities';
import { YookassaService } from './yookassa.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingAccount) private readonly accounts: Repository<BillingAccount>,
    @InjectRepository(Charge) private readonly charges: Repository<Charge>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(MeterReading) private readonly meters: Repository<MeterReading>,
    private readonly apartments: ApartmentsService,
    private readonly yookassa: YookassaService,
  ) {}

  private async apartmentIdsForUser(userId: string): Promise<string[]> {
    const links = await this.apartments.listForUser(userId);
    return links.map((l) => l.apartmentId);
  }

  async accountsForUser(userId: string): Promise<BillingAccount[]> {
    const apartmentIds = await this.apartmentIdsForUser(userId);
    if (apartmentIds.length === 0) return [];
    return this.accounts.find({ where: { apartmentId: In(apartmentIds) } });
  }

  async chargesForUser(userId: string, accountId?: string): Promise<Charge[]> {
    const accounts = await this.accountsForUser(userId);
    const ids = accounts.map((a) => a.id);
    if (ids.length === 0) return [];
    if (accountId && !ids.includes(accountId)) {
      throw new ForbiddenException('no_access_to_account');
    }
    return this.charges.find({
      where: { accountId: accountId ? accountId : In(ids) },
      order: { period: 'DESC' },
      take: 100,
    });
  }

  async createPayment(userId: string, accountId: string, amount: string): Promise<Payment> {
    const accounts = await this.accountsForUser(userId);
    const account = accounts.find((a) => a.id === accountId);
    if (!account) throw new NotFoundException('account_not_found');

    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 1_000_000) {
      throw new BadRequestException('invalid_amount');
    }

    const provider = await this.yookassa.createPayment(
      numeric.toFixed(2),
      `Оплата ЖКУ, л/с ${account.accountNumber}`,
    );
    return this.payments.save(
      this.payments.create({
        accountId,
        userId,
        amount: numeric.toFixed(2),
        status: 'pending',
        providerId: provider.providerId,
        confirmationUrl: provider.confirmationUrl,
      }),
    );
  }

  /** Webhook ЮKassa payment.succeeded — закрываем платёж и пересчитываем баланс. */
  async confirmPayment(providerId: string): Promise<void> {
    const payment = await this.payments.findOne({ where: { providerId } });
    if (!payment || payment.status === 'succeeded') return;
    payment.status = 'succeeded';
    await this.payments.save(payment);

    const account = await this.accounts.findOne({ where: { id: payment.accountId } });
    if (account) {
      account.balance = (Number(account.balance) + Number(payment.amount)).toFixed(2);
      await this.accounts.save(account);
    }
  }

  async submitMeter(
    userId: string,
    apartmentId: string,
    meterType: MeterType,
    value: string,
  ): Promise<MeterReading> {
    const apartmentIds = await this.apartmentIdsForUser(userId);
    if (!apartmentIds.includes(apartmentId)) {
      throw new ForbiddenException('no_access_to_apartment');
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new BadRequestException('invalid_value');
    }
    return this.meters.save(
      this.meters.create({ userId, apartmentId, meterType, value: numeric.toFixed(3) }),
    );
  }

  async metersForUser(userId: string, apartmentId: string): Promise<MeterReading[]> {
    const apartmentIds = await this.apartmentIdsForUser(userId);
    if (!apartmentIds.includes(apartmentId)) {
      throw new ForbiddenException('no_access_to_apartment');
    }
    return this.meters.find({
      where: { apartmentId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
