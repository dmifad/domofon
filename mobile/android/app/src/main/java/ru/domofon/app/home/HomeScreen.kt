package ru.domofon.app.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.IntercomDto
import ru.domofon.app.sip.SipEngine
import ru.domofon.app.sip.SipUiState
import javax.inject.Inject

data class HomeUiState(
    val intercoms: List<IntercomDto> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val openingId: String? = null,
    val openedId: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: DomofonApi,
    val sipEngine: SipEngine
) : ViewModel() {
    private val _state = MutableStateFlow(HomeUiState())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { api.intercoms() }
                .onSuccess { items -> _state.update { it.copy(loading = false, intercoms = items) } }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Нет связи") }
                }
        }
    }

    fun open(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(openingId = id, openedId = null) }
            runCatching { api.openDoor(id) }
                .onSuccess { _state.update { it.copy(openingId = null, openedId = id) } }
                .onFailure { e ->
                    _state.update { it.copy(openingId = null, error = e.message ?: "Не удалось") }
                }
        }
    }
}

@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val sipState by viewModel.sipEngine.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Домофоны", style = MaterialTheme.typography.headlineMedium)
        Text(sipBadge(sipState), style = MaterialTheme.typography.bodySmall)

        when {
            state.loading && state.intercoms.isEmpty() -> CircularProgressIndicator(
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp)
            )

            state.intercoms.isEmpty() -> Text(
                "Нет домофонов. Проверьте, что бэкенд запущен и доступен.",
                modifier = Modifier.padding(top = 24.dp)
            )

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(top = 16.dp)
            ) {
                items(state.intercoms, key = { it.id }) { intercom ->
                    IntercomCard(
                        intercom = intercom,
                        opening = state.openingId == intercom.id,
                        opened = state.openedId == intercom.id,
                        onOpen = { viewModel.open(intercom.id) }
                    )
                }
            }
        }

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun IntercomCard(
    intercom: IntercomDto,
    opening: Boolean,
    opened: Boolean,
    onOpen: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(intercom.name, style = MaterialTheme.typography.titleMedium)

            intercom.rtspUrl?.let { url ->
                RtspPreview(url = url, modifier = Modifier.fillMaxWidth().height(200.dp))
            }

            Button(
                onClick = onOpen,
                enabled = !opening,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    when {
                        opening -> "Открываем…"
                        opened -> "✓ Дверь открыта"
                        else -> "Открыть дверь"
                    }
                )
            }
        }
    }
}

@Composable
private fun RtspPreview(url: String, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val player = remember(url) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(url))
            playWhenReady = true
            prepare()
        }
    }
    DisposableEffect(player) { onDispose { player.release() } }

    Box(modifier = modifier) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                PlayerView(ctx).apply {
                    useController = false
                    this.player = player
                }
            }
        )
    }
}

private fun sipBadge(state: SipUiState): String = when (state) {
    SipUiState.Idle -> "SIP: выключен"
    SipUiState.Registering -> "SIP: подключение…"
    SipUiState.Registered -> "SIP: на связи ✓"
    is SipUiState.RegistrationFailed -> "SIP: ошибка — ${state.message}"
    is SipUiState.Ringing -> "Входящий…"
    SipUiState.InCall -> "В разговоре"
}
