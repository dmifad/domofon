package ru.domofon.app.cameras

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import ru.domofon.app.network.CameraDto

@Composable
fun CamerasScreen(viewModel: CamerasViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Камеры", style = MaterialTheme.typography.headlineMedium)

        when {
            state.loading -> CircularProgressIndicator(
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp)
            )

            state.items.isEmpty() -> Text(
                "Камеры не найдены.",
                modifier = Modifier.padding(top = 24.dp)
            )

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(top = 16.dp)
            ) {
                items(state.items, key = { it.id }) { camera ->
                    CameraCard(
                        camera = camera,
                        playingUrl = if (state.playingId == camera.id) state.playingUrl else null,
                        onPlay = { viewModel.play(camera.id) },
                        onStop = viewModel::stop
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
private fun CameraCard(
    camera: CameraDto,
    playingUrl: String?,
    onPlay: () -> Unit,
    onStop: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(camera.name, style = MaterialTheme.typography.titleMedium)
            Text(
                "${camera.building.city}, ${camera.building.address}",
                style = MaterialTheme.typography.bodyMedium
            )

            if (playingUrl != null) {
                HlsPlayer(
                    url = playingUrl,
                    modifier = Modifier.fillMaxWidth().height(200.dp).padding(top = 12.dp)
                )
                Button(onClick = onStop, modifier = Modifier.padding(top = 8.dp)) {
                    Text("Остановить")
                }
            } else {
                Button(onClick = onPlay, modifier = Modifier.padding(top = 12.dp)) {
                    Text("Смотреть")
                }
            }
        }
    }
}
