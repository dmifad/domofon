import Foundation
import Alamofire

final class APIClient {
    static let shared = APIClient()

    #if DEBUG
    static let baseURL = URL(string: "http://localhost:3000/api/v1")!
    #else
    static let baseURL = URL(string: "https://api.domofon.example/api/v1")!
    #endif

    private let session: Session

    private init() {
        let interceptor = AuthRequestInterceptor(tokens: .shared)
        session = Session(interceptor: interceptor)
    }

    // MARK: - Auth

    func requestOtp(phone: String) async throws -> OtpResponse {
        try await post("auth/otp/request", body: ["phone": phone], authorized: false)
    }

    func verifyOtp(phone: String, code: String) async throws -> TokensResponse {
        try await post("auth/otp/verify", body: ["phone": phone, "code": code], authorized: false)
    }

    // MARK: - Domain

    func me() async throws -> UserDto {
        try await get("users/me")
    }

    func apartments() async throws -> [UserApartmentDto] {
        try await get("apartments")
    }

    func linkApartment(accountNumber: String, linkCode: String) async throws -> UserApartmentDto {
        try await post("apartments/link", body: ["accountNumber": accountNumber, "linkCode": linkCode])
    }

    func intercoms() async throws -> [IntercomDto] {
        try await get("intercoms")
    }

    func openDoor(intercomId: String) async throws -> OpenDoorResponse {
        try await post("intercoms/\(intercomId)/open", body: [:])
    }

    func registerDevice(pushToken: String, voipToken: String?) async throws {
        var body: [String: String] = ["platform": "ios", "pushToken": pushToken]
        body["voipToken"] = voipToken
        let _: Empty = try await post("devices", body: body)
    }

    func calls() async throws -> [CallDto] { try await get("calls") }

    func answerCall(_ id: String) async throws -> CallDto {
        try await post("calls/\(id)/answer", body: [:])
    }

    func declineCall(_ id: String) async throws -> CallDto {
        try await post("calls/\(id)/decline", body: [:])
    }

    // MARK: - Plumbing

    private func get<T: Decodable>(_ path: String) async throws -> T {
        try await session
            .request(Self.baseURL.appendingPathComponent(path))
            .validate()
            .serializingDecodable(T.self)
            .value
    }

    private func post<T: Decodable>(
        _ path: String,
        body: [String: String],
        authorized: Bool = true
    ) async throws -> T {
        try await session
            .request(
                Self.baseURL.appendingPathComponent(path),
                method: .post,
                parameters: body,
                encoder: JSONParameterEncoder.default
            )
            .validate()
            .serializingDecodable(T.self)
            .value
    }
}

struct Empty: Decodable {}

final class AuthRequestInterceptor: RequestInterceptor {
    private let tokens: TokenStore

    init(tokens: TokenStore) {
        self.tokens = tokens
    }

    func adapt(
        _ urlRequest: URLRequest,
        for session: Session,
        completion: @escaping (Result<URLRequest, Error>) -> Void
    ) {
        var request = urlRequest
        if let access = tokens.accessToken,
           request.value(forHTTPHeaderField: "Authorization") == nil {
            request.setValue("Bearer \(access)", forHTTPHeaderField: "Authorization")
        }
        completion(.success(request))
    }
}
