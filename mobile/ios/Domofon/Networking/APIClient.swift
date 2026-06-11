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

    func cameras() async throws -> [CameraDto] { try await get("cameras") }

    func cameraStream(_ id: String) async throws -> StreamInfo {
        try await get("cameras/\(id)/stream")
    }

    func cameraArchive(_ id: String, from: String, duration: Int = 60) async throws -> ArchiveInfo {
        try await get("cameras/\(id)/archive?from=\(from)&duration=\(duration)")
    }

    func events(cursor: String? = nil) async throws -> EventsPage {
        let path = cursor.map { "events?cursor=\($0)" } ?? "events"
        return try await get(path)
    }

    func billingAccounts() async throws -> [BillingAccountDto] {
        try await get("billing/accounts")
    }

    func charges() async throws -> [ChargeDto] {
        try await get("billing/charges")
    }

    func createPayment(accountId: String, amount: String) async throws -> PaymentDto {
        try await post("billing/payments", body: ["accountId": accountId, "amount": amount])
    }

    func submitMeter(apartmentId: String, meterType: String, value: String) async throws -> MeterReadingDto {
        try await post(
            "billing/meters",
            body: ["apartmentId": apartmentId, "meterType": meterType, "value": value]
        )
    }

    func chatMessages(apartmentId: String, cursor: String? = nil) async throws -> ChatPage {
        var path = "chat/messages?apartmentId=\(apartmentId)"
        if let cursor { path += "&cursor=\(cursor)" }
        return try await get(path)
    }

    func sendMessage(apartmentId: String, text: String) async throws -> ChatMessageDto {
        try await post("chat/messages", body: ["apartmentId": apartmentId, "text": text])
    }

    func announcements() async throws -> [AnnouncementDto] {
        try await get("chat/announcements")
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
