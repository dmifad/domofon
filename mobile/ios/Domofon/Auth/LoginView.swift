import SwiftUI

@MainActor
final class LoginViewModel: ObservableObject {
    @Published var serverURL: String = APIClient.shared.baseURL?.absoluteString ?? "http://192.168.1.10:3000/api/v1"
    @Published var username = "demo"
    @Published var pin = ""
    @Published var loading = false
    @Published var error: String?
    @Published var loggedIn = APIClient.shared.isLoggedIn

    func login() {
        guard let url = URL(string: serverURL) else {
            error = "Неверный URL"
            return
        }
        APIClient.shared.baseURL = url
        loading = true
        error = nil
        Task {
            do {
                _ = try await APIClient.shared.login(username: username, pin: pin)
                loggedIn = true
            } catch let e as APIError {
                error = e.errorDescription
            } catch {
                error = "Не удалось войти"
            }
            loading = false
        }
    }
}

struct LoginView: View {
    @ObservedObject var viewModel: LoginViewModel

    var body: some View {
        VStack(spacing: 16) {
            Text("Домофон")
                .font(.largeTitle.bold())

            VStack(alignment: .leading, spacing: 4) {
                Text("URL backend").font(.caption).foregroundStyle(.secondary)
                TextField("http://192.168.1.10:3000/api/v1", text: $viewModel.serverURL)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.URL)
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
            }

            TextField("Логин", text: $viewModel.username)
                .textFieldStyle(.roundedBorder)
                .autocapitalization(.none)
                .autocorrectionDisabled()

            SecureField("PIN", text: $viewModel.pin)
                .textFieldStyle(.roundedBorder)
                .keyboardType(.numberPad)

            Button("Войти") { viewModel.login() }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.loading || viewModel.username.isEmpty || viewModel.pin.isEmpty)

            if viewModel.loading { ProgressView() }
            if let error = viewModel.error {
                Text(error).foregroundStyle(.red).font(.footnote)
            }
        }
        .padding(24)
    }
}
