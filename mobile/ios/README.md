# Domofon — iOS

Swift 5.10 + SwiftUI + Alamofire + KeychainAccess + CallKit + PushKit (VoIP).
Проект генерируется через [XcodeGen](https://github.com/yonaskolb/XcodeGen) из `project.yml`.

## Требования

- macOS 14+, Xcode 16
- Swift 5.10
- iOS deployment target: 16.0
- `brew install xcodegen`

## Генерация и запуск

```
cd mobile/ios
xcodegen generate
open Domofon.xcodeproj
```

## Ключевые модули (план)

- Auth (SMS OTP)
- Intercoms — список домофонов, открытие двери
- Call — CallKit + PushKit (VoIP push) + SIP-стек (linphone-sdk)
- Cameras — AVPlayer (HLS) + RTSP через MobileVLCKit
- Events — журнал с превью
- Billing — счета ЖКХ, Apple Pay / СБП
- Chat — с управляющей компанией
