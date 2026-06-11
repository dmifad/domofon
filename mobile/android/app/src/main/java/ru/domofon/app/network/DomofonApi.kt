package ru.domofon.app.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

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

    @GET("calls")
    suspend fun calls(): List<CallDto>

    @POST("calls/{id}/answer")
    suspend fun answerCall(@Path("id") id: String): CallDto

    @POST("calls/{id}/decline")
    suspend fun declineCall(@Path("id") id: String): CallDto

    @GET("cameras")
    suspend fun cameras(): List<CameraDto>

    @GET("cameras/{id}/stream")
    suspend fun cameraStream(@Path("id") id: String): StreamInfoDto

    @GET("cameras/{id}/archive")
    suspend fun cameraArchive(
        @Path("id") id: String,
        @Query("from") from: String,
        @Query("duration") duration: Int? = null
    ): ArchiveInfoDto

    @GET("events")
    suspend fun events(@Query("cursor") cursor: String? = null): EventsPageDto
}
