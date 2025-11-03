package com.stickergaurdman;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Boot completed, restarting services");

            // Restart notification service if needed
            Intent serviceIntent = new Intent(context, NotificationService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // Launch main activity if needed
            // Intent mainIntent = new Intent(context, MainActivity.class);
            // mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            // context.startActivity(mainIntent);
        }
    }
}
