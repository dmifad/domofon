package ru.domofon.app.sip

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

enum class SipCallState { Idle, Connecting, Connected, Ended, Error }

data class SipCallContext(val sipUri: String, val state: SipCallState)

/**
 * Минимальный интерфейс SIP-стека. Реальная реализация — linphone-sdk
 * (org.linphone:linphone-sdk-android), подключается отдельным модулем
 * `:sip-linphone` чтобы не таскать ~70 МБ нативного кода в каждом билде.
 *
 * В этом спринте — заглушка, чтобы протестировать UI/CallKit/ConnectionService
 * без зависимости от железа. Сценарий звонка:
 *   1. FCM-пуш создаёт ConnectionService-соединение.
 *   2. Пользователь жмёт "Ответить" → SipEngine.answer(sipUri).
 *   3. Заглушка эмулирует "Connected" через 500 мс.
 */
@Singleton
class SipEngine @Inject constructor() {
    private val _state = MutableStateFlow(SipCallContext("", SipCallState.Idle))
    val state: StateFlow<SipCallContext> = _state.asStateFlow()

    suspend fun answer(sipUri: String) {
        _state.value = SipCallContext(sipUri, SipCallState.Connecting)
        kotlinx.coroutines.delay(500)
        _state.value = SipCallContext(sipUri, SipCallState.Connected)
        // TODO: linphone Core registration + Call.acceptEarlyMedia / accept
    }

    fun hangup() {
        _state.value = _state.value.copy(state = SipCallState.Ended)
        // TODO: linphone Call.terminate
    }
}
