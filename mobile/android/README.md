# Domofon — Android

Kotlin 2.0 + Jetpack Compose + Hilt + Retrofit + Media3 (ExoPlayer для RTSP/HLS) + WebRTC + Firebase Messaging.

## Требования

- Android Studio Ladybug (AGP 8.6+)
- JDK 17
- Android SDK 35

## Сборка

```
./gradlew :app:assembleDebug
```

## Ключевые модули (план)

- `auth/` — OTP по SMS, JWT refresh
- `call/` — Telecom ConnectionService + SIP-стек (PJSIP/linphone)
- `cameras/` — список и плеер (RTSP/HLS)
- `events/` — журнал событий
- `billing/` — счета, оплата (СБП/карта)
- `chat/` — чат с УК
- `push/` — Firebase Messaging, VoIP/high-priority
