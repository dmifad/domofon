import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ApartmentsService } from '../apartments/apartments.service';
import { Apartment } from '../apartments/apartment.entity';
import { UserApartment } from '../apartments/user-apartment.entity';
import { Device } from '../devices/device.entity';
import { EventsService } from '../events/events.service';
import { IntercomsService } from '../intercoms/intercoms.service';
import { CallPushPayload, PushService } from '../push/push.service';
import { Call } from './call.entity';

export interface IncomingCallInput {
  intercomId: string;
  apartmentNumber: string;
  channelId?: string;
}

export interface IncomingCallResult {
  callId: string;
  sipUri: string;
  notifiedDevices: number;
}

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call) private readonly calls: Repository<Call>,
    @InjectRepository(Apartment) private readonly apartments: Repository<Apartment>,
    @InjectRepository(UserApartment) private readonly links: Repository<UserApartment>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    private readonly apartmentsService: ApartmentsService,
    private readonly intercoms: IntercomsService,
    private readonly events: EventsService,
    private readonly push: PushService,
  ) {}

  /**
   * Asterisk webhook: панель набрала квартиру. Ищем подписчиков, шлём push.
   * Возвращает SIP-URI группового вызова, который Asterisk использует для рассылки.
   */
  async ringApartment(input: IncomingCallInput): Promise<IncomingCallResult> {
    const intercom = await this.intercoms.findById(input.intercomId);
    if (!intercom) throw new NotFoundException('intercom_not_found');

    const apartment = await this.apartments.findOne({
      where: { buildingId: intercom.buildingId, number: input.apartmentNumber },
    });
    if (!apartment) throw new NotFoundException('apartment_not_found');

    const sipUri = `sip:call-${cryptoSafeId()}@domofon.local`;
    const call = await this.calls.save(
      this.calls.create({
        intercomId: intercom.id,
        apartmentId: apartment.id,
        buildingId: intercom.buildingId,
        channelId: input.channelId,
        sipUri,
        status: 'ringing',
      }),
    );

    const links = await this.links.find({ where: { apartmentId: apartment.id } });
    const userIds = links.map((l) => l.userId);
    if (userIds.length === 0) {
      await this.markMissed(call.id, 'no_residents');
      return { callId: call.id, sipUri, notifiedDevices: 0 };
    }

    const devices = await this.devices.find({ where: { userId: In(userIds) } });
    const payload: CallPushPayload = {
      type: 'call.incoming',
      callId: call.id,
      intercomId: intercom.id,
      intercomName: intercom.name,
      sipUri,
      buildingAddress: `${intercom.building.city}, ${intercom.building.address}`,
    };
    await this.push.dispatchCall(devices, payload);

    return { callId: call.id, sipUri, notifiedDevices: devices.length };
  }

  async answer(userId: string, callId: string): Promise<Call> {
    const call = await this.assertUserAccess(userId, callId);
    if (call.status === 'answered') return call;
    if (call.status !== 'ringing') {
      throw new ForbiddenException('call_not_ringing');
    }
    call.status = 'answered';
    call.answeredBy = userId;
    call.answeredAt = new Date();
    const saved = await this.calls.save(call);
    await this.events.record({
      apartmentId: call.apartmentId,
      buildingId: call.buildingId,
      type: 'call.answered',
      payload: { callId, userId, intercomId: call.intercomId },
    });
    return saved;
  }

  async decline(userId: string, callId: string): Promise<Call> {
    const call = await this.assertUserAccess(userId, callId);
    if (call.status !== 'ringing') return call;
    call.status = 'declined';
    call.endedAt = new Date();
    return this.calls.save(call);
  }

  async end(callId: string): Promise<void> {
    await this.calls.update(
      { id: callId, endedAt: IsNull() },
      { status: 'ended', endedAt: new Date() },
    );
  }

  async markMissed(callId: string, reason: string): Promise<void> {
    const call = await this.calls.findOne({ where: { id: callId } });
    if (!call || call.status !== 'ringing') return;
    call.status = 'missed';
    call.endedAt = new Date();
    await this.calls.save(call);
    await this.events.record({
      apartmentId: call.apartmentId,
      buildingId: call.buildingId,
      type: 'call.missed',
      payload: { callId, reason, intercomId: call.intercomId },
    });
  }

  async historyForUser(userId: string, limit = 50): Promise<Call[]> {
    const buildingIds = await this.apartmentsService.buildingIdsForUser(userId);
    if (buildingIds.length === 0) return [];
    return this.calls.find({
      where: { buildingId: In(buildingIds) },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });
  }

  private async assertUserAccess(userId: string, callId: string): Promise<Call> {
    const call = await this.calls.findOne({ where: { id: callId } });
    if (!call) throw new NotFoundException('call_not_found');
    const buildingIds = await this.apartmentsService.buildingIdsForUser(userId);
    if (!buildingIds.includes(call.buildingId)) {
      throw new ForbiddenException('no_access_to_call');
    }
    return call;
  }
}

function cryptoSafeId(): string {
  return Math.random().toString(36).slice(2, 10);
}
