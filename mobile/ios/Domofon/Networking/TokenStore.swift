import Foundation
import KeychainAccess

final class TokenStore {
    static let shared = TokenStore()

    private let keychain = Keychain(service: "ru.domofon.app.tokens")

    var accessToken: String? {
        get { keychain["access_token"] }
        set { keychain["access_token"] = newValue }
    }

    var refreshToken: String? {
        get { keychain["refresh_token"] }
        set { keychain["refresh_token"] = newValue }
    }

    var isLoggedIn: Bool { accessToken != nil }

    func clear() {
        try? keychain.removeAll()
    }
}
