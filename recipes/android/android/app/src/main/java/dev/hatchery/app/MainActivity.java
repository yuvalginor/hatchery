package dev.hatchery.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // A project's own native plugins are registered here, before super.onCreate.
        registerPlugin(SystemColorsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
