package com.stickergaurdman;

import android.app.Application;
import android.content.res.Configuration;
import androidx.annotation.NonNull;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

// Manual package imports
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
import io.invertase.firebase.auth.ReactNativeFirebaseAuthPackage;
import io.invertase.firebase.firestore.ReactNativeFirebaseFirestorePackage;
import io.invertase.firebase.functions.ReactNativeFirebaseFunctionsPackage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;
import io.invertase.notifee.NotifeePackage;
import com.emeraldsanto.encryptedstorage.RNEncryptedStoragePackage;
import com.reactnativecommunity.geolocation.GeolocationPackage;
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
import com.swmansion.rnscreens.RNScreensPackage;
import com.mrousavy.camera.CameraPackage;
import com.swmansion.gesturehandler.RNGestureHandlerPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new AsyncStoragePackage(),
              new ReactNativeFirebaseAppPackage(),
              new ReactNativeFirebaseAnalyticsPackage(),
              new ReactNativeFirebaseAuthPackage(),
              new ReactNativeFirebaseFirestorePackage(),
              new ReactNativeFirebaseFunctionsPackage(),
              new ReactNativeFirebaseMessagingPackage(),
              new NotifeePackage(),
              new RNEncryptedStoragePackage(),
              new GeolocationPackage(),
              new SafeAreaContextPackage(),
              new RNScreensPackage(),
              new CameraPackage(),
              new RNGestureHandlerPackage()
          );
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
  }

  @Override
  public void onConfigurationChanged(@NonNull Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
  }
}
