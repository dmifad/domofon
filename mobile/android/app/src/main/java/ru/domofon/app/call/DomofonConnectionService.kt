package ru.domofon.app.call

import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.PhoneAccountHandle

/**
 * Stub for Telecom ConnectionService. Handles incoming SIP calls from intercoms,
 * so they surface through the system call UI (CallStyle notification, lockscreen).
 */
class DomofonConnectionService : ConnectionService() {
    override fun onCreateIncomingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection? {
        // TODO: wire to SIP stack (PJSIP/linphone)
        return null
    }
}
