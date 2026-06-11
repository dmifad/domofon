package ru.domofon.app.intercoms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.IntercomDto
import javax.inject.Inject

data class IntercomsUiState(
    val items: List<IntercomDto> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val openingId: String? = null,
    val openedId: String? = null
)

@HiltViewModel
class IntercomsViewModel @Inject constructor(
    private val api: DomofonApi
) : ViewModel() {
    private val _state = MutableStateFlow(IntercomsUiState())
    val state: StateFlow<IntercomsUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { api.intercoms() }
                .onSuccess { items -> _state.update { it.copy(loading = false, items = items) } }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Ошибка сети") }
                }
        }
    }

    fun openDoor(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(openingId = id, openedId = null) }
            runCatching { api.openDoor(id) }
                .onSuccess { _state.update { it.copy(openingId = null, openedId = id) } }
                .onFailure {
                    _state.update { it.copy(openingId = null, error = "Не удалось открыть дверь") }
                }
        }
    }
}
