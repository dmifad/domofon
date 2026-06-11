package ru.domofon.app.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val phone: String = "+7",
    val code: String = "",
    val codeSent: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val loggedIn: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val auth: AuthRepository
) : ViewModel() {
    private val _state = MutableStateFlow(LoginUiState(loggedIn = auth.isLoggedIn))
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun onPhoneChange(value: String) = _state.update { it.copy(phone = value, error = null) }
    fun onCodeChange(value: String) = _state.update { it.copy(code = value, error = null) }

    fun requestCode() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { auth.requestOtp(_state.value.phone) }
                .onSuccess { _state.update { s -> s.copy(loading = false, codeSent = true) } }
                .onFailure { e ->
                    _state.update { s -> s.copy(loading = false, error = e.message ?: "Ошибка сети") }
                }
        }
    }

    fun verifyCode() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching { auth.verifyOtp(_state.value.phone, _state.value.code) }
                .onSuccess { _state.update { s -> s.copy(loading = false, loggedIn = true) } }
                .onFailure {
                    _state.update { s -> s.copy(loading = false, error = "Неверный код") }
                }
        }
    }
}
