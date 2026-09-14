package com.finly.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.DisplayCutoutCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(FinlyBiometricPlugin.class);
        super.onCreate(savedInstanceState);
        setupEdgeToEdge();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyEdgeToEdgeFlags();
        }
    }

    private void setupEdgeToEdge() {
        Window window = getWindow();
        if (window != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                window.getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            }
            applyEdgeToEdgeFlags();
            setupInsetsListener();
        }
    }

    private void applyEdgeToEdgeFlags() {
        Window window = getWindow();
        if (window != null && window.getDecorView() != null) {
            // Permite que o app desenhe em 100% da tela (edge-to-edge),
            // sob a barra de status (inclusive entalhe/câmera) e sob a barra de navegação/gestos.
            WindowCompat.setDecorFitsSystemWindows(window, false);

            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.setStatusBarContrastEnforced(false);
                window.setNavigationBarContrastEnforced(false);
            }

            WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(window, window.getDecorView());

            // Garante que as barras de sistema estejam ativas e registradas,
            // permitindo que TODOS os gestos de navegação (voltar pelas bordas,
            // deslizar para início/minimizar e deslizar/segurar para alternar apps)
            // funcionem imediatamente no primeiro gesto sem a captura do modo imersivo.
            controller.show(WindowInsetsCompat.Type.systemBars());

            // Ícones claros sobre o fundo escuro nativo do Finly
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(false);
        }
    }

    private void setupInsetsListener() {
        Window window = getWindow();
        if (window != null && window.getDecorView() != null) {
            ViewCompat.setOnApplyWindowInsetsListener(window.getDecorView(), (v, windowInsets) -> {
                int topInset = 0;
                DisplayCutoutCompat cutout = windowInsets.getDisplayCutout();
                if (cutout != null) {
                    topInset = cutout.getSafeInsetTop();
                }
                int statusBarInset = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                int effectiveTop = Math.max(topInset, statusBarInset);

                int navBarInset = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                int bottomCutout = (cutout != null) ? cutout.getSafeInsetBottom() : 0;
                int effectiveBottom = Math.max(bottomCutout, navBarInset);

                if (getBridge() != null && getBridge().getWebView() != null) {
                    float density = getResources().getDisplayMetrics().density;
                    int topInDp = Math.round(effectiveTop / density);
                    int bottomInDp = Math.round(effectiveBottom / density);

                    String js = "document.documentElement.style.setProperty('--safe-area-inset-top', '" + topInDp + "px');"
                              + "document.documentElement.style.setProperty('--sat', '" + topInDp + "px');"
                              + "document.documentElement.style.setProperty('--safe-area-inset-bottom', '" + bottomInDp + "px');"
                              + "document.documentElement.style.setProperty('--sab', '" + bottomInDp + "px');";
                    getBridge().getWebView().post(() -> {
                        getBridge().getWebView().evaluateJavascript(js, null);
                    });
                }
                return windowInsets;
            });
        }
    }
}
