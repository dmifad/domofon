import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { SnapshotService } from './snapshot.service';

@Module({
  providers: [S3Service, SnapshotService],
  exports: [S3Service, SnapshotService],
})
export class MediaModule {}
