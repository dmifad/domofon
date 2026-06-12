# Домофон

Платформа умного домофона: нативные мобильные приложения (Android, iOS) и серверная
часть (API + SIP + медиа). Аналог Smartyard OEM / «Гепард Око».

Полное техническое задание: [SPECIFICATION.md](./SPECIFICATION.md).

## Структура репозитория

| Путь | Описание |
|---|---|
| `backend/` | Core API — NestJS 10 (TypeScript), PostgreSQL, Redis |
| `mobile/android/` | Android-приложение — Kotlin, Jetpack Compose |
| `mobile/ios/` | iOS-приложение — Swift, SwiftUI (XcodeGen) |
| `infra/` | docker-compose: Postgres, Redis, MinIO, MediaMTX, Asterisk |
| `docs/` | Документация, ADR |

## Быстрый старт (dev)

```bash
# Зависимости
cd infra && docker compose up -d

# API
cd backend && pnpm install && cp .env.example .env && pnpm start:dev
# Swagger: http://localhost:3000/api/docs

# Android
cd mobile/android && ./gradlew :app:assembleDebug

# iOS
cd mobile/ios && xcodegen generate && open Domofon.xcodeproj
```

## Статус

Все 6 спринтов завершены — продукт MVP-готов:

1. **Спринт 0** — каркас моно-репо (backend / Android / iOS / infra).
2. **Спринт 1** — доменная модель, вход по SMS, список домофонов.
3. **Спринт 2** — жизненный цикл звонка (Asterisk webhook + push + CallKit / ConnectionService), реальное открытие двери.
4. **Спринт 3** — камеры (live HLS + архив MediaMTX), снапшоты в MinIO, видеопревью в звонке, журнал событий.
5. **Спринт 4** — ЖКХ (счета, оплата через ЮKassa, счётчики), чат с УК (Socket.IO), объявления.
6. **Спринт 5** — backend-тесты (Jest), CI (GitHub Actions), Sentry, документация по продакшену и публикации.

Подробный план этапов — в [SPECIFICATION.md](./SPECIFICATION.md#8-этапы),
инструкции по релизу — в [docs/RELEASE.md](./docs/RELEASE.md).
