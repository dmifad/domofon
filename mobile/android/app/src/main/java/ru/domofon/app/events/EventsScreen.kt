package ru.domofon.app.events

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import ru.domofon.app.network.EventDto

private val typeTitles = mapOf(
    "call.answered" to "Звонок: отвечен",
    "call.missed" to "Пропущенный звонок",
    "door.opened.app" to "Дверь открыта из приложения",
    "door.opened.key" to "Дверь открыта ключом",
    "door.opened.code" to "Дверь открыта кодом",
    "system" to "Системное событие"
)

@Composable
fun EventsScreen(viewModel: EventsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("События", style = MaterialTheme.typography.headlineMedium)

        when {
            state.loading -> CircularProgressIndicator(
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp)
            )

            state.items.isEmpty() -> Text(
                "Событий пока нет.",
                modifier = Modifier.padding(top = 24.dp)
            )

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(top = 16.dp)
            ) {
                items(state.items, key = { it.id }) { event ->
                    EventCard(event)
                }
                if (state.nextCursor != null) {
                    item {
                        TextButton(
                            onClick = viewModel::loadMore,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Показать ещё")
                        }
                    }
                }
            }
        }

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun EventCard(event: EventDto) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (event.snapshotUrl != null) {
                AsyncImage(
                    model = event.snapshotUrl,
                    contentDescription = "Снапшот",
                    modifier = Modifier.size(64.dp)
                )
            }
            Column {
                Text(
                    typeTitles[event.type] ?: event.type,
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    event.createdAt.replace("T", " ").substringBefore("."),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
