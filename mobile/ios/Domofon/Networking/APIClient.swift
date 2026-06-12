import Foundation
import KeychainAccess

struct SipCredentials: Codable, Equatable {
    let domain: String
    let username: String
    let password: String
}

struct LoginResponse: Codable {
    let token: String
    let userId: String
    let sip: SipCredentials?
}

struct IntercomDto: Codable, Identifiable {
    let id: String
    let name: String
    let rtspUrl: String?
}

struct OpenDoorResponse: Codable {
    let opened: Bool
    let method: String
}

enum APIError: LocalizedError {
    case http(Int)
    case decoding
    case network

    var errorDescription: String? {
        switch self {
        case .http(let code): return "HTTP \(code)"
        case .decoding: return "Ошибка ответа сервера"
        case .network: return "Нет связи с сервером"
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let session = URLSession.shared
    private let keychain = Keychain(service: "ru.domofon.app")

    /// Базовый URL хранится в keychain, чтобы менять без пересборки.
    var baseURL: URL? {
        get {
            (try? keychain.get("base_url"))
                .flatMap { URL(string: $0) }
        }
        set { try? keychain.set(newValue?.absoluteString ?? "", key: "base_url") }
    }

    var token: String? {
        get { try? keychain.get("token") }
        set { try? keychain.set(newValue ?? "", key: "token") }
    }

    var sip: SipCredentials? {
        get {
            guard let data = try? keychain.getData("sip") else { return nil }
            return try? JSONDecoder().decode(SipCredentials.self, from: data)
        }
        set {
            if let v = newValue, let data = try? JSONEncoder().encode(v) {
                try? keychain.set(data, key: "sip")
            } else {
                try? keychain.remove("sip")
            }
        }
    }

    var isLoggedIn: Bool { token != nil }

    func logout() {
        try? keychain.remove("token")
        try? keychain.remove("sip")
    }

    // MARK: - Endpoints

    func login(username: String, pin: String) async throws -> LoginResponse {
        let response: LoginResponse = try await request(
            "auth/login", method: "POST",
            body: ["username": username, "pin": pin],
            authorized: false
        )
        token = response.token
        sip = response.sip
        return response
    }

    func intercoms() async throws -> [IntercomDto] {
        try await request("intercoms", method: "GET")
    }

    func openDoor(id: String) async throws -> OpenDoorResponse {
        try await request("intercoms/\(id)/open", method: "POST", body: [:])
    }

    func registerDevice(pushToken: String) async throws {
        let _: Empty = try await request(
            "devices", method: "POST",
            body: ["platform": "ios", "pushToken": pushToken]
        )
    }

    // MARK: - Plumbing

    struct Empty: Codable {}

    private func request<T: Decodable>(
        _ path: String,
        method: String,
        body: [String: String]? = nil,
        authorized: Bool = true
    ) async throws -> T {
        guard let base = baseURL else { throw APIError.network }
        var request = URLRequest(url: base.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if authorized, let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.network
        }
        guard let http = response as? HTTPURLResponse else { throw APIError.network }
        guard (200..<300).contains(http.statusCode) else { throw APIError.http(http.statusCode) }

        if T.self == Empty.self {
            return Empty() as! T
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decoding
        }
    }
}
