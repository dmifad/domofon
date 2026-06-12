package ru.domofon.app.sip

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import dagger.hilt.android.AndroidEntryPoint
import ru.domofon.app.call.CallActivity
import ru.domofon.app.network.SessionStore
import javax.inject.Inject

/**
 * Foreground-сервис, который держит SIP-регистрацию, пока приложение «живо».
 * Это компромисс MVP: без FCM-пробуждения звонок придёт, только если сервис
 * запущен (приложение открывали после ребута). С FCM сервис будит пуш.
 */
@AndroidEntryPoint
class SipService : LifecycleService() {

    @Inject lateinit var sipEngine: SipEngine
    @Inject lateinit var session: SessionStore

    override fun onCreate() {
        super.onCreate()
        createChannels()
        startForeground(ONGOING_ID, ongoingNotification())

        sipEngine.onIncomingCall = { remoteName -> showIncomingCall(remoteName) }
        sipEngine.onCallEnded = {
            getSystemService(NotificationManager::class.java).cancel(INCOMING_ID)
        }

        val domain = session.sipDomain
        val user = session.sipUsername
        val pass = session.sipPassword
        if (domain != null && user != null && pass != null) {
            sipEngine.start(domain, user, pass)
        } else {
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }

    override fun onDestroy() {
        sipEngine.stop()
        super.onDestroy()
    }

    private fun showIncomingCall(remoteName: String) {
        val fullScreen = PendingIntent.getActivity(
            this,
            0,
            Intent(this, CallActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_CALLS)
            .setSmallIcon(android.R.drawable.sym_call_incoming)
            .setContentTitle("Звонок с домофона")
            .setContentText(remoteName)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreen, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .build()

        getSystemService(NotificationManager::class.java).notify(INCOMING_ID, notification)
        // Дополнительно пробуем открыть экран напрямую (если приложение на переднем плане)
        try {
            fullScreen.send()
        } catch (_: PendingIntent.CanceledException) {
        }
    }

    private fun ongoingNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_SERVICE)
            .setSmallIcon(android.R.drawable.presence_audio_online)
            .setContentTitle("Домофон на связи")
            .setContentText("Ожидание звонков")
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()

    private fun createChannels() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_SERVICE, "Фоновая работа", NotificationManager.IMPORTANCE_MIN)
            )
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_CALLS, "Входящие звонки", NotificationManager.IMPORTANCE_HIGH).apply {
                    enableVibration(true)
                }
            )
        }
    }

    companion object {
        private const val CHANNEL_SERVICE = "sip_service"
        private const val CHANNEL_CALLS = "incoming_calls"
        private const val ONGOING_ID = 1
        private const val INCOMING_ID = 2

        fun start(context: Context) {
            context.startForegroundService(Intent(context, SipService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, SipService::class.java))
        }
    }
}
