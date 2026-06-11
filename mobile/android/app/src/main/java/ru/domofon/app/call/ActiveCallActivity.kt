package ru.domofon.app.call

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ru.domofon.app.cameras.HlsPlayer
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.sip.SipCallState
import ru.domofon.app.sip.SipEngine
import ru.domofon.app.ui.theme.DomofonTheme
import javax.inject.Inject

@AndroidEntryPoint
class ActiveCallActivity : ComponentActivity() {

    @Inject lateinit var api: DomofonApi
    @Inject lateinit var sipEngine: SipEngine

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val data = intent.getParcelableExtra<IncomingCallData>(
            DomofonConnectionService.EXTRA_CALL_DATA
        ) ?: run { finish(); return }

        setContent {
            DomofonTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    ActiveCallScreen(
                        data = data,
                        onOpenDoor = {
                            scope.launch { runCatching { api.openDoor(data.intercomId) } }
                        },
                        onHangup = {
                            sipEngine.hangup()
                            finish()
                        }
                    )
                }
            }
        }
    }

    @Composable
    private fun ActiveCallScreen(
        data: IncomingCallData,
        onOpenDoor: () -> Unit,
        onHangup: () -> Unit
    ) {
        val sipState by sipEngine.state.collectAsState()

        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(data.intercomName, style = MaterialTheme.typography.headlineMedium)
            Text(data.buildingAddress, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = when (sipState.state) {
                    SipCallState.Connecting -> "Соединение…"
                    SipCallState.Connected -> "В разговоре"
                    SipCallState.Ended -> "Завершено"
                    else -> ""
                },
                style = MaterialTheme.typography.labelLarge
            )

            data.previewUrl?.let { url ->
                HlsPlayer(
                    url = url,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Button(onClick = onOpenDoor) { Text("Открыть дверь") }
                Button(onClick = onHangup) { Text("Завершить") }
            }
        }
    }
}
