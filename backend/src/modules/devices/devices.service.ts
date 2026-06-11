import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DevicePlatform } from './device.entity';

export interface RegisterDeviceInput {
  platform: DevicePlatform;
  pushToken: string;
  voipToken?: string;
  appVersion?: string;
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
  ) {}

  async register(userId: string, input: RegisterDeviceInput): Promise<Device> {
    const existing = await this.devices.findOne({ where: { pushToken: input.pushToken } });
    if (existing) {
      existing.userId = userId;
      existing.voipToken = input.voipToken ?? existing.voipToken;
      existing.appVersion = input.appVersion ?? existing.appVersion;
      return this.devices.save(existing);
    }
    return this.devices.save(this.devices.create({ userId, ...input }));
  }

  async remove(userId: string, deviceId: string): Promise<void> {
    await this.devices.delete({ id: deviceId, userId });
  }

  listForUser(userId: string): Promise<Device[]> {
    return this.devices.find({ where: { userId } });
  }
}
