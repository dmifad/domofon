import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { ApartmentsService } from '../apartments/apartments.service';
import { Event, EventType } from './event.entity';

export interface RecordEventInput {
  apartmentId?: string;
  buildingId?: string;
  type: EventType;
  payload?: Record<string, unknown>;
  snapshotUrl?: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
    private readonly apartments: ApartmentsService,
  ) {}

  record(input: RecordEventInput): Promise<Event> {
    return this.events.save(this.events.create({ payload: {}, ...input }));
  }

  async listForUser(
    userId: string,
    opts: { type?: EventType; cursor?: string; limit?: number } = {},
  ): Promise<{ items: Event[]; nextCursor: string | null }> {
    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (buildingIds.length === 0) return { items: [], nextCursor: null };

    const limit = Math.min(opts.limit ?? 50, 100);
    const items = await this.events.find({
      where: {
        buildingId: In(buildingIds),
        ...(opts.type ? { type: opts.type } : {}),
        ...(opts.cursor ? { createdAt: LessThan(new Date(opts.cursor)) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    const nextCursor =
      items.length === limit ? items[items.length - 1].createdAt.toISOString() : null;
    return { items, nextCursor };
  }
}
