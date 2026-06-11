import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApartmentsService } from '../apartments/apartments.service';
import { EventsService } from '../events/events.service';
import { Intercom } from './intercom.entity';

@Injectable()
export class IntercomsService {
  constructor(
    @InjectRepository(Intercom) private readonly intercoms: Repository<Intercom>,
    private readonly apartments: ApartmentsService,
    private readonly events: EventsService,
  ) {}

  async listForUser(userId: string): Promise<Intercom[]> {
    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (buildingIds.length === 0) return [];
    return this.intercoms.find({ where: { buildingId: In(buildingIds) } });
  }

  async open(userId: string, intercomId: string): Promise<{ opened: boolean }> {
    const intercom = await this.intercoms.findOne({ where: { id: intercomId } });
    if (!intercom) throw new NotFoundException('intercom_not_found');

    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (!buildingIds.includes(intercom.buildingId)) {
      throw new ForbiddenException('no_access_to_intercom');
    }

    // TODO sprint 2: реальное открытие — HTTP API панели (openUrl) или SIP INFO через Asterisk.

    await this.events.record({
      buildingId: intercom.buildingId,
      type: 'door.opened.app',
      payload: { intercomId, userId },
    });
    return { opened: true };
  }
}
