package dev.hatchery.app;

import android.graphics.Color;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Colours the area behind the status and navigation bars, and their icons, to match the page's theme.
// Capacitor pads the WebView between the bars, so the window's decor view shows behind them.
// src/native/bars.ts calls it whenever the page's theme changes.
@CapacitorPlugin(name = "SystemColors")
public class SystemColorsPlugin extends Plugin {

    @PluginMethod
    public void set(PluginCall call) {
        String background = call.getString("background");
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        int color;
        try {
            color = Color.parseColor(background);
        } catch (IllegalArgumentException | NullPointerException e) {
            call.reject("background must be a colour such as #fafaf9");
            return;
        }
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            window.getDecorView().setBackgroundColor(color);
            WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(window, window.getDecorView());
            bars.setAppearanceLightStatusBars(!dark);
            bars.setAppearanceLightNavigationBars(!dark);
            call.resolve();
        });
    }
}
