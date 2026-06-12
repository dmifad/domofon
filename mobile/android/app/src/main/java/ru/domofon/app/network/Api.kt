package ru.domofon.app.network

import com.squareup.moshi.JsonClass
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

@JsonClass(generateAdapter = false)
data class LoginBody(val username: String, val pin: String)

@JsonClass(generateAdapter = false)
data class SipCredentials(val domain: String, val username: String, val password: String)

@JsonClass(generateAdapter = false)
data class LoginResponse(val token: String, val userId: String, val sip: SipCredentials?)

@JsonClass(generateAdapter = false)
data class IntercomDto(val id: String, val name: String, val rtspUrl: String?)

@JsonClass(generateAdapter = false)
data class OpenDoorResponse(val opened: Boolean, val method: String)

@JsonClass(generateAdapter = false)
data class RegisterDeviceBody(val platform: String = "android", val pushToken: String)

@JsonClass(generateAdapter = false)
data class CallRow(
    val id: String,
    val intercom_id: String,
    val status: String,
    val created_at: String
)

interface DomofonApi {
    @POST("auth/login")
    suspend fun login(@Body body: LoginBody): LoginResponse

    @GET("intercoms")
    suspend fun intercoms(): List<IntercomDto>

    @POST("intercoms/{id}/open")
    suspend fun openDoor(@Path("id") id: String): OpenDoorResponse

    @POST("devices")
    suspend fun registerDevice(@Body body: RegisterDeviceBody)

    @GET("calls")
    suspend fun calls(): List<CallRow>
}
