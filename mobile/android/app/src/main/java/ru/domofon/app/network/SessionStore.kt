package ru.domofon.app.network

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionStore @Inject constructor(@ApplicationContext context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "domofon_session",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var token: String?
        get() = prefs.getString("token", null)
        set(value) = prefs.edit().putString("token", value).apply()

    var sipDomain: String?
        get() = prefs.getString("sip_domain", null)
        set(value) = prefs.edit().putString("sip_domain", value).apply()

    var sipUsername: String?
        get() = prefs.getString("sip_username", null)
        set(value) = prefs.edit().putString("sip_username", value).apply()

    var sipPassword: String?
        get() = prefs.getString("sip_password", null)
        set(value) = prefs.edit().putString("sip_password", value).apply()

    val isLoggedIn: Boolean get() = token != null
    val hasSip: Boolean get() = sipDomain != null && sipUsername != null && sipPassword != null

    fun saveLogin(response: LoginResponse) {
        token = response.token
        sipDomain = response.sip?.domain
        sipUsername = response.sip?.username
        sipPassword = response.sip?.password
    }

    fun clear() = prefs.edit().clear().apply()
}
