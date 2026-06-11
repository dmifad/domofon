import Foundation

struct OtpResponse: Decodable {
    let sent: Bool
    let ttl: Int
}

struct TokensResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}

struct UserDto: Decodable {
    let id: String
    let phone: String
    let fullName: String?
    let locale: String
}

struct BuildingDto: Decodable {
    let id: String
    let city: String
    let address: String
}

struct ApartmentDto: Decodable {
    let id: String
    let number: String
    let accountNumber: String
    let building: BuildingDto
}

struct UserApartmentDto: Decodable {
    let id: String
    let role: String
    let apartment: ApartmentDto
}

struct IntercomDto: Decodable, Identifiable {
    let id: String
    let name: String
    let status: String
    let cameraPath: String?
    let building: BuildingDto
}

struct OpenDoorResponse: Decodable {
    let opened: Bool
}

struct CallDto: Decodable, Identifiable {
    let id: String
    let intercomId: String
    let status: String
    let sipUri: String?
    let answeredBy: String?
    let snapshotUrl: String?
    let createdAt: String
}

struct CameraDto: Decodable, Identifiable {
    let id: String
    let name: String
    let streamPath: String
    let hasArchive: Bool
    let building: BuildingDto
}

struct StreamInfo: Decodable {
    let webrtcUrl: String
    let hlsUrl: String
}

struct ArchiveInfo: Decodable {
    let playbackUrl: String
}

struct EventDto: Decodable, Identifiable {
    let id: String
    let type: String
    let snapshotUrl: String?
    let createdAt: String
}

struct EventsPage: Decodable {
    let items: [EventDto]
    let nextCursor: String?
}
