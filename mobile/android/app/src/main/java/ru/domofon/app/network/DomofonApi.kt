package ru.domofon.app.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface DomofonApi {
    @POST("auth/otp/request")
    suspend fun requestOtp(@Body body: RequestOtpBody): OtpResponse

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body body: VerifyOtpBody): TokensResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshBody): TokensResponse

    @GET("users/me")
    suspend fun me(): UserDto

    @GET("apartments")
    suspend fun apartments(): List<UserApartmentDto>

    @POST("apartments/link")
    suspend fun linkApartment(@Body body: LinkApartmentBody): UserApartmentDto

    @GET("intercoms")
    suspend fun intercoms(): List<IntercomDto>

    @POST("intercoms/{id}/open")
    suspend fun openDoor(@Path("id") id: String): OpenDoorResponse

    @POST("devices")
    suspend fun registerDevice(@Body body: RegisterDeviceBody)
}
