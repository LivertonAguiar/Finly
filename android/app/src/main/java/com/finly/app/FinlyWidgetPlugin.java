package com.finly.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "FinlyWidget")
public class FinlyWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        try {
            String balance = call.getString("balance", "R$ 0,00");
            String monthlyExpenses = call.getString("monthlyExpenses", "R$ 0,00");
            int pendingCount = call.getInt("pendingCount", 0);
            String monthName = call.getString("monthName", "Resumo");

            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
            String updatedAt = call.getString("updatedAt", sdf.format(new Date()));

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(FinlyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            editor.putString(FinlyWidgetProvider.KEY_BALANCE, balance);
            editor.putString(FinlyWidgetProvider.KEY_EXPENSES, monthlyExpenses);
            editor.putInt(FinlyWidgetProvider.KEY_PENDING_COUNT, pendingCount);
            editor.putString(FinlyWidgetProvider.KEY_MONTH_NAME, monthName);
            editor.putString(FinlyWidgetProvider.KEY_UPDATED_AT, updatedAt);
            editor.apply();

            // Atualiza os widgets na tela inicial imediatamente
            FinlyWidgetProvider.updateAllWidgets(context);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Erro ao atualizar widget nativo: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getWidgetData(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(FinlyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);

            JSObject ret = new JSObject();
            ret.put("balance", prefs.getString(FinlyWidgetProvider.KEY_BALANCE, "R$ 0,00"));
            ret.put("monthlyExpenses", prefs.getString(FinlyWidgetProvider.KEY_EXPENSES, "R$ 0,00"));
            ret.put("pendingCount", prefs.getInt(FinlyWidgetProvider.KEY_PENDING_COUNT, 0));
            ret.put("monthName", prefs.getString(FinlyWidgetProvider.KEY_MONTH_NAME, "Resumo"));
            ret.put("updatedAt", prefs.getString(FinlyWidgetProvider.KEY_UPDATED_AT, "--:--"));

            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Erro ao obter dados do widget: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void checkQuickAction(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (getActivity() != null && getActivity().getIntent() != null) {
                String action = getActivity().getIntent().getStringExtra("quick_action");
                if (action != null) {
                    ret.put("quickAction", action);
                    getActivity().getIntent().removeExtra("quick_action");
                }
            }
        } catch (Exception ignored) {}
        call.resolve(ret);
    }
}
