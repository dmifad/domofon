import SwiftUI

@MainActor
final class BillingViewModel: ObservableObject {
    @Published var accounts: [BillingAccountDto] = []
    @Published var charges: [ChargeDto] = []
    @Published var loading = false
    @Published var error: String?
    @Published var confirmationUrl: URL?
    @Published var meterSubmitted = false

    func refresh() {
        Task {
            loading = true
            error = nil
            do {
                accounts = try await APIClient.shared.billingAccounts()
                charges = try await APIClient.shared.charges()
            } catch {
                self.error = "Не удалось загрузить данные"
            }
            loading = false
        }
    }

    func pay(accountId: String, amount: String) {
        Task {
            do {
                let payment = try await APIClient.shared.createPayment(accountId: accountId, amount: amount)
                confirmationUrl = payment.confirmationUrl.flatMap(URL.init(string:))
            } catch {
                self.error = "Не удалось создать платёж"
            }
        }
    }

    func submitMeter(apartmentId: String, value: String) {
        Task {
            meterSubmitted = false
            do {
                _ = try await APIClient.shared.submitMeter(
                    apartmentId: apartmentId,
                    meterType: "cold_water",
                    value: value
                )
                meterSubmitted = true
            } catch {
                self.error = "Не удалось передать показания"
            }
        }
    }
}

struct BillingView: View {
    @StateObject private var viewModel = BillingViewModel()
    @State private var amount = ""
    @State private var meterValue = ""
    @Environment(\.openURL) private var openURL

    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.accounts) { account in
                    Section("Л/с \(account.accountNumber)") {
                        HStack {
                            Text("Баланс")
                            Spacer()
                            Text("\(account.balance) ₽")
                                .foregroundStyle(account.balance.hasPrefix("-") ? .red : .primary)
                        }

                        HStack {
                            TextField("Сумма, ₽", text: $amount)
                                .keyboardType(.decimalPad)
                            Button("Оплатить") {
                                viewModel.pay(accountId: account.id, amount: amount)
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(Double(amount) == nil)
                        }

                        HStack {
                            TextField("Холодная вода, м³", text: $meterValue)
                                .keyboardType(.decimalPad)
                            Button("Передать") {
                                viewModel.submitMeter(apartmentId: account.apartmentId, value: meterValue)
                            }
                            .buttonStyle(.bordered)
                            .disabled(Double(meterValue) == nil)
                        }
                    }
                }

                if !viewModel.charges.isEmpty {
                    Section("Начисления") {
                        ForEach(viewModel.charges) { charge in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(charge.title)
                                    Text(charge.period)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text("\(charge.amount) ₽\(charge.paid ? " ✓" : "")")
                            }
                        }
                    }
                }

                if viewModel.meterSubmitted {
                    Text("Показания переданы")
                        .foregroundStyle(.green)
                }
                if let error = viewModel.error {
                    Text(error).foregroundStyle(.red)
                }
            }
            .navigationTitle("ЖКХ")
            .onAppear { viewModel.refresh() }
            .refreshable { viewModel.refresh() }
            .onChange(of: viewModel.confirmationUrl) { _, url in
                if let url {
                    openURL(url)
                    viewModel.confirmationUrl = nil
                }
            }
        }
    }
}

#Preview {
    BillingView()
}
