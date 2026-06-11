package ru.domofon.app.events

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.EventDto
import javax.inject.Inject

data class EventsUiState(
    val items: List<EventDto> = emptyList(),
    val nextCursor: String? = null,
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class EventsViewModel @Inject constructor(
    private val api: DomofonApi
) : ViewModel() {
    private val _state = MutableStateFlow(EventsUiState())
    val state: StateFlow<EventsUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { api.events() }
                .onSuccess { page ->
                    _state.update {
                        it.copy(loading = false, items = page.items, nextCursor = page.nextCursor)
                    }
                }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Ошибка сети") }
                }
        }
    }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        viewModelScope.launch {
            runCatching { api.events(cursor) }
                .onSuccess { page ->
                    _state.update {
                        it.copy(items = it.items + page.items, nextCursor = page.nextCursor)
                    }
                }
        }
    }
}
