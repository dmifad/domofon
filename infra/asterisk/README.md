# Asterisk

Конфиги PJSIP-телефонии для Domofon. Монтируются в `/etc/asterisk` контейнера.

## Потоки

1. Панель (intercom) звонит по номеру квартиры → попадает в контекст `from-intercom`.
2. Dialplan вызывает webhook backend `POST /internal/calls/incoming` → получает `callId` и `sipUri`.
3. Backend рассылает VoIP/FCM push клиентам жильцов; в push передаётся `sipUri`.
4. Asterisk параллельно дозванивается на эту группу: `Dial(PJSIP/${SIP_URI})`.
5. По завершению — webhook `internal/calls/end` или `internal/calls/missed`.

## Файлы

- `pjsip.conf` — endpoints панелей (статика) и шаблон мобильных клиентов.
- `extensions.conf` — dialplan, webhook к backend через `CURL()`.
- `rtp.conf` — диапазон RTP-портов и STUN.

## TODO

- Динамическая регистрация мобильных endpoint'ов через ARI (когда пользователь
  привязывает устройство, backend создаёт PJSIP endpoint через ARI POST).
- TLS-сертификаты для transport-tls (Let's Encrypt).
- Альтернатива: использовать [Realtime PJSIP](https://wiki.asterisk.org/wiki/display/AST/PJSIP+Realtime)
  с хранением в Postgres — endpoints/auths/aors читаются из БД, backend пишет напрямую.
