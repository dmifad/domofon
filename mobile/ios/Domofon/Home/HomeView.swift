import SwiftUI

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var intercoms: [IntercomDto] = []
    @Published var loading = false
    @Published var error: String?
    @Published var openingId: String?
    @Published var openedId: String?

    func refresh() {
        Task {
            loading = true
            error = nil
            do {
                intercoms = try await APIClient.shared.intercoms()
            } catch let e as APIError {
                error = e.errorDescription
            } catch {
                error = "Ошибка загрузки"
            }
            loading = false
        }
    }

    func open(_ id: String) {
        Task {
            openingId = id
            openedId = nil
            do {
                _ = try await APIClient.shared.openDoor(id: id)
                openedId = id
            } catch let e as APIError {
                error = e.errorDescription
            } catch {
                error = "Не удалось открыть"
            }
            openingId = nil
        }
    }
}

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @ObservedObject private var sip = SipEngine.shared

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text(sipBadge)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                ForEach(viewModel.intercoms) { intercom in
                    Section(intercom.name) {
                        if let urlString = intercom.rtspUrl, let url = URL(string: urlString) {
                            RTSPPlayer(url: url)
                                .frame(height: 220)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .listRowInsets(EdgeInsets())
                        }
                        Button(action: { viewModel.open(intercom.id) }) {
                            HStack {
                                if viewModel.openingId == intercom.id {
                                    ProgressView()
                                    Text("Открываем…")
                                } else if viewModel.openedId == intercom.id {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                                    Text("Дверь открыта")
                                } else {
                                    Image(systemName: "lock.open.fill")
                                    Text("Открыть дверь")
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.openingId == intercom.id)
                    }
                }

                if let error = viewModel.error {
                    Text(error).foregroundStyle(.red)
                }
            }
            .navigationTitle("Домофоны")
            .onAppear { viewModel.refresh() }
            .refreshable { viewModel.refresh() }
        }
    }

    private var sipBadge: String {
        switch sip.state {
        case .idle: return "SIP: выключен"
        case .registering: return "SIP: подключение…"
        case .registered: return "SIP: на связи ✓"
        case .registrationFailed(let m): return "SIP: ошибка — \(m)"
        case .ringing(let name): return "Входящий: \(name)"
        case .inCall: return "В разговоре"
        }
    }
}
