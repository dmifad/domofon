import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apartment } from './apartment.entity';
import { UserApartment } from './user-apartment.entity';

@Injectable()
export class ApartmentsService {
  constructor(
    @InjectRepository(Apartment) private readonly apartments: Repository<Apartment>,
    @InjectRepository(UserApartment) private readonly links: Repository<UserApartment>,
  ) {}

  listForUser(userId: string): Promise<UserApartment[]> {
    return this.links.find({ where: { userId } });
  }

  async link(userId: string, accountNumber: string, linkCode: string): Promise<UserApartment> {
    const apartment = await this.apartments.findOne({ where: { accountNumber } });
    if (!apartment) throw new NotFoundException('apartment_not_found');
    if (apartment.linkCode !== linkCode) throw new BadRequestException('invalid_link_code');

    const existing = await this.links.findOne({
      where: { userId, apartmentId: apartment.id },
    });
    if (existing) return existing;

    const hasOwner = await this.links.findOne({
      where: { apartmentId: apartment.id, role: 'owner' },
    });
    const link = this.links.create({
      userId,
      apartmentId: apartment.id,
      role: hasOwner ? 'member' : 'owner',
    });
    return this.links.save(link);
  }

  async buildingIdsForUser(userId: string): Promise<string[]> {
    const links = await this.links.find({ where: { userId } });
    return [...new Set(links.map((l) => l.apartment.buildingId))];
  }
}
