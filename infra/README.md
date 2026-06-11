# Infrastructure

Dev-окружение для Domofon. Поднимает все зависимости локально.

```
docker compose up -d
docker compose ps
docker compose logs -f mediamtx
```

Порты:

| Сервис     | Порт             | Назначение           |
|------------|------------------|----------------------|
| Postgres   | 5432             | БД                   |
| Redis      | 6379             | OTP, очереди         |
| MinIO      | 9000 (S3), 9001  | snapshots, архив     |
| MediaMTX   | 8554, 8888, 8889 | RTSP/HLS/WebRTC      |
| Asterisk   | 5060, 10000-10100| SIP/RTP              |

## MinIO bucket

После первого запуска создайте bucket:

```
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/domofon
```

## MediaMTX

Тестовый RTSP-стрим:

```
ffmpeg -re -stream_loop -1 -i sample.mp4 -c copy -f rtsp rtsp://localhost:8554/camera1
```

HLS доступен по `http://localhost:8888/camera1/index.m3u8`.
