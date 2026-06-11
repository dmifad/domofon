import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var phone = "+7"
    @Published var code = ""
    @Published var codeSent = false
    @Published var loading = false
    @Published var error: String?
    @Published var loggedIn = TokenStore.shared.isLoggedIn

    func requestCode() {
        Task {
            loading = true
            error = nil
            do {
                _ = try await APIClient.shared.requestOtp(phone: phone)
                codeSent = true
            } catch {
                self.error = "Не удалось отправить код"
            }
            loading = false
        }
    }

    func verifyCode() {
        Task {
            loading = true
            error = nil
            do {
                let tokens = try await APIClient.shared.verifyOtp(phone: phone, code: code)
                TokenStore.shared.accessToken = tokens.accessToken
                TokenStore.shared.refreshToken = tokens.refreshToken
                loggedIn = true
            } catch {
                self.error = "Неверный код"
            }
            loading = false
        }
    }

    func logout() {
        TokenStore.shared.clear()
        loggedIn = false
        codeSent = false
        code = ""
    }
}
