package com.finly.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class FinlyMiniWidgetProvider extends AppWidgetProvider {

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
            String monthName = prefs.getString(FinlyWidgetProvider.KEY_MONTH_NAME, "out. de 2026");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finly_app_widget_mini);

            views.setTextViewText(R.id.widget_mini_balance, balance);
            views.setTextViewText(R.id.widget_mini_income, income);
            views.setTextViewText(R.id.widget_mini_expenses, expenses);
            views.setTextViewText(R.id.widget_mini_month, monthName);

            // Ações de clique
            views.setOnClickPendingIntent(R.id.widget_mini_root, FinlyWidgetProvider.createActionPendingIntent(context, 301, "open_dashboard"));
            views.setOnClickPendingIntent(R.id.widget_mini_balance_section, FinlyWidgetProvider.createActionPendingIntent(context, 302, "open_dashboard"));
            views.setOnClickPendingIntent(R.id.widget_mini_income_section, FinlyWidgetProvider.createActionPendingIntent(context, 303, "open_incomes"));
            views.setOnClickPendingIntent(R.id.widget_mini_expense_section, FinlyWidgetProvider.createActionPendingIntent(context, 304, "open_expenses"));
            views.setOnClickPendingIntent(R.id.widget_mini_btn_add, FinlyWidgetProvider.createActionPendingIntent(context, 305, "new_expense"));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            android.util.Log.e("FinlyMiniWidget", "Erro ao atualizar widget mini " + appWidgetId, e);
        }
    }
}

