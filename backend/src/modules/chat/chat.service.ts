import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { ApartmentsService } from '../apartments/apartments.service';
import { Announcement, ChatMessage } from './chat.entities';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage) private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Announcement) private readonly announcements: Repository<Announcement>,
    private readonly apartments: ApartmentsService,
  ) {}

  async assertApartmentAccess(userId: string, apartmentId: string): Promise<void> {
    const links = await this.apartments.listForUser(userId);
    if (!links.some((l) => l.apartmentId === apartmentId)) {
      throw new ForbiddenException('no_access_to_apartment');
    }
  }

  async send(userId: string, apartmentId: string, text: string): Promise<ChatMessage> {
    await this.assertApartmentAccess(userId, apartmentId);
    return this.messages.save(this.messages.create({ userId, apartmentId, text }));
  }

  async history(
    userId: string,
    apartmentId: string,
    cursor?: string,
    limit = 50,
  ): Promise<{ items: ChatMessage[]; nextCursor: string | null }> {
    await this.assertApartmentAccess(userId, apartmentId);
    const items = await this.messages.find({
      where: {
        apartmentId,
        ...(cursor ? { createdAt: LessThan(new Date(cursor)) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });
    const nextCursor =
      items.length === Math.min(limit, 100)
        ? items[items.length - 1].createdAt.toISOString()
        : null;
    return { items, nextCursor };
  }

  async announcementsForUser(userId: string): Promise<Announcement[]> {
    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (buildingIds.length === 0) return [];
    return this.announcements.find({
      where: { buildingId: In(buildingIds) },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
