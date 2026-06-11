# Domofon monorepo — гайд для Claude Code

Моно-репо приложения-аналога Smartyard / Гепард Око. Полное ТЗ: [SPECIFICATION.md](./SPECIFICATION.md).

## Структура

- `backend/` — Core API на NestJS (TypeScript).
- `mobile/android/` — Android-клиент, Kotlin + Jetpack Compose.
- `mobile/ios/` — iOS-клиент, Swift + SwiftUI.
- `infra/` — Docker Compose: Postgres, Redis, MinIO, MediaMTX, Asterisk.
- `docs/` — дополнительная документация, ADR.

## Команды

Запуск dev-окружения:
```
cd infra && docker compose up -d
cd backend && pnpm install && pnpm start:dev
```

Android:
```
cd mobile/android && ./gradlew :app:assembleDebug
```

iOS:
```
cd mobile/ios && xcodegen generate && open Domofon.xcodeproj
```

## Конвенции

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Ветки: `feat/<scope>`, `fix/<scope>`.
- Backend code style: ESLint + Prettier (NestJS defaults).
- Kotlin: ktlint + detekt.
- Swift: SwiftLint (рекомендуемые правила).
- API-контракт — source of truth: `backend/openapi.yaml` (генерируется).
