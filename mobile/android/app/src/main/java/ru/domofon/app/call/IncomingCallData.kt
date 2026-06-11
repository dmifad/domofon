package ru.domofon.app.call

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class IncomingCallData(
    val callId: String,
    val intercomId: String,
    val intercomName: String,
    val sipUri: String,
    val buildingAddress: String,
    val snapshotUrl: String?
) : Parcelable
