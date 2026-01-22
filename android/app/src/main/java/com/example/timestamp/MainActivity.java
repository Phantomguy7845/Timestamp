package com.example.timestamp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.GeolocationPermissions;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    
    private static final int PERMISSION_REQUEST_CODE = 100;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request permissions on startup
        requestRequiredPermissions();
        
        // Configure WebView for camera and location
        configureWebView();
    }
    
    private void requestRequiredPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();
        
        // Camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.CAMERA);
        }
        
        // Location permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }
        
        // Storage permissions for Android 12 and below
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S_V2) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) 
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
        }
        
        // Media images permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) 
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_IMAGES);
            }
        }
        
        // Request all needed permissions
        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, 
                    permissionsNeeded.toArray(new String[0]), 
                    PERMISSION_REQUEST_CODE);
        }
    }
    
    private void configureWebView() {
        // Get the WebView from Capacitor bridge and configure it
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
                
                // Handle WebRTC/getUserMedia permission requests
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        // Auto-grant camera and audio permissions to WebView
                        request.grant(request.getResources());
                    });
                }
                
                // Handle geolocation permission requests
                @Override
                public void onGeolocationPermissionsShowPrompt(String origin, 
                        GeolocationPermissions.Callback callback) {
                    callback.invoke(origin, true, false);
                }
            });
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            // Permissions handled, reload WebView if needed
            if (getBridge() != null) {
                // Optionally reload to apply new permissions
                // getBridge().getWebView().reload();
            }
        }
    }
}
