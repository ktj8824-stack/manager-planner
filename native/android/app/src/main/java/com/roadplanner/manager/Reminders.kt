package com.roadplanner.manager

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import java.time.Instant

/**
 * 출발 15분 전 알림 예약 (앱이 꺼져 있어도 폰이 알림)
 * 웹이 넘기는 목록: [{ id, fireAt(ISO), title, body, url }]
 */
object Reminders {
    private const val CHANNEL = "departure"
    private const val PREF = "rp_reminders"

    fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT >= 26) {
            val ch = NotificationChannel(CHANNEL, "출발 알림", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "출발 15분 전 알림"
                enableVibration(true)
            }
            ctx.getSystemService(NotificationManager::class.java)?.createNotificationChannel(ch)
        }
    }

    fun replaceAll(ctx: Context, json: String) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val prefs = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE)
        // 예전 예약 취소
        prefs.getStringSet("codes", emptySet())?.forEach { code ->
            am.cancel(pending(ctx, code.toInt(), Intent(ctx, ReminderReceiver::class.java)))
        }
        val codes = mutableSetOf<String>()
        try {
            val arr = JSONArray(json)
            val now = System.currentTimeMillis()
            for (i in 0 until minOf(arr.length(), 40)) {
                val o = arr.getJSONObject(i)
                val at = try { Instant.parse(o.optString("fireAt")).toEpochMilli() } catch (e: Exception) { continue }
                if (at <= now) continue
                val code = o.optString("id").hashCode()
                val intent = Intent(ctx, ReminderReceiver::class.java).apply {
                    putExtra("id", code)
                    putExtra("title", o.optString("title"))
                    putExtra("body", o.optString("body"))
                    putExtra("url", o.optString("url"))
                }
                val pi = pending(ctx, code, intent)
                // 정확한 시각 권한이 없어도 동작하도록 '대기 모드 허용' 방식 사용 (몇 분 이내 오차)
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
                codes.add(code.toString())
            }
        } catch (e: Exception) { /* 잘못된 목록은 무시 */ }
        prefs.edit().putStringSet("codes", codes).putString("last", json).apply()
    }

    fun restore(ctx: Context) {
        val last = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString("last", null) ?: return
        replaceAll(ctx, last)
    }

    private fun pending(ctx: Context, code: Int, intent: Intent): PendingIntent =
        PendingIntent.getBroadcast(ctx, code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    fun show(ctx: Context, id: Int, title: String, body: String, url: String) {
        ensureChannel(ctx)
        val open = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("open_url", url)
        }
        val tap = PendingIntent.getActivity(ctx, id, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_rp)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(tap)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(id, n) } catch (e: SecurityException) { /* 알림 권한 없음 */ }
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        Reminders.show(
            ctx,
            intent.getIntExtra("id", 1),
            intent.getStringExtra("title") ?: "출발 알림",
            intent.getStringExtra("body") ?: "",
            intent.getStringExtra("url") ?: BuildConfig.APP_URL
        )
    }
}

// 폰을 다시 켜면 예약해 둔 알림을 다시 걸어 둠
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) Reminders.restore(ctx)
    }
}
