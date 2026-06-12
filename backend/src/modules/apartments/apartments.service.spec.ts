import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Apartment } from './apartment.entity';
import { ApartmentsService } from './apartments.service';
import { UserApartment } from './user-apartment.entity';

type MockRepo<T extends object = object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ApartmentsService', () => {
  let service: ApartmentsService;
  let apartments: MockRepo<Apartment>;
  let links: MockRepo<UserApartment>;

  const apartment = {
    id: 'apt-1',
    buildingId: 'bld-1',
    accountNumber: '100001',
    linkCode: '1234',
  } as Apartment;

  beforeEach(() => {
    apartments = { findOne: jest.fn() };
    links = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
    };
    service = new ApartmentsService(
      apartments as unknown as Repository<Apartment>,
      links as unknown as Repository<UserApartment>,
    );
  });

  describe('link', () => {
    it('404 when account number is unknown', async () => {
      apartments.findOne!.mockResolvedValue(null);
      await expect(service.link('u1', '999999', '1234')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('400 when link code mismatches', async () => {
      apartments.findOne!.mockResolvedValue(apartment);
      await expect(service.link('u1', '100001', '0000')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('first linked user becomes owner', async () => {
      apartments.findOne!.mockResolvedValue(apartment);
      links.findOne!.mockResolvedValue(null); // ни существующей связи, ни owner'а

      const link = await service.link('u1', '100001', '1234');
      expect(link.role).toBe('owner');
    });

    it('subsequent users become members', async () => {
      apartments.findOne!.mockResolvedValue(apartment);
      links.findOne!
        .mockResolvedValueOnce(null) // существующей связи нет
        .mockResolvedValueOnce({ role: 'owner' }); // owner уже есть

      const link = await service.link('u2', '100001', '1234');
      expect(link.role).toBe('member');
    });

    it('is idempotent for already-linked user', async () => {
      apartments.findOne!.mockResolvedValue(apartment);
      const existing = { userId: 'u1', apartmentId: 'apt-1', role: 'owner' };
      links.findOne!.mockResolvedValueOnce(existing);

      await expect(service.link('u1', '100001', '1234')).resolves.toBe(existing);
      expect(links.save).not.toHaveBeenCalled();
    });
  });

  describe('buildingIdsForUser', () => {
    it('deduplicates buildings', async () => {
      links.find!.mockResolvedValue([
        { apartment: { buildingId: 'bld-1' } },
        { apartment: { buildingId: 'bld-1' } },
        { apartment: { buildingId: 'bld-2' } },
      ]);
      await expect(service.buildingIdsForUser('u1')).resolves.toEqual([
        'bld-1',
        'bld-2',
      ]);
    });
  });
});
