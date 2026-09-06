package com.finly.app;

import android.os.Build;
import android.os.Bundle;
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
        super.onCreate(savedInstanceState);
        setupCutoutAndFullScreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableFullScreen();
        }
    }

    private void setupCutoutAndFullScreen() {
        if (getWindow() != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            }
            enableFullScreen();
            setupInsetsListener();
        }
    }

    private void enableFullScreen() {
        if (getWindow() != null && getWindow().getDecorView() != null) {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }

    private void setupInsetsListener() {
        if (getWindow() != null && getWindow().getDecorView() != null) {
            ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (v, windowInsets) -> {
                int topInset = 0;
                DisplayCutoutCompat cutout = windowInsets.getDisplayCutout();
                if (cutout != null) {
                    topInset = cutout.getSafeInsetTop();
                }
                int statusBarInset = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                int effectiveTop = Math.max(topInset, statusBarInset);

                if (effectiveTop > 0 && getBridge() != null && getBridge().getWebView() != null) {
                    float density = getResources().getDisplayMetrics().density;
                    int topInDp = Math.round(effectiveTop / density);
                    String js = "document.documentElement.style.setProperty('--safe-area-inset-top', '" + topInDp + "px');"
                              + "document.documentElement.style.setProperty('--sat', '" + topInDp + "px');";
                    getBridge().getWebView().post(() -> {
                        getBridge().getWebView().evaluateJavascript(js, null);
                    });
                }
                return windowInsets;
            });
        }
    }
}
