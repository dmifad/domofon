import { NotFoundException } from '@nestjs/common';
import { CallsService } from './calls.service';

describe('CallsService', () => {
  const intercom = {
    id: 'int-1',
    buildingId: 'bld-1',
    name: 'Подъезд 1',
    cameraPath: 'panel1',
    building: { city: 'Москва', address: 'ул. Тестовая, 1' },
  };

  function build(overrides: Record<string, unknown> = {}) {
    const calls = {
      save: jest.fn(async (x) => ({ id: 'call-1', ...x })),
      create: jest.fn((x) => x),
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
    };
    const apartments = {
      findOne: jest.fn().mockResolvedValue({ id: 'apt-1', buildingId: 'bld-1' }),
    };
    const links = {
      find: jest.fn().mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]),
    };
    const devices = {
      find: jest.fn().mockResolvedValue([
        { platform: 'android', pushToken: 'fcm-1' },
        { platform: 'ios', pushToken: 'apns-1', voipToken: 'voip-1' },
      ]),
    };
    const apartmentsService = { buildingIdsForUser: jest.fn().mockResolvedValue(['bld-1']) };
    const intercoms = { findById: jest.fn().mockResolvedValue(intercom) };
    const events = { record: jest.fn() };
    const push = { dispatchCall: jest.fn() };
    const snapshots = { capture: jest.fn().mockResolvedValue('http://s3/snap.jpg') };

    const deps = {
      calls,
      apartments,
      links,
      devices,
      apartmentsService,
      intercoms,
      events,
      push,
      snapshots,
      ...overrides,
    };
    const service = new CallsService(
      deps.calls as never,
      deps.apartments as never,
      deps.links as never,
      deps.devices as never,
      deps.apartmentsService as never,
      deps.intercoms as never,
      deps.events as never,
      deps.push as never,
      deps.snapshots as never,
    );
    return { service, deps };
  }

  describe('ringApartment', () => {
    it('404 for unknown intercom', async () => {
      const { service, deps } = build();
      (deps.intercoms.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        service.ringApartment({ intercomId: 'nope', apartmentNumber: '42' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('dispatches push to all resident devices with snapshot and preview', async () => {
      const { service, deps } = build();
      const result = await service.ringApartment({
        intercomId: 'int-1',
        apartmentNumber: '42',
      });

      expect(result.notifiedDevices).toBe(2);
      expect(result.sipUri).toMatch(/^sip:call-/);
      expect(deps.push.dispatchCall).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ platform: 'android' })]),
        expect.objectContaining({
          type: 'call.incoming',
          snapshotUrl: 'http://s3/snap.jpg',
          previewUrl: expect.stringContaining('panel1/index.m3u8'),
        }),
      );
    });

    it('marks call missed when apartment has no residents', async () => {
      const { service, deps } = build();
      (deps.links.find as jest.Mock).mockResolvedValue([]);
      (deps.calls.findOne as jest.Mock).mockResolvedValue({
        id: 'call-1',
        status: 'ringing',
      });

      const result = await service.ringApartment({
        intercomId: 'int-1',
        apartmentNumber: '42',
      });
      expect(result.notifiedDevices).toBe(0);
      expect(deps.push.dispatchCall).not.toHaveBeenCalled();
      expect(deps.events.record).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'call.missed' }),
      );
    });
  });

  describe('markMissed', () => {
    it('ignores already-answered calls', async () => {
      const { service, deps } = build();
      (deps.calls.findOne as jest.Mock).mockResolvedValue({
        id: 'call-1',
        status: 'answered',
      });
      await service.markMissed('call-1', 'no_answer');
      expect(deps.events.record).not.toHaveBeenCalled();
    });
  });
});
