# План проверки MVP (DNAKE S213 + Android + iOS)

Каждый этап проверяется отдельно — не переходите к следующему, пока не зелёный
текущий. Так любая проблема локализуется за минуты, а не часы.

Обозначения: `SRV` — IP сервера в LAN (например `192.168.1.10`),
`PNL` — IP панели S213.

---

## Этап 0. Сеть (5 мин)

```bash
ping <PNL>            # панель отвечает
ping <SRV>            # сервер отвечает (с телефона — открыть http://<SRV>:3000 в браузере)
```

Телефоны — в том же Wi-Fi/VLAN, что и сервер с панелью.
**Если нет** — проверьте изоляцию клиентов в настройках точки доступа
(AP/Client isolation должен быть выключен).

---

## Этап 1. Backend (10 мин)

```bash
cd backend && cp .env.example .env
# Правим: SIP_DOMAIN=<SRV>, INTERCOM_RTSP_URL, INTERCOM_OPEN_URL/AUTH, USERS
pnpm install && pnpm start:dev
```

Проверка с любой машины в LAN:

```bash
# 1. Логин
curl -s -X POST http://<SRV>:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"demo","pin":"1234"}'
# Ожидание: {"token":"...","userId":"demo","sip":{"domain":"<SRV>","username":"user1","password":"..."}}

# 2. Список панелей (подставьте token)
curl -s http://<SRV>:3000/api/v1/intercoms -H 'Authorization: Bearer <token>'
# Ожидание: [{"id":"panel1","name":"Подъезд 1","rtspUrl":"rtsp://..."}]
```

**Если sip:null** — в `USERS` нет 4 полей (`name:pin:sipUser:sipPass`) или пустой `SIP_DOMAIN`.

---

## Этап 2. Asterisk (10 мин)

```bash
# Прописать пароли в infra/asterisk/pjsip.conf (<PANEL_PASS>, <MOBILE_PASS>)
cd infra && docker compose up -d asterisk
docker exec -it $(docker ps -qf name=asterisk) asterisk -rx "pjsip show endpoints"
```

Ожидание: endpoints `panel1` и `user1` существуют (пока `Unavailable` — никто
не зарегистрирован, это нормально).

**Полезно включить логи SIP:**
```bash
docker exec -it $(docker ps -qf name=asterisk) asterisk -rx "pjsip set logger on"
docker logs -f $(docker ps -qf name=asterisk)
```

---

## Этап 3. Регистрация панели S213 (15 мин)

В веб-интерфейсе панели (`http://<PNL>`, обычно `admin/admin`):
SIP Server `<SRV>:5060`, Username `panel1`, Password из `pjsip.conf`.

```bash
docker exec -it $(docker ps -qf name=asterisk) asterisk -rx "pjsip show contacts"
```

Ожидание: контакт `panel1/sip:...@<PNL>` в статусе `Avail`.

**Если Unavail/нет контакта:** смотрите `pjsip set logger on` — чаще всего
неверный пароль (401) или панель шлёт на другой порт.

---

## Этап 4. RTSP с панели (5 мин)

С ноутбука в LAN:

```bash
ffplay "rtsp://admin:<pwd>@<PNL>:554/0"    # или VLC → Open Network Stream
```

Ожидание: живое видео с камеры панели, задержка ≤ 2 с.
URL, который заработал, и есть значение `INTERCOM_RTSP_URL` в `.env`.

---

## Этап 5. Открытие двери по HTTP без звонка (10 мин)

```bash
curl -s -X POST http://<SRV>:3000/api/v1/intercoms/panel1/open \
  -H 'Authorization: Bearer <token>'
# Ожидание: {"opened":true,"method":"http"} и щелчок реле на панели
```

**Если opened:false** — проверьте `INTERCOM_OPEN_URL` напрямую:
`curl -u admin:<pwd> -X POST http://<PNL>/<unlock-endpoint>`. Точный CGI-путь
зависит от прошивки S213 — смотрите док DNAKE или вкладку Network в браузере,
когда открываете дверь из веб-интерфейса панели.

---

## Этап 6. Android: сборка и SIP-регистрация (20 мин)

```bash
cd mobile/android
./gradlew :app:assembleDebug -PapiBase=http://<SRV>:3000
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

На телефоне: логин `demo`/`1234` → разрешить микрофон и уведомления.
Ожидание: на главном экране `SIP: на связи ✓` и RTSP-превью панели.

Подтверждение со стороны Asterisk:
```bash
docker exec -it $(docker ps -qf name=asterisk) asterisk -rx "pjsip show contacts"
# Должен появиться второй контакт: user1/sip:...@<IP телефона>
```

**Если `SIP: ошибка`** — `adb logcat | grep -iE "linphone|sip"`; обычно это
неверный пароль или firewall на 5060/udp.

---

## Этап 7. Тестовый звонок БЕЗ панели (10 мин)

Прежде чем жать кнопку на S213, проверьте цепочку Asterisk → Android отдельно:

```bash
docker exec -it $(docker ps -qf name=asterisk) \
  asterisk -rx 'channel originate PJSIP/user1 application Playback hello-world'
```

Ожидание: Android показывает полноэкранный входящий → «Ответить» → слышно
«hello world».

Это самый важный промежуточный тест: если он работает, всё, что останется —
вход со стороны панели.

---

## Этап 8. Полный звонок с панели (15 мин)

Нажмите кнопку вызова на S213 (extension `101`).

Ожидаемая цепочка (проверяйте в этом порядке при сбое):

| # | Что происходит | Где смотреть |
|---|---|---|
| 1 | Панель шлёт INVITE | `docker logs asterisk` (pjsip logger) |
| 2 | Dialplan зовёт webhook | лог backend: `POST /internal/calls/incoming` |
| 3 | Backend пишет звонок + шлёт push | лог backend |
| 4 | Asterisk набирает user1 | `Dial(PJSIP/user1...)` в логе |
| 5 | Android показывает входящий | экран телефона |
| 6 | Ответ → аудио в обе стороны | говорите в панель/телефон |
| 7 | Видео с панели в звонке | картинка в CallActivity |
| 8 | «Открыть дверь» → DTMF `#` | лог backend `DTMF # sent via ARI`, реле |

**Типовые проблемы:**
- Шаг 4 молчит → в `extensions.conf` блок `[globals]` `BACKEND_URL` должен быть
  достижим **из контейнера** (для Linux-хоста: `http://172.17.0.1:3000/api/v1`
  вместо `host.docker.internal`).
- Шаг 6: звук в одну сторону → NAT/RTP; проверьте `rtp_symmetric=yes`,
  `force_rport=yes` в `pjsip.conf` (уже стоят) и что 10000-10100/udp открыты.
- Шаг 7: нет видео → S213 должен слать H.264; проверьте `allow=h264` у обоих
  endpoint'ов и включённое видео в настройках панели (SIP Video: On).
- Шаг 8: реле не щёлкает → проверьте, что в панели DTMF Unlock = `#` и метод
  DTMF = RFC2833 (в S213: SIP Setting → DTMF Type).

---

## Этап 9. Пропущенный звонок (5 мин)

Позвоните с панели и не отвечайте 30 с.

```bash
curl -s http://<SRV>:3000/api/v1/calls -H 'Authorization: Bearer <token>'
# Ожидание: первый элемент со status="missed"
```

---

## Этап 10. iOS (30 мин)

```bash
cd mobile/ios && xcodegen generate && open Domofon.xcodeproj
```

Run на устройстве (не симулятор). На экране логина: URL `http://<SRV>:3000/api/v1`,
`demo`/`1234`.

Проверяем:
1. Список панелей + RTSP-превью (VLCKit).
2. «Открыть дверь» → `{"opened":true}` + реле.
3. Звонок с панели при **открытом приложении** → оверлей входящего
   (приходит по WebSocket). Аудио пока нет — это следующая итерация
   (linphonesw, TODO в `SIP/SipEngine.swift`).

---

## Этап 11 (опционально). FCM для Android в фоне

Без этого Android принимает звонки, пока жив foreground-сервис (запускается
при входе и на onResume). Чтобы будить убитое приложение:

1. Firebase Console → создать проект → Android-приложение `ru.domofon.app.debug`.
2. `google-services.json` → `mobile/android/app/`, плагин
   `com.google.gms.google-services` в gradle.
3. Service account JSON → серверу, путь в `FCM_CREDENTIALS_PATH`.
4. Убить приложение → позвонить с панели → телефон просыпается и звонит.

---

## Чек-лист готовности MVP

- [ ] Этап 5: дверь открывается из приложения без звонка
- [ ] Этап 7: тестовый звонок Asterisk → Android с аудио
- [ ] Этап 8: реальный звонок с панели с аудио + видео + DTMF-открытием
- [ ] Этап 9: missed фиксируется в истории
- [ ] Этап 10: iOS видит панель, открывает дверь, показывает входящий
