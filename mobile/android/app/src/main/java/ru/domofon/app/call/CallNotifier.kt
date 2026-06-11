package ru.domofon.app.call

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import androidx.core.content.getSystemService
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Регистрирует PhoneAccount и передаёт входящий звонок Telecom-системе,
 * которая запустит [DomofonConnectionService] и покажет нативный UI звонка.
 */
@Singleton
class CallNotifier @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val handle: PhoneAccountHandle by lazy {
        PhoneAccountHandle(
            ComponentName(context, DomofonConnectionService::class.java),
            ACCOUNT_ID
        )
    }

    fun ensureRegistered() {
        val telecom = context.getSystemService<TelecomManager>() ?: return
        if (telecom.getPhoneAccount(handle) != null) return
        val account = PhoneAccount.builder(handle, "Домофон")
            .setCapabilities(
                PhoneAccount.CAPABILITY_SELF_MANAGED or
                    PhoneAccount.CAPABILITY_VIDEO_CALLING or
                    PhoneAccount.CAPABILITY_SUPPORTS_VIDEO_CALLING
            )
            .build()
        telecom.registerPhoneAccount(account)
    }

    fun postIncoming(data: IncomingCallData) {
        ensureRegistered()
        val telecom = context.getSystemService<TelecomManager>() ?: return
        val extras = Bundle().apply {
            putParcelable(
                TelecomManager.EXTRA_INCOMING_CALL_ADDRESS,
                Uri.fromParts("sip", data.sipUri.removePrefix("sip:"), null)
            )
            putBundle(KEY_CALL_DATA, Bundle().apply {
                putParcelable(KEY_CALL_DATA, data)
            })
        }
        telecom.addNewIncomingCall(handle, extras)
    }

    companion object {
        const val ACCOUNT_ID = "domofon-self-managed"
        const val KEY_CALL_DATA = "ru.domofon.call_data"
    }
}
