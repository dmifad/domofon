package ru.domofon.app.intercoms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import ru.domofon.app.network.IntercomDto

@Composable
fun IntercomsScreen(viewModel: IntercomsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Домофоны", style = MaterialTheme.typography.headlineMedium)

        when {
            state.loading -> CircularProgressIndicator(
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp)
            )

            state.items.isEmpty() -> Text(
                "Нет привязанных домофонов.\nПривяжите квартиру по лицевому счёту.",
                modifier = Modifier.padding(top = 24.dp)
            )

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(top = 16.dp)
            ) {
                items(state.items, key = { it.id }) { intercom ->
                    IntercomCard(
                        intercom = intercom,
                        opening = state.openingId == intercom.id,
                        justOpened = state.openedId == intercom.id,
                        onOpen = { viewModel.openDoor(intercom.id) }
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
    justOpened: Boolean,
    onOpen: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(intercom.name, style = MaterialTheme.typography.titleMedium)
            Text(
                "${intercom.building.city}, ${intercom.building.address}",
                style = MaterialTheme.typography.bodyMedium
            )
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    if (justOpened) "Дверь открыта" else intercom.status,
                    style = MaterialTheme.typography.labelMedium
                )
                Button(onClick = onOpen, enabled = !opening) {
                    Text(if (opening) "Открываем…" else "Открыть дверь")
                }
            }
        }
    }
}
