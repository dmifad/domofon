package ru.domofon.app.billing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.domofon.app.network.BillingAccountDto
import ru.domofon.app.network.ChargeDto
import ru.domofon.app.network.CreatePaymentBody
import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.SubmitMeterBody
import javax.inject.Inject

data class BillingUiState(
    val accounts: List<BillingAccountDto> = emptyList(),
    val charges: List<ChargeDto> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    /** URL формы оплаты ЮKassa — UI открывает браузер. */
    val confirmationUrl: String? = null,
    val meterSubmitted: Boolean = false
)

@HiltViewModel
class BillingViewModel @Inject constructor(
    private val api: DomofonApi
) : ViewModel() {
    private val _state = MutableStateFlow(BillingUiState())
    val state: StateFlow<BillingUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            runCatching {
                val accounts = api.billingAccounts()
                val charges = api.charges()
                accounts to charges
            }
                .onSuccess { (accounts, charges) ->
                    _state.update {
                        it.copy(loading = false, accounts = accounts, charges = charges)
                    }
                }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Ошибка сети") }
                }
        }
    }

    fun pay(accountId: String, amount: String) {
        viewModelScope.launch {
            runCatching { api.createPayment(CreatePaymentBody(accountId, amount)) }
                .onSuccess { payment ->
                    _state.update { it.copy(confirmationUrl = payment.confirmationUrl) }
                }
                .onFailure {
                    _state.update { it.copy(error = "Не удалось создать платёж") }
                }
        }
    }

    fun confirmationHandled() {
        _state.update { it.copy(confirmationUrl = null) }
    }

    fun submitMeter(apartmentId: String, meterType: String, value: String) {
        viewModelScope.launch {
            _state.update { it.copy(meterSubmitted = false) }
            runCatching { api.submitMeter(SubmitMeterBody(apartmentId, meterType, value)) }
                .onSuccess { _state.update { it.copy(meterSubmitted = true) } }
                .onFailure {
                    _state.update { it.copy(error = "Не удалось передать показания") }
                }
        }
    }
}
