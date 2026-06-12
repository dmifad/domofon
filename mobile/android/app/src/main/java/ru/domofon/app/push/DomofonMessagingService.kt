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
import ru.domofon.app.network.SessionStore
import ru.domofon.app.sip.SipService
import javax.inject.Inject

@AndroidEntryPoint
class DomofonMessagingService : FirebaseMessagingService() {

    @Inject lateinit var api: DomofonApi
    @Inject lateinit var session: SessionStore

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        if (!session.isLoggedIn) return
        scope.launch {
            runCatching { api.registerDevice(RegisterDeviceBody(pushToken = token)) }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        when (message.data["type"]) {
            "call.incoming" -> {
                // Будим SIP-сервис: панель уже звонит, SIP-стек получит INVITE
                // через мгновение после регистрации.
                SipService.start(this)
            }
        }
    }
}
