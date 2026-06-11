package ru.domofon.app.network

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = false)
data class RequestOtpBody(val phone: String)

@JsonClass(generateAdapter = false)
data class VerifyOtpBody(val phone: String, val code: String)

@JsonClass(generateAdapter = false)
data class RefreshBody(val refreshToken: String)

@JsonClass(generateAdapter = false)
data class OtpResponse(val sent: Boolean, val ttl: Int)

@JsonClass(generateAdapter = false)
data class TokensResponse(val accessToken: String, val refreshToken: String)

@JsonClass(generateAdapter = false)
data class UserDto(
    val id: String,
    val phone: String,
    val fullName: String?,
    val locale: String
)

@JsonClass(generateAdapter = false)
data class BuildingDto(val id: String, val city: String, val address: String)

@JsonClass(generateAdapter = false)
data class ApartmentDto(
    val id: String,
    val number: String,
    val accountNumber: String,
    val building: BuildingDto
)

@JsonClass(generateAdapter = false)
data class UserApartmentDto(val id: String, val role: String, val apartment: ApartmentDto)

@JsonClass(generateAdapter = false)
data class LinkApartmentBody(val accountNumber: String, val linkCode: String)

@JsonClass(generateAdapter = false)
data class IntercomDto(
    val id: String,
    val name: String,
    val status: String,
    val cameraPath: String?,
    val building: BuildingDto
)

@JsonClass(generateAdapter = false)
data class OpenDoorResponse(val opened: Boolean)

@JsonClass(generateAdapter = false)
data class RegisterDeviceBody(
    val platform: String = "android",
    val pushToken: String,
    val appVersion: String? = null
)

@JsonClass(generateAdapter = false)
data class CallDto(
    val id: String,
    val intercomId: String,
    val status: String,
    val sipUri: String?,
    val answeredBy: String?,
    val snapshotUrl: String?,
    val createdAt: String
)

@JsonClass(generateAdapter = false)
data class CameraDto(
    val id: String,
    val name: String,
    val streamPath: String,
    val hasArchive: Boolean,
    val building: BuildingDto
)

@JsonClass(generateAdapter = false)
data class StreamInfoDto(val webrtcUrl: String, val hlsUrl: String)

@JsonClass(generateAdapter = false)
data class ArchiveInfoDto(val playbackUrl: String)

@JsonClass(generateAdapter = false)
data class EventDto(
    val id: String,
    val type: String,
    val snapshotUrl: String?,
    val createdAt: String
)

@JsonClass(generateAdapter = false)
data class EventsPageDto(val items: List<EventDto>, val nextCursor: String?)

@JsonClass(generateAdapter = false)
data class BillingAccountDto(
    val id: String,
    val apartmentId: String,
    val accountNumber: String,
    val balance: String
)

@JsonClass(generateAdapter = false)
data class ChargeDto(
    val id: String,
    val period: String,
    val title: String,
    val amount: String,
    val paid: Boolean
)

@JsonClass(generateAdapter = false)
data class CreatePaymentBody(val accountId: String, val amount: String)

@JsonClass(generateAdapter = false)
data class PaymentDto(
    val id: String,
    val amount: String,
    val status: String,
    val confirmationUrl: String?
)

@JsonClass(generateAdapter = false)
data class SubmitMeterBody(
    val apartmentId: String,
    val meterType: String,
    val value: String
)

@JsonClass(generateAdapter = false)
data class MeterReadingDto(
    val id: String,
    val meterType: String,
    val value: String,
    val createdAt: String
)

@JsonClass(generateAdapter = false)
data class ChatMessageDto(
    val id: String,
    val userId: String?,
    val text: String,
    val createdAt: String
)

@JsonClass(generateAdapter = false)
data class ChatPageDto(val items: List<ChatMessageDto>, val nextCursor: String?)

@JsonClass(generateAdapter = false)
data class SendMessageBody(val apartmentId: String, val text: String)

@JsonClass(generateAdapter = false)
data class AnnouncementDto(
    val id: String,
    val title: String,
    val body: String,
    val createdAt: String
)
