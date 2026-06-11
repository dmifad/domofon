import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApartmentsService } from '../apartments/apartments.service';
import { Camera } from './camera.entity';

export interface StreamInfo {
  webrtcUrl: string;
  hlsUrl: string;
}

@Injectable()
export class CamerasService {
  constructor(
    @InjectRepository(Camera) private readonly cameras: Repository<Camera>,
    private readonly apartments: ApartmentsService,
  ) {}

  async listForUser(userId: string): Promise<Camera[]> {
    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (buildingIds.length === 0) return [];
    return this.cameras.find({ where: { buildingId: In(buildingIds) } });
  }

  async streamInfo(userId: string, cameraId: string): Promise<StreamInfo> {
    const camera = await this.cameras.findOne({ where: { id: cameraId } });
    if (!camera) throw new NotFoundException('camera_not_found');

    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (!buildingIds.includes(camera.buildingId)) {
      throw new ForbiddenException('no_access_to_camera');
    }

    // TODO: одноразовые подписанные токены доступа к стриму.
    const base = process.env.MEDIA_SERVER_URL ?? 'http://localhost:8888';
    const webrtcBase = base.replace(':8888', ':8889');
    return {
      webrtcUrl: `${webrtcBase}/${camera.streamPath}/whep`,
      hlsUrl: `${base}/${camera.streamPath}/index.m3u8`,
    };
  }

  /**
   * URL воспроизведения архива через MediaMTX Playback Server.
   * from — ISO-время начала, duration — секунды (по умолчанию 60).
   */
  async archiveInfo(
    userId: string,
    cameraId: string,
    from: string,
    duration = 60,
  ): Promise<{ playbackUrl: string }> {
    const camera = await this.cameras.findOne({ where: { id: cameraId } });
    if (!camera) throw new NotFoundException('camera_not_found');
    if (!camera.hasArchive) throw new NotFoundException('camera_has_no_archive');

    const buildingIds = await this.apartments.buildingIdsForUser(userId);
    if (!buildingIds.includes(camera.buildingId)) {
      throw new ForbiddenException('no_access_to_camera');
    }

    const playbackBase = process.env.MEDIA_PLAYBACK_URL ?? 'http://localhost:9996';
    const params = new URLSearchParams({
      path: camera.streamPath,
      start: from,
      duration: String(Math.min(duration, 3600)),
      format: 'mp4',
    });
    return { playbackUrl: `${playbackBase}/get?${params.toString()}` };
  }
}
