package ru.domofon.app.network

import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(private val tokens: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val access = tokens.accessToken
        val authed = if (access != null && request.header("Authorization") == null) {
            request.newBuilder().header("Authorization", "Bearer $access").build()
        } else {
            request
        }
        return chain.proceed(authed)
    }
}
