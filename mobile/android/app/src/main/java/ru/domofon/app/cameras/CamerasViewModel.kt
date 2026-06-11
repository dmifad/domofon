package ru.domofon.app.cameras

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.CameraDto
import ru.domofon.app.network.DomofonApi
import javax.inject.Inject

data class CamerasUiState(
    val items: List<CameraDto> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    /** id камеры → HLS URL активного просмотра. */
    val playingId: String? = null,
    val playingUrl: String? = null
)

@HiltViewModel
class CamerasViewModel @Inject constructor(
    private val api: DomofonApi
) : ViewModel() {
    private val _state = MutableStateFlow(CamerasUiState())
    val state: StateFlow<CamerasUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { api.cameras() }
                .onSuccess { items -> _state.update { it.copy(loading = false, items = items) } }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Ошибка сети") }
                }
        }
    }

    fun play(cameraId: String) {
        viewModelScope.launch {
            runCatching { api.cameraStream(cameraId) }
                .onSuccess { info ->
                    _state.update { it.copy(playingId = cameraId, playingUrl = info.hlsUrl) }
                }
                .onFailure {
                    _state.update { it.copy(error = "Не удалось получить поток") }
                }
        }
    }

    fun stop() {
        _state.update { it.copy(playingId = null, playingUrl = null) }
    }
}
