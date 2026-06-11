package ru.domofon.app.push

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.RegisterDeviceBody
import ru.domofon.app.network.TokenStore
import javax.inject.Inject

@AndroidEntryPoint
class DomofonMessagingService : FirebaseMessagingService() {
    @Inject lateinit var api: DomofonApi
    @Inject lateinit var tokens: TokenStore

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        if (!tokens.isLoggedIn) return
        scope.launch {
            runCatching { api.registerDevice(RegisterDeviceBody(pushToken = token)) }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        when (data["type"]) {
            "call.incoming" -> {
                // TODO sprint 2: TelecomManager.addNewIncomingCall → ConnectionService
            }
            "event.new" -> {
                // TODO sprint 3: local notification with snapshot
            }
        }
    }
}
