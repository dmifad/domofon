# Домофон — MVP для DNAKE S213

Минимальная серверная обвязка для проверки сценария «звонок с панели S213
→ ответ → открытие двери» в одной локальной сети.

**Инструкция по проверке на железе:** [MVP-RUN.md](./MVP-RUN.md).

## Что в репозитории

| Путь | Что делает |
|---|---|
| `backend/` | NestJS API: логин по PIN, регистрация push-токенов, webhook от Asterisk, открытие двери (HTTP API панели + DTMF через ARI), история звонков. SQLite через встроенный `node:sqlite` (нативных зависимостей нет). |
| `infra/asterisk/` | Готовые `pjsip.conf`, `extensions.conf`, `ari.conf`, `http.conf` под одну панель + одного жителя. |
| `infra/docker-compose.yml` | Asterisk в `network_mode: host` для прямого SIP/RTP в LAN. |
| `mobile/android/`, `mobile/ios/` | Каркасы клиентов из прошлых спринтов. **Внимание:** для приёма реального SIP-звонка нужно заменить заглушку `SipEngine` на linphone-sdk — это следующая итерация. На время проверки используйте бесплатный Linphone из стора. |
| `SPECIFICATION.md` | Полное ТЗ (для будущих фич сверх MVP). |

## Быстрый старт

```bash
# 1. Asterisk
cd infra
# отредактируйте asterisk/pjsip.conf — пароли <PANEL_PASS>, <MOBILE_PASS>
# отредактируйте asterisk/extensions.conf — INTERNAL_SECRET
docker compose up -d asterisk

# 2. API
cd ../backend
pnpm install
cp .env.example .env  # отредактируйте под свою сеть и панель
pnpm start
```

Дальше — по [MVP-RUN.md](./MVP-RUN.md).

## Зачем именно так

- **SQLite через `node:sqlite`** вместо Postgres — ноль операционной нагрузки
  для одной панели и одного-двух жителей. Никаких миграций, нативных
  зависимостей, пересборки при `pnpm install`.
- **Asterisk в `host` mode** — SIP и RTP идут напрямую между Asterisk и панелью
  в одной сети, без проброса портов и NAT-боли.
- **Интеркомы в env**, не в БД — для MVP с одной панелью CRUD-формы для
  привязки квартир/жителей только мешают; добавите когда станет нужно.
- **Открытие двери двумя путями** — DTMF в звонке (надёжно для DNAKE) +
  HTTP API панели (для кнопки «Открыть» вне звонка).
- **WebSocket для iOS вместо APNs VoIP** — без Apple Developer ($99/год)
  принимать звонки на заблокированном iPhone технически невозможно.
  WebSocket даёт нотификации хотя бы при открытом приложении.

Это сознательное сужение скоупа. ТЗ на полноценное B2B2C-приложение
(квартиры, УК, ЖКХ, чат) лежит в [SPECIFICATION.md](./SPECIFICATION.md) и
будет реализовано после успешной проверки железного MVP.
