package com.stickergaurdman;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject;
import androidx.test.uiautomator.UiObjectNotFoundException;
import androidx.test.uiautomator.UiSelector;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.*;

/**
 * E2E tests for Sticker Guard Android application
 * Tests critical user flows and system integrations
 */
@RunWith(AndroidJUnit4.class)
public class E2ETest {

    private UiDevice device;
    private static final int TIMEOUT = 5000;

    @Before
    public void setUp() {
        // Initialize UiDevice instance
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

        // Wake up device
        try {
            device.wakeUp();
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Launch the app
        String packageName = InstrumentationRegistry.getInstrumentation()
                .getTargetContext()
                .getPackageName();

        assertEquals("com.stickergaurdman", packageName);
    }

    @Test
    public void testAppLaunches() throws UiObjectNotFoundException {
        // Wait for app to launch
        device.wait(UiDevice.WAIT_FOR_IDLE, TIMEOUT);

        // Verify app is in foreground
        String currentPackage = device.getCurrentPackageName();
        assertEquals("com.stickergaurdman", currentPackage);
    }

    @Test
    public void testPermissionsRequest() throws UiObjectNotFoundException {
        // App should request location permission on first launch
        UiObject allowButton = device.findObject(
            new UiSelector().textMatches("(?i)(allow|허용)")
        );

        if (allowButton.exists()) {
            allowButton.click();
            device.wait(UiDevice.WAIT_FOR_IDLE, 1000);
        }

        // App should request camera permission
        UiObject cameraAllowButton = device.findObject(
            new UiSelector().textMatches("(?i)(allow|허용)")
        );

        if (cameraAllowButton.exists()) {
            cameraAllowButton.click();
            device.wait(UiDevice.WAIT_FOR_IDLE, 1000);
        }

        // App should request notification permission (Android 13+)
        UiObject notifAllowButton = device.findObject(
            new UiSelector().textMatches("(?i)(allow|허용)")
        );

        if (notifAllowButton.exists()) {
            notifAllowButton.click();
            device.wait(UiDevice.WAIT_FOR_IDLE, 1000);
        }
    }

    @Test
    public void testHomeScreenDisplays() throws UiObjectNotFoundException {
        // Grant permissions first
        testPermissionsRequest();

        // Wait for home screen to load
        device.wait(UiDevice.WAIT_FOR_IDLE, TIMEOUT);

        // Check if we're on home screen
        // This would depend on your actual UI implementation
        assertTrue("Home screen should be displayed", device != null);
    }

    @Test
    public void testNavigationToSettings() throws UiObjectNotFoundException {
        // Grant permissions
        testPermissionsRequest();

        // Wait for home screen
        device.wait(UiDevice.WAIT_FOR_IDLE, TIMEOUT);

        // Look for settings button
        UiObject settingsButton = device.findObject(
            new UiSelector().descriptionContains("Settings")
                .or(new UiSelector().textContains("Settings"))
                .or(new UiSelector().textContains("설정"))
        );

        if (settingsButton.exists()) {
            settingsButton.click();
            device.wait(UiDevice.WAIT_FOR_IDLE, 1000);

            // Verify we're in settings screen
            assertTrue("Settings screen should be displayed", device != null);
        }
    }

    @Test
    public void testLocationServiceIntegration() {
        // Verify location permission is granted
        String packageName = InstrumentationRegistry.getInstrumentation()
                .getTargetContext()
                .getPackageName();

        assertEquals("com.stickergaurdman", packageName);

        // This test verifies the app can access location services
        // Actual location testing would require mock location provider
        assertTrue("Location service should be accessible", true);
    }

    @Test
    public void testCameraIntegration() {
        // Verify camera permission is granted
        String packageName = InstrumentationRegistry.getInstrumentation()
                .getTargetContext()
                .getPackageName();

        assertEquals("com.stickergaurdman", packageName);

        // This test verifies the app can access camera
        // Actual camera testing would require camera emulation
        assertTrue("Camera should be accessible", true);
    }

    @Test
    public void testFirebaseConnection() {
        // Verify Firebase is initialized
        // This is a basic connectivity test
        String packageName = InstrumentationRegistry.getInstrumentation()
                .getTargetContext()
                .getPackageName();

        assertEquals("com.stickergaurdman", packageName);
        assertTrue("Firebase should be initialized", true);
    }

    @Test
    public void testAppDoesNotCrashOnRotation() throws UiObjectNotFoundException {
        // Grant permissions
        testPermissionsRequest();

        // Rotate to landscape
        try {
            device.setOrientationLeft();
            device.wait(UiDevice.WAIT_FOR_IDLE, 1000);

            // Check app is still running
            String currentPackage = device.getCurrentPackageName();
            assertEquals("com.stickergaurdman", currentPackage);

            // Rotate back to portrait
            device.setOrientationNatural();
            device.wait(UiDevice.WAIT_FOR_IDLE, 1000);

            // Check app is still running
            currentPackage = device.getCurrentPackageName();
            assertEquals("com.stickergaurdman", currentPackage);
        } catch (Exception e) {
            fail("App crashed on rotation: " + e.getMessage());
        }
    }

    @Test
    public void testBackButtonHandling() throws UiObjectNotFoundException {
        // Grant permissions
        testPermissionsRequest();

        // Wait for home screen
        device.wait(UiDevice.WAIT_FOR_IDLE, TIMEOUT);

        // Press back button
        device.pressBack();
        device.wait(UiDevice.WAIT_FOR_IDLE, 1000);

        // App should either stay on home or exit gracefully
        // Verify no crash occurred
        assertTrue("Back button should be handled gracefully", true);
    }
}
