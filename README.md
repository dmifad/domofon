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

Спринт 0 (каркас) — готов. План этапов — в [SPECIFICATION.md](./SPECIFICATION.md#8-этапы).
