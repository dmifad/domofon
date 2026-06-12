# Запуск MVP на железе (DNAKE S213 + Android + iOS)

Этот документ — про реальную проверку, а не про разработку.
Всё пройдено сверху вниз — выполняйте по порядку.

## Что у вас есть, что должно быть на руках

- DNAKE S213 (или совместимая SIP-панель)
- Линукс-сервер в той же LAN, что и панель (далее `SERVER`, например `192.168.1.10`)
- Android-телефон (API 26+) в той же Wi-Fi
- iPhone (iOS 16+) в той же Wi-Fi
- Docker + Node 22 на сервере

IP-адреса в примерах:
- сервер: `192.168.1.10`
- панель S213: `192.168.1.50`

## 1. Поднять Asterisk и backend на сервере

```bash
git clone <repo> && cd domofon
cd backend && pnpm install
cp .env.example .env
# Откройте .env, поставьте:
#   INTERCOM_RTSP_URL=rtsp://admin:<пароль_панели>@192.168.1.50:554/0
#   INTERCOM_OPEN_URL=http://192.168.1.50/cgi-bin/door_unlock  (точный путь см. п. 2.3)
#   INTERCOM_OPEN_AUTH=admin:<пароль_панели>
#   ARI_URL=http://127.0.0.1:8088/ari
#   INTERNAL_API_SECRET=  (придумайте, тот же запишем в asterisk extensions.conf)

cd ../infra/asterisk
# Откройте pjsip.conf, замените <PANEL_PASS> и <MOBILE_PASS> на свои.
# Откройте extensions.conf, замените INTERNAL_SECRET= на тот же, что в backend/.env.

cd ../  # /infra
docker compose up -d asterisk
docker compose logs -f asterisk    # убедитесь, что нет ошибок конфига
# Ctrl-C
```

Запустите API:
```bash
cd ../backend && pnpm start
# Должна быть строка: Domofon API on http://0.0.0.0:3000
```

Проверка:
```bash
curl -X POST http://192.168.1.10:3000/api/v1/auth/login \
  -H 'content-type: application/json' -d '{"username":"demo","pin":"1234"}'
# {"token":"...","userId":"demo"}
```

## 2. Настроить DNAKE S213

### 2.1 SIP-аккаунт

Зайдите в веб-интерфейс панели (`http://192.168.1.50`, дефолтный логин обычно `admin/admin`):

- **Network → SIP** (или **Configuration → SIP Account**):
  - SIP Server: `192.168.1.10`
  - Port: `5060`
  - Transport: `UDP`
  - Username: `panel1`
  - Password: тот же `<PANEL_PASS>` что в `pjsip.conf`
  - Display name: `panel1`
  - Register: включено

- **Call Settings**:
  - Auto-dial number: `101` (или любой extension; диалплан принимает любой `_X.`)
  - Call timeout: `30s`

Сохраните, перезагрузите панель. В веб-интерфейсе должно быть `Registered`.

Проверьте на сервере:
```bash
docker exec -it infra-asterisk-1 asterisk -rx 'pjsip show endpoints'
# panel1 должен быть Avail
```

### 2.2 RTSP

В разделе **Camera / Video Stream** или **Surveillance** найдите RTSP-URL вида:
```
rtsp://admin:<пароль>@192.168.1.50:554/0       — основной поток (1080p)
rtsp://admin:<пароль>@192.168.1.50:554/1       — sub-stream (320p, легче для мобилок)
```

Проверьте с компа:
```bash
ffplay rtsp://admin:<пароль>@192.168.1.50:554/1
```

Запишите URL в `backend/.env` как `INTERCOM_RTSP_URL=…`.

### 2.3 HTTP-открытие двери

DNAKE S213 принимает команду открытия по HTTP. Точный endpoint
зависит от прошивки — выбирайте один из:

```bash
# Вариант A (старые прошивки)
curl -u admin:<пароль> -X POST http://192.168.1.50/cgi-bin/door_unlock

# Вариант B (новые прошивки DnakeOS)
curl -u admin:<пароль> -X POST \
  http://192.168.1.50/api/door/unlock \
  -H 'content-type: application/json' -d '{"door":1}'
```

Какой сработал — пропишите в `INTERCOM_OPEN_URL` и `INTERCOM_OPEN_METHOD`.
Если ни один не открыл — оставьте `OPEN_URL` пустым: будет работать только DTMF в звонке.

### 2.4 DTMF

В **Call Settings → DTMF**:
- Mode: `RFC2833` (он же `RTP`)
- Unlock code: `#` (любой символ, который вы укажете в `INTERCOM_OPEN_DTMF`)

Этот код панель принимает в активном звонке и открывает замок.

## 3. Проверить SIP-звонок без мобильных приложений

Перед тем как возиться с Android/iOS, прогоните звонок через десктопный софтфон —
так вы изолируете проблемы Asterisk от проблем мобильного клиента.

1. Поставьте **Linphone Desktop** на ноутбук, тоже в LAN.
2. **Settings → Accounts → Add account → Use SIP account**:
   - Username: `user1`
   - Password: `<MOBILE_PASS>`
   - Domain: `192.168.1.10`
   - Transport: UDP
3. Должно быть `Registered`.
4. Нажмите кнопку вызова на S213.
5. На Linphone должен прийти входящий с видеопревью.
6. Ответьте → говорите.
7. Нажмите `#` на цифровой клавиатуре Linphone — замок щёлкнет.

Если этот шаг не работает — мобильные клиенты тоже не заработают.
Чаще всего проблема в одном из трёх:

| Симптом | Что смотреть |
|---|---|
| Панель не регистрируется | пароль в pjsip.conf vs S213, файрвол на 5060/udp |
| Linphone не регистрируется | то же для `user1` |
| Звонок идёт, видео нет | `allow=h264` в обоих endpoints, кодек включён в S213 |
| Звонок есть, голоса нет | NAT: убедитесь, что Asterisk и Linphone в одной подсети |
| DTMF не открывает | проверьте, что Mode=`RFC2833` в S213, а в звонке Asterisk видит DTMF: `core set debug 3`, потом `pjsip set logger on` |

## 4. Android-клиент

Текущий код Android-клиента в `mobile/android/` **не годится** для приёма
звонка в LAN-MVP — там заглушка SIP. Чтобы получить рабочий MVP, нужно
заменить заглушку `SipEngine` на linphone-sdk-android.

Это объёмная задача (~1 день работы): подключить артефакт
`org.linphone:linphone-sdk-android:5.3.20`, создать `Core`, зарегистрировать
SIP-аккаунт, прикрутить `Core.iterate()` к ConnectionService.

**В этом проходе Android-клиент не переписан.** Для немедленной проверки
звонка с S213 используйте п. 3 (Linphone Desktop) или приложение
**Linphone** из Google Play — оно работает с теми же SIP-credentials.

Эпизод с реальным Android-клиентом будет следующей итерацией.

## 5. iOS-клиент

То же самое: без $99/год Apple Developer **VoIP-push не работает**, а без
него iOS не может принять звонок при заблокированном экране. Поэтому для
MVP-проверки с iPhone используйте бесплатный **Linphone** из App Store —
авторизация теми же credentials (`user1` / `<MOBILE_PASS>` / `192.168.1.10`).

Кастомный iOS-клиент с WebSocket-нотификациями (звонки только при открытом
приложении) — следующая итерация.

## 6. Что протестировано на этом этапе

Если шаги 1–3 проходят успешно, вы имеете рабочий end-to-end путь:

```
S213 (звонок) → Asterisk → webhook → backend (создал call, разослал push) →
Linphone (звонит, видео есть) → ответ → DTMF '#' → дверь открыта
```

То есть железо, серверная обвязка и SIP-стек — рабочие. Дальше остаётся
заменить Linphone на ваши собственные Android- и iOS-приложения, что
делается итеративно: сначала Android (linphone-sdk-android достаточно
зрелый), потом iOS.

## Частые ошибки

- **Бэкенд видит 401 на webhook** — `INTERNAL_API_SECRET` в `.env` отличается
  от `INTERNAL_SECRET` в `extensions.conf`.
- **Asterisk не дозванивается до user1** — Linphone не зарегистрирован, или
  `qualify` показывает Unavailable. Проверьте `pjsip show endpoint user1`.
- **`host.docker.internal` не резолвится** — это Docker Desktop only. На Linux
  замените в `extensions.conf` на IP сервера в Docker-bridge (`172.17.0.1`)
  или используйте `network_mode: host` для asterisk (уже сделано).
- **Открытие двери HTTP 401** — `INTERCOM_OPEN_AUTH` в формате `user:pass`,
  не base64. Backend сам кодирует.
- **DTMF не приходит** — на S213 переключите DTMF Mode на RFC2833. SIP INFO
  тоже работает, но требует другого диалплана.
