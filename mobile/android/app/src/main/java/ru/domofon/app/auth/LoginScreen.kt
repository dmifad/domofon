package ru.domofon.app.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.LoginBody
import ru.domofon.app.network.SessionStore
import javax.inject.Inject

data class LoginUiState(
    val username: String = "",
    val pin: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val loggedIn: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val api: DomofonApi,
    private val session: SessionStore
) : ViewModel() {
    private val _state = MutableStateFlow(LoginUiState(loggedIn = session.isLoggedIn))
    val state = _state.asStateFlow()

    fun onUsername(v: String) = _state.update { it.copy(username = v, error = null) }
    fun onPin(v: String) = _state.update { it.copy(pin = v, error = null) }

    fun login() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching {
                api.login(LoginBody(_state.value.username.trim(), _state.value.pin.trim()))
            }
                .onSuccess { response ->
                    session.saveLogin(response)
                    _state.update { it.copy(loading = false, loggedIn = true) }
                }
                .onFailure {
                    _state.update { it.copy(loading = false, error = "Неверный логин или PIN") }
                }
        }
    }
}

@Composable
fun LoginScreen(onLoggedIn: () -> Unit, viewModel: LoginViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.loggedIn) {
        if (state.loggedIn) onLoggedIn()
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Домофон", style = MaterialTheme.typography.headlineLarge)

        OutlinedTextField(
            value = state.username,
            onValueChange = viewModel::onUsername,
            label = { Text("Логин") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = state.pin,
            onValueChange = viewModel::onPin,
            label = { Text("PIN") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = viewModel::login,
            enabled = !state.loading && state.username.isNotBlank() && state.pin.isNotBlank(),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Войти")
        }

        if (state.loading) CircularProgressIndicator()
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
