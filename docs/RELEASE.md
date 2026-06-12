# Развёртывание и публикация

## 1. Продакшен-инфраструктура

Минимальный состав (1 VPS / k8s-нода на старт, далее горизонтально):

| Компонент | Рекомендация |
|---|---|
| Core API | 2+ реплики за nginx/traefik, TLS (Let's Encrypt) |
| PostgreSQL 16 | managed (Yandex Cloud / VK Cloud) или своя с WAL-бэкапами |
| Redis 7 | managed или своя, persistence AOF |
| MediaMTX | отдельная нода с диском под архив; масштабируется шардированием камер по нодам |
| Asterisk | отдельная нода, статический внешний IP, диапазон RTP 10000-20000/udp открыт |
| MinIO / S3 | бакет под снапшоты (lifecycle 30 дней) |

### Секреты (env)

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — 64+ случайных байта, разные.
- `INTERNAL_API_SECRET` — общий с Asterisk dialplan.
- `SMSC_LOGIN/PASSWORD` — кабинет smsc.ru, подписанный sender name.
- `YOOKASSA_SHOP_ID/SECRET_KEY` — боевой магазин, webhook на `/api/v1/billing/webhook/yookassa` (ограничить IP-диапазонами ЮKassa).
- `FCM_CREDENTIALS_PATH` — service-account JSON из Firebase Console.
- `APNS_TEAM_ID/KEY_ID/KEY_PATH` — ключ p8 из Apple Developer, тип VoIP.
- `SENTRY_DSN` — проект в Sentry.

### Миграции

```
pnpm migration:run   # перед каждым деплоем, в CD-пайплайне
```

### Push-провайдеры

`PushService` содержит стабы. Для прода:

1. FCM: `pnpm add firebase-admin`, инициализация по `FCM_CREDENTIALS_PATH`,
   отправка high-priority data-сообщений (`ttl: 0`).
2. APNs VoIP: `pnpm add @parse/node-apn` (или http/2 + JWT вручную),
   `pushType: voip`, topic `<bundle-id>.voip`. **Только** для звонков —
   за злоупотребление VoIP-push Apple отклоняет приложения.

### SIP

- Динамические PJSIP endpoints: перейти на Realtime PJSIP (хранение в Postgres),
  backend создаёт/удаляет endpoint при регистрации устройства.
- TLS (5061) + SRTP для прода обязательны.
- linphone-sdk на клиентах: Android — `org.linphone:linphone-sdk-android`,
  iOS — `linphonesw` (SPM/CocoaPods); заменить стабы `SipEngine`.

## 2. Мобильные приложения

### Android (Google Play + RuStore)

1. Создать Firebase-проект, скачать `google-services.json` в `mobile/android/app/`,
   подключить плагин `com.google.gms.google-services`.
2. Подпись: `key.properties` + upload key, Play App Signing.
3. `targetSdk 35`, политика Foreground Service: тип `phoneCall` уже задекларирован —
   в анкете Play Console обосновать «входящие звонки домофона».
4. Разрешения в анкете Data Safety: микрофон (звонок), камера (не используется
   без звонка), уведомления.
5. RuStore: тот же aab/apk, отдельная регистрация пуш-сервиса не нужна
   (FCM работает; для устройств без GMS — добавить RuStore Push SDK, TODO).

### iOS (App Store)

1. Capabilities: Push Notifications, Background Modes (voip, audio, remote-notification).
2. VoIP-пуши: после `didReceiveIncomingPushWith` **обязательно** репортить звонок
   в CallKit до возврата из колбэка (уже реализовано в `CallManager`), иначе
   crash от watchdog и реджект на ревью.
3. App Review notes: приложить тестовый аккаунт (телефон + код из стаба),
   видео сценария звонка, объяснить, что VoIP-push используется только для звонков.
4. Privacy: микрофон («голосовая связь с посетителем»), Face ID (вход).

## 3. Мониторинг

- Sentry: backend включается `SENTRY_DSN`; мобильные SDK — sentry-android / sentry-cocoa (TODO).
- Prometheus: добавить `@willsoto/nestjs-prometheus`, метрики: время от webhook
  до push-отправки, доля отвеченных звонков, ошибки door-open.
- Алёрты: push-latency p95 > 2 c, доля missed > 60%, недоступность Asterisk.

## 4. Нагрузочное тестирование (до запуска)

- k6/Artillery: 100 RPS на `internal/calls/incoming` (положить мок push-провайдера).
- 1000 одновременных HLS-зрителей на MediaMTX-ноду (см. бенчмарки MediaMTX).
- Asterisk: sipp-сценарий 50 одновременных звонков.
