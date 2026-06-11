package ru.domofon.app.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.AnnouncementDto
import ru.domofon.app.network.ChatMessageDto
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.SendMessageBody
import javax.inject.Inject

data class ChatUiState(
    val apartmentId: String? = null,
    val messages: List<ChatMessageDto> = emptyList(),
    val announcements: List<AnnouncementDto> = emptyList(),
    val input: String = "",
    val loading: Boolean = false,
    val error: String? = null
)

/**
 * MVP: история по REST + поллинг каждые 5 с.
 * TODO: заменить на Socket.IO клиент (io.socket:socket.io-client) с комнатой apartment:<id>.
 */
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val api: DomofonApi
) : ViewModel() {
    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    init {
        bootstrap()
    }

    private fun bootstrap() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            runCatching {
                val apartment = api.apartments().firstOrNull()?.apartment?.id
                val announcements = api.announcements()
                apartment to announcements
            }
                .onSuccess { (apartmentId, announcements) ->
                    _state.update {
                        it.copy(loading = false, apartmentId = apartmentId, announcements = announcements)
                    }
                    if (apartmentId != null) startPolling(apartmentId)
                }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Ошибка сети") }
                }
        }
    }

    private fun startPolling(apartmentId: String) {
        viewModelScope.launch {
            while (true) {
                runCatching { api.chatMessages(apartmentId) }
                    .onSuccess { page ->
                        _state.update { it.copy(messages = page.items.reversed()) }
                    }
                delay(5_000)
            }
        }
    }

    fun onInputChange(value: String) = _state.update { it.copy(input = value) }

    fun send() {
        val apartmentId = _state.value.apartmentId ?: return
        val text = _state.value.input.trim()
        if (text.isEmpty()) return
        viewModelScope.launch {
            runCatching { api.sendMessage(SendMessageBody(apartmentId, text)) }
                .onSuccess { message ->
                    _state.update { it.copy(input = "", messages = it.messages + message) }
                }
                .onFailure {
                    _state.update { it.copy(error = "Не удалось отправить") }
                }
        }
    }
}
