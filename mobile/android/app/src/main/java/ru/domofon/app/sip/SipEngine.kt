package ru.domofon.app.sip

import android.content.Context
import android.view.TextureView
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.linphone.core.Account
import org.linphone.core.Call
import org.linphone.core.Core
import org.linphone.core.CoreListenerStub
import org.linphone.core.Factory
import org.linphone.core.RegistrationState
import org.linphone.core.TransportType
import javax.inject.Inject
import javax.inject.Singleton

sealed interface SipUiState {
    data object Idle : SipUiState
    data object Registering : SipUiState
    data object Registered : SipUiState
    data class RegistrationFailed(val message: String) : SipUiState
    data class Ringing(val remoteName: String) : SipUiState
    data object InCall : SipUiState
}

/**
 * Обёртка над linphone-sdk-android.
 * Видео: принимаем (S213 шлёт H.264), своё не отправляем.
 */
@Singleton
class SipEngine @Inject constructor(@ApplicationContext private val context: Context) {

    private var core: Core? = null
    private val _state = MutableStateFlow<SipUiState>(SipUiState.Idle)
    val state: StateFlow<SipUiState> = _state.asStateFlow()

    /** Колбэк для сервиса: показать UI входящего звонка. */
    var onIncomingCall: ((remoteName: String) -> Unit)? = null
    var onCallEnded: (() -> Unit)? = null

    private val listener = object : CoreListenerStub() {
        override fun onCallStateChanged(core: Core, call: Call, state: Call.State?, message: String) {
            when (state) {
                Call.State.IncomingReceived -> {
                    val remote = call.remoteAddress.displayName
                        ?: call.remoteAddress.username
                        ?: "Домофон"
                    _state.value = SipUiState.Ringing(remote)
                    onIncomingCall?.invoke(remote)
                }
                Call.State.Connected, Call.State.StreamsRunning -> {
                    _state.value = SipUiState.InCall
                }
                Call.State.End, Call.State.Released, Call.State.Error -> {
                    if (_state.value is SipUiState.Ringing || _state.value is SipUiState.InCall) {
                        _state.value = SipUiState.Registered
                        onCallEnded?.invoke()
                    }
                }
                else -> Unit
            }
        }

        override fun onAccountRegistrationStateChanged(
            core: Core,
            account: Account,
            state: RegistrationState?,
            message: String
        ) {
            when (state) {
                RegistrationState.Ok -> _state.value = SipUiState.Registered
                RegistrationState.Progress -> _state.value = SipUiState.Registering
                RegistrationState.Failed ->
                    _state.value = SipUiState.RegistrationFailed(message)
                else -> Unit
            }
        }
    }

    fun start(domain: String, username: String, password: String) {
        if (core != null) return
        val factory = Factory.instance()
        val newCore = factory.createCore(null, null, context)

        newCore.isVideoCaptureEnabled = false
        newCore.isVideoDisplayEnabled = true
        newCore.videoActivationPolicy.automaticallyAccept = true

        val params = newCore.createAccountParams()
        params.identityAddress = factory.createAddress("sip:$username@$domain")
        val server = factory.createAddress("sip:$domain")
        server?.transport = TransportType.Udp
        params.serverAddress = server
        params.isRegisterEnabled = true

        newCore.addAuthInfo(
            factory.createAuthInfo(username, null, password, null, null, domain, null)
        )
        val account = newCore.createAccount(params)
        newCore.addAccount(account)
        newCore.defaultAccount = account

        newCore.addListener(listener)
        newCore.start()
        core = newCore
        _state.value = SipUiState.Registering
    }

    fun stop() {
        core?.removeListener(listener)
        core?.stop()
        core = null
        _state.value = SipUiState.Idle
    }

    fun answer() {
        val call = core?.currentCall ?: core?.calls?.firstOrNull() ?: return
        val params = core?.createCallParams(call)
        params?.isVideoEnabled = true
        if (params != null) call.acceptWithParams(params) else call.accept()
    }

    fun decline() {
        (core?.currentCall ?: core?.calls?.firstOrNull())?.decline(org.linphone.core.Reason.Declined)
    }

    fun hangup() {
        core?.currentCall?.terminate()
        core?.calls?.forEach { it.terminate() }
    }

    fun toggleMicrophone(): Boolean {
        val c = core ?: return false
        c.isMicEnabled = !c.isMicEnabled
        return c.isMicEnabled
    }

    /** Привязка TextureView, в который linphone рендерит видео с панели. */
    fun bindVideoSurface(view: TextureView) {
        core?.nativeVideoWindowId = view
    }

    fun unbindVideoSurface() {
        core?.nativeVideoWindowId = null
    }
}
