package ru.domofon.app.billing

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import ru.domofon.app.network.BillingAccountDto

@Composable
fun BillingScreen(viewModel: BillingViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(state.confirmationUrl) {
        state.confirmationUrl?.let { url ->
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            viewModel.confirmationHandled()
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("ЖКХ", style = MaterialTheme.typography.headlineMedium)

        when {
            state.loading -> CircularProgressIndicator(
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp)
            )

            state.accounts.isEmpty() -> Text(
                "Лицевые счета не найдены.",
                modifier = Modifier.padding(top = 24.dp)
            )

            else -> LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(top = 16.dp)
            ) {
                items(state.accounts, key = { it.id }) { account ->
                    AccountCard(
                        account = account,
                        onPay = { amount -> viewModel.pay(account.id, amount) },
                        onSubmitMeter = { type, value ->
                            viewModel.submitMeter(account.apartmentId, type, value)
                        }
                    )
                }
                items(state.charges, key = { it.id }) { charge ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(charge.title, style = MaterialTheme.typography.titleSmall)
                                Text(charge.period, style = MaterialTheme.typography.bodySmall)
                            }
                            Text(
                                "${charge.amount} ₽" + if (charge.paid) " ✓" else "",
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                    }
                }
            }
        }

        if (state.meterSubmitted) {
            Text("Показания переданы", color = MaterialTheme.colorScheme.primary)
        }
        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun AccountCard(
    account: BillingAccountDto,
    onPay: (String) -> Unit,
    onSubmitMeter: (String, String) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    var meterValue by remember { mutableStateOf("") }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Л/с ${account.accountNumber}", style = MaterialTheme.typography.titleMedium)
            Text(
                "Баланс: ${account.balance} ₽",
                style = MaterialTheme.typography.bodyMedium,
                color = if (account.balance.startsWith("-")) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.onSurface
                }
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Сумма, ₽") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Button(onClick = { onPay(amount) }, enabled = amount.toDoubleOrNull() != null) {
                    Text("Оплатить")
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = meterValue,
                    onValueChange = { meterValue = it },
                    label = { Text("Холодная вода, м³") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                Button(
                    onClick = { onSubmitMeter("cold_water", meterValue) },
                    enabled = meterValue.toDoubleOrNull() != null
                ) {
                    Text("Передать")
                }
            }
        }
    }
}
