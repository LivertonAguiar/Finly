package com.finly.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class FinlyWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "finly_widget_prefs";
    public static final String KEY_BALANCE = "balance";
    public static final String KEY_EXPENSES = "monthly_expenses";
    public static final String KEY_PENDING_COUNT = "pending_count";
    public static final String KEY_MONTH_NAME = "month_name";
    public static final String KEY_UPDATED_AT = "updated_at";
    public static final String ACTION_NEW_TRANSACTION = "com.finly.app.ACTION_NEW_TRANSACTION";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String balance = prefs.getString(KEY_BALANCE, "R$ 0,00");
        String expenses = prefs.getString(KEY_EXPENSES, "R$ 0,00");
        int pendingCount = prefs.getInt(KEY_PENDING_COUNT, 0);
        String monthName = prefs.getString(KEY_MONTH_NAME, "Resumo");
        String updatedAt = prefs.getString(KEY_UPDATED_AT, "--:--");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finly_app_widget);

        views.setTextViewText(R.id.widget_balance, balance);
        views.setTextViewText(R.id.widget_expenses, expenses);
        views.setTextViewText(
            R.id.widget_pending,
            pendingCount + (pendingCount == 1 ? " pendente" : " pendentes")
        );
        views.setTextViewText(R.id.widget_month, monthName);
        views.setTextViewText(R.id.widget_updated_at, updatedAt);

        // Intenção principal: tocar no corpo do widget abre o Finly
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingLaunch = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingLaunch);

        // Ação rápida: tocar no botão '+' abre diretamente a tela/modal de nova transação
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.setAction(ACTION_NEW_TRANSACTION);
        addIntent.putExtra("quick_action", "new_transaction");
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingAdd = PendingIntent.getActivity(
            context,
            1,
            addIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_btn_add, pendingAdd);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, FinlyWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
        if (appWidgetIds != null && appWidgetIds.length > 0) {
            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        }
    }
}
