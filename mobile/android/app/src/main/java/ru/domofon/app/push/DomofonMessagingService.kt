package ru.domofon.app.push

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class DomofonMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // TODO: send FCM token to backend (POST /devices)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        when (data["type"]) {
            "call.incoming" -> {
                // TODO: trigger TelecomManager.addNewIncomingCall → ConnectionService
            }
            "event.new" -> {
                // TODO: post local notification
            }
        }
    }
}
