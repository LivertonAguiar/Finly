package com.finly.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class FinlyCompactWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(FinlyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            String balance = prefs.getString(FinlyWidgetProvider.KEY_BALANCE, "R$ 0,00");
            String income = prefs.getString(FinlyWidgetProvider.KEY_INCOME, "R$ 0,00");
            String expenses = prefs.getString(FinlyWidgetProvider.KEY_EXPENSES, "R$ 0,00");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finly_app_widget_compact);

            views.setTextViewText(R.id.widget_compact_balance, balance);
            views.setTextViewText(R.id.widget_compact_income, income);
            views.setTextViewText(R.id.widget_compact_expenses, expenses);

            // Ações de clique
            views.setOnClickPendingIntent(R.id.widget_compact_root, FinlyWidgetProvider.createActionPendingIntent(context, 201, "open_dashboard"));
            views.setOnClickPendingIntent(R.id.widget_compact_balance_section, FinlyWidgetProvider.createActionPendingIntent(context, 202, "open_dashboard"));
            views.setOnClickPendingIntent(R.id.widget_compact_income_section, FinlyWidgetProvider.createActionPendingIntent(context, 203, "open_incomes"));
            views.setOnClickPendingIntent(R.id.widget_compact_expense_section, FinlyWidgetProvider.createActionPendingIntent(context, 204, "open_expenses"));
            views.setOnClickPendingIntent(R.id.widget_compact_btn_add, FinlyWidgetProvider.createActionPendingIntent(context, 205, "new_expense"));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            android.util.Log.e("FinlyCompactWidget", "Erro ao atualizar widget compacto " + appWidgetId, e);
        }
    }
}

