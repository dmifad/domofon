package ru.domofon.app.auth

import ru.domofon.app.network.DomofonApi
import ru.domofon.app.network.RequestOtpBody
import ru.domofon.app.network.TokenStore
import ru.domofon.app.network.VerifyOtpBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: DomofonApi,
    private val tokens: TokenStore
) {
    val isLoggedIn: Boolean get() = tokens.isLoggedIn

    suspend fun requestOtp(phone: String): Int = api.requestOtp(RequestOtpBody(phone)).ttl

    suspend fun verifyOtp(phone: String, code: String) {
        val response = api.verifyOtp(VerifyOtpBody(phone, code))
        tokens.accessToken = response.accessToken
        tokens.refreshToken = response.refreshToken
    }

    fun logout() = tokens.clear()
}
