package com.finly.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

public class FinlyWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "finly_widget_prefs";
    public static final String KEY_BALANCE = "balance";
    public static final String KEY_INCOME = "monthly_income";
    public static final String KEY_EXPENSES = "monthly_expenses";
    public static final String KEY_MONTHLY_BALANCE = "monthly_balance";
    public static final String KEY_SAVINGS_RATE = "savings_rate";
    public static final String KEY_CARD_EXPENSES = "card_expenses";
    public static final String KEY_PENDING_COUNT = "pending_count";
    public static final String KEY_PENDING_AMOUNT = "pending_amount";
    public static final String KEY_MONTH_NAME = "month_name";
    public static final String KEY_UPDATED_AT = "updated_at";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        updateAllWidgets(context);
    }

    public static PendingIntent createActionPendingIntent(Context context, int requestCode, String action) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("com.finly.app.ACTION_" + action.toUpperCase());
        intent.setData(Uri.parse("finly://quick-action/" + action));
        intent.putExtra("quick_action", action);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String balance = prefs.getString(KEY_BALANCE, "R$ 0,00");
            String income = prefs.getString(KEY_INCOME, "R$ 0,00");
            String expenses = prefs.getString(KEY_EXPENSES, "R$ 0,00");
            String monthlyBalance = prefs.getString(KEY_MONTHLY_BALANCE, "R$ 0,00");
            String cardExpenses = prefs.getString(KEY_CARD_EXPENSES, "R$ 0,00");
            int pendingCount = prefs.getInt(KEY_PENDING_COUNT, 0);
            String pendingAmount = prefs.getString(KEY_PENDING_AMOUNT, "R$ 0,00");
            String monthName = prefs.getString(KEY_MONTH_NAME, "out. de 2026");
            String updatedAt = prefs.getString(KEY_UPDATED_AT, "--:--");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.finly_app_widget);

            views.setTextViewText(R.id.widget_balance, balance);
            views.setTextViewText(R.id.widget_income, income);
            views.setTextViewText(R.id.widget_expenses, expenses);
            views.setTextViewText(R.id.widget_card_expenses, cardExpenses);
            views.setTextViewText(R.id.widget_monthly_balance, monthlyBalance);
            views.setTextViewText(R.id.widget_month, monthName);
            views.setTextViewText(R.id.widget_updated_at, updatedAt);

            if (pendingCount <= 0) {
                views.setTextViewText(R.id.widget_pending, "✓ Em dia no mês");
            } else {
                String label = pendingCount + (pendingCount == 1 ? " pendente" : " pendentes");
                if (pendingAmount != null && !pendingAmount.isEmpty() && !pendingAmount.equals("R$ 0,00")) {
                    label += " (" + pendingAmount + ")";
                }
                views.setTextViewText(R.id.widget_pending, "⚠ " + label);
            }

            // Ações de clique interativas com deep links
            views.setOnClickPendingIntent(R.id.widget_root, createActionPendingIntent(context, 101, "open_dashboard"));
            views.setOnClickPendingIntent(R.id.widget_balance_section, createActionPendingIntent(context, 102, "open_dashboard"));
            views.setOnClickPendingIntent(R.id.widget_card_income, createActionPendingIntent(context, 103, "open_incomes"));
            views.setOnClickPendingIntent(R.id.widget_card_expense, createActionPendingIntent(context, 104, "open_expenses"));
            views.setOnClickPendingIntent(R.id.widget_card_card, createActionPendingIntent(context, 105, "open_cards"));
            views.setOnClickPendingIntent(R.id.widget_pending, createActionPendingIntent(context, 106, "open_pending"));
            views.setOnClickPendingIntent(R.id.widget_btn_refresh, createActionPendingIntent(context, 107, "refresh_data"));
            views.setOnClickPendingIntent(R.id.widget_btn_add_quick, createActionPendingIntent(context, 108, "new_expense"));
            views.setOnClickPendingIntent(R.id.widget_btn_add_income, createActionPendingIntent(context, 109, "new_income"));
            views.setOnClickPendingIntent(R.id.widget_btn_add_expense, createActionPendingIntent(context, 110, "new_expense"));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            android.util.Log.e("FinlyWidget", "Erro ao atualizar widget " + appWidgetId, e);
        }
    }

    public static void updateAllWidgets(Context context) {
        updateWidgetsForClass(context, FinlyWidgetProvider.class);
        updateWidgetsForClass(context, FinlyCompactWidgetProvider.class);
        updateWidgetsForClass(context, FinlyMiniWidgetProvider.class);
    }

    private static void updateWidgetsForClass(Context context, Class<?> cls) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, cls);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int appWidgetId : appWidgetIds) {
                    if (cls == FinlyWidgetProvider.class) {
                        updateAppWidget(context, appWidgetManager, appWidgetId);
                    } else if (cls == FinlyCompactWidgetProvider.class) {
                        FinlyCompactWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId);
                    } else if (cls == FinlyMiniWidgetProvider.class) {
                        FinlyMiniWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId);
                    }
                }
            }
        } catch (Exception e) {
            android.util.Log.e("FinlyWidget", "Erro ao atualizar widgets da classe " + cls.getSimpleName(), e);
        }
    }
}
