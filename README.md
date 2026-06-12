# Домофон — MVP

Свои Android и iOS клиенты для домофона **DNAKE S213** в локальной сети.

**Стек:** NestJS + SQLite + Asterisk + MediaMTX → Kotlin/Compose + Swift/SwiftUI.
SIP-стек на Android — `linphone-sdk-android`, на iOS — `linphonesw` (опционально, заглушка работает с Socket.IO).

## Что должно получиться

- Жмёте кнопку на S213 → Android и iOS показывают экран входящего.
- Отвечаете → голос + видео с панели (Android — через linphone, iOS — на следующей итерации).
- Кнопка «Открыть дверь» работает и в звонке (DTMF `#`), и из списка (HTTP API панели).
- В списке домофонов — live RTSP preview панели.

## Подготовка

### 1. Сервер (Linux/Mac в той же LAN, что и панель)

```bash
# Зависимости
cd infra && docker compose up -d   # Postgres не нужен — используется SQLite

# API
cd ../backend
cp .env.example .env
# В .env правим под себя:
#   SIP_DOMAIN       = IP вашего сервера в LAN (например 192.168.1.10)
#   INTERCOM_RTSP_URL = rtsp://admin:<пароль>@<IP-панели>:554/0
#   INTERCOM_OPEN_URL = HTTP-эндпойнт открытия панели (см. док DNAKE)
#   INTERCOM_OPEN_AUTH = admin:<пароль>
#   USERS = demo:1234:user1:<пароль-в-pjsip.conf>
pnpm install
pnpm start:dev
# → API на http://<server-ip>:3000/api/v1
```

### 2. DNAKE S213 — настройка SIP

Через веб-интерфейс панели (`http://<IP-панели>`, дефолт `admin/admin`):

1. **SIP Account** → SIP Server: `<IP-сервера>`, Port: `5060`,
   Username: `panel1`, Password: `<тот же, что в pjsip.conf [panel1-auth]>`.
2. **Phonebook** → один контакт: `101` (extension, на который вы хотите звонить).
3. **Door Settings** → DTMF Unlock Code: `#`.
4. **Camera** → RTSP Enable: `On`. Запомните URL: обычно `rtsp://admin:<pwd>@<ip>:554/0`.

Затем правим `infra/asterisk/pjsip.conf`:
- `<PANEL_PASS>` — пароль панели
- `<MOBILE_PASS>` — пароль для `user1` (тот же, что в `USERS` в `.env`)

```bash
docker compose restart asterisk
# Проверить регистрацию: docker exec -it infra-asterisk-1 asterisk -rx "pjsip show endpoints"
```

### 3. Android

```bash
cd mobile/android
# IP сервера зашивается в билд:
./gradlew :app:assembleDebug -PapiBase=http://192.168.1.10:3000
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Логин на устройстве: `demo` / `1234` (см. `USERS` в `.env`).

После логина приложение запускает foreground-сервис, регистрируется в Asterisk
как `user1` и ждёт звонков. На главном экране — RTSP-preview панели и кнопка
«Открыть дверь».

### 4. iOS

```bash
cd mobile/ios
brew install xcodegen
xcodegen generate
open Domofon.xcodeproj
```

В Xcode:
1. Подпишите бандл (Team → ваш Apple ID).
2. Запустите на устройстве (симулятор не умеет RTSP видео).
3. При первом входе укажите URL backend: `http://192.168.1.10:3000/api/v1`,
   логин `demo`, PIN `1234`.

**Текущий статус iOS:** работает логин, список панелей, RTSP-preview (VLCKit),
открытие двери. Входящие звонки приходят по Socket.IO (UI входящего показывается),
но реальное SIP-аудио ждёт интеграции `linphonesw` — стаб помечен `TODO` в
`SIP/SipEngine.swift`.

## Тестовый сценарий звонка

1. Запустите backend (`pnpm start:dev`), убедитесь что Asterisk и панель
   зарегистрированы:
   ```
   docker exec -it infra-asterisk-1 asterisk -rx "pjsip show endpoints"
   ```
   Должны быть `panel1` и `user1` в статусе `Available`.

2. Запустите Android (или iOS), войдите. На главном экране должен загореться
   индикатор `SIP: на связи ✓`.

3. На панели DNAKE нажмите кнопку вызова **101** (или вашего extension).
   Дальше последовательно:
   - Asterisk принимает звонок (`from-intercom`).
   - Диалплан зовёт `POST /internal/calls/incoming` → backend записывает звонок и
     рассылает push (FCM Android + Socket.IO iOS).
   - Android: SIP-стек получает INVITE → ConnectionService показывает входящий →
     отвечаете → звук в обе стороны + видео с панели.
   - iOS: WebSocket-событие показывает экран входящего; реальный SIP — после
     `linphonesw`.
   - Кнопка «Открыть дверь» в звонке → backend через ARI шлёт DTMF `#` → панель
     открывает замок.

## Структура

| Папка | Содержание |
|---|---|
| `backend/` | NestJS API, SQLite, FCM, Socket.IO |
| `backend/src/config/intercoms.ts` | Конфигурация панелей через env |
| `infra/asterisk/` | `pjsip.conf`, `extensions.conf` под DNAKE S213 |
| `infra/docker-compose.yml` | Asterisk + MediaMTX + MinIO (опционально) |
| `mobile/android/` | Kotlin, Compose, Hilt, linphone-sdk, ExoPlayer RTSP, FCM |
| `mobile/ios/` | SwiftUI, MobileVLCKit RTSP, Socket.IO, linphonesw (TODO) |

## Что осталось (после первого успешного звонка)

- [ ] iOS: интегрировать `linphonesw`, заменить `SipEngine` стаб.
- [ ] Подключить FCM в проде: положить service-account JSON в путь
  `FCM_CREDENTIALS_PATH`, без него Android push работает только когда приложение
  на переднем плане.
- [ ] Asterisk TLS (5061) + SRTP для прода.
- [ ] Несколько панелей (`INTERCOM_2_*`, `INTERCOM_3_*` — уже поддерживается).
