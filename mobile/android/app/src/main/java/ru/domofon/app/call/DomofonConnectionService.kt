package ru.domofon.app.call

import android.content.Intent
import android.net.Uri
import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.DisconnectCause
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import androidx.core.os.bundleOf
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.sip.SipEngine
import javax.inject.Inject

@AndroidEntryPoint
class DomofonConnectionService : ConnectionService() {

    @Inject lateinit var api: DomofonApi
    @Inject lateinit var sipEngine: SipEngine

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreateIncomingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection {
        val data = request?.extras
            ?.getBundle(CallNotifier.KEY_CALL_DATA)
            ?.getParcelable<IncomingCallData>(CallNotifier.KEY_CALL_DATA)

        return DomofonConnection(data).apply {
            setRinging()
            setAddress(
                Uri.fromParts("sip", data?.sipUri?.removePrefix("sip:") ?: "unknown", null),
                TelecomManager.PRESENTATION_ALLOWED
            )
            setCallerDisplayName(
                data?.intercomName ?: "Домофон",
                TelecomManager.PRESENTATION_ALLOWED
            )
            extras = bundleOf(CallNotifier.KEY_CALL_DATA to data)
        }
    }

    override fun onCreateIncomingConnectionFailed(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ) {
        // no-op
    }

    private inner class DomofonConnection(private val data: IncomingCallData?) : Connection() {
        init {
            connectionCapabilities = CAPABILITY_MUTE or CAPABILITY_SUPPORT_HOLD
            audioModeIsVoip = true
        }

        override fun onAnswer() {
            super.onAnswer()
            val callData = data ?: run {
                setDisconnected(DisconnectCause(DisconnectCause.ERROR))
                destroy()
                return
            }
            setActive()
            scope.launch {
                runCatching { api.answerCall(callData.callId) }
                runCatching { sipEngine.answer(callData.sipUri) }
            }
            startActivity(
                Intent(this@DomofonConnectionService, ActiveCallActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .putExtra(EXTRA_CALL_DATA, callData)
            )
        }

        override fun onReject() {
            super.onReject()
            scope.launch {
                data?.let { runCatching { api.declineCall(it.callId) } }
            }
            setDisconnected(DisconnectCause(DisconnectCause.REJECTED))
            destroy()
        }

        override fun onDisconnect() {
            super.onDisconnect()
            sipEngine.hangup()
            setDisconnected(DisconnectCause(DisconnectCause.LOCAL))
            destroy()
        }
    }

    companion object {
        const val EXTRA_CALL_DATA = "ru.domofon.extra.call_data"
    }
}
