package ru.domofon.app.call

import android.os.Bundle
import android.view.TextureView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.sip.SipEngine
import ru.domofon.app.sip.SipUiState
import ru.domofon.app.ui.theme.DomofonTheme
import javax.inject.Inject

@AndroidEntryPoint
class CallActivity : ComponentActivity() {

    @Inject lateinit var sipEngine: SipEngine
    @Inject lateinit var api: DomofonApi

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setShowWhenLocked(true)
        setTurnScreenOn(true)

        setContent {
            DomofonTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CallScreen(
                        sipEngine = sipEngine,
                        onOpenDoor = {
                            scope.launch {
                                // intercom id для MVP один — берём первый
                                runCatching {
                                    val first = api.intercoms().firstOrNull() ?: return@launch
                                    api.openDoor(first.id)
                                }
                            }
                        },
                        onFinished = { finish() }
                    )
                }
            }
        }
    }
}

@Composable
private fun CallScreen(
    sipEngine: SipEngine,
    onOpenDoor: () -> Unit,
    onFinished: () -> Unit
) {
    val state by sipEngine.state.collectAsState()

    DisposableEffect(Unit) {
        onDispose { sipEngine.unbindVideoSurface() }
    }

    when (val s = state) {
        is SipUiState.Ringing -> RingingContent(
            remoteName = s.remoteName,
            onAnswer = sipEngine::answer,
            onDecline = {
                sipEngine.decline()
                onFinished()
            }
        )

        is SipUiState.InCall -> InCallContent(
            sipEngine = sipEngine,
            onOpenDoor = onOpenDoor,
            onHangup = {
                sipEngine.hangup()
                onFinished()
            }
        )

        else -> {
            // Звонок завершился (или его не было) — закрываемся
            onFinished()
        }
    }
}

@Composable
private fun RingingContent(remoteName: String, onAnswer: () -> Unit, onDecline: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Звонок с домофона", style = MaterialTheme.typography.headlineMedium)
        Text(remoteName, style = MaterialTheme.typography.titleLarge)

        Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
            Button(
                onClick = onAnswer,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
            ) {
                Text("Ответить")
            }
            Button(
                onClick = onDecline,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC62828))
            ) {
                Text("Отклонить")
            }
        }
    }
}

@Composable
private fun InCallContent(
    sipEngine: SipEngine,
    onOpenDoor: () -> Unit,
    onHangup: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .background(Color.Black)
        ) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    TextureView(ctx).also { sipEngine.bindVideoSurface(it) }
                }
            )
        }

        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("В разговоре", style = MaterialTheme.typography.titleMedium)

            Button(
                onClick = onOpenDoor,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
            ) {
                Text("Открыть дверь")
            }
            Button(
                onClick = onHangup,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC62828))
            ) {
                Text("Завершить")
            }
        }
    }
}
