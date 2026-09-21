import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/**
 * Resolves the backend base URL dynamically.
 * Works seamlessly in Web browsers, Local Development, and inside Android APK.
 */
export function getApiBaseUrl(): string {
  // If explicitly provided via environment (recommended for Android APK builds)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && envApiUrl.trim() !== '') {
    return envApiUrl.replace(/\/+$/, '');
  }

  // Inside browser: use origin
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('capacitor:')) {
    return window.location.origin;
  }

  // Fallback for native testing
  return '';
}

/**
 * Resolves the WebSocket URL dynamically.
 * Prioritizes secure wss:// for production and https origins.
 */
export function getWebSocketUrl(): string {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl && envWsUrl.trim() !== '') {
    return envWsUrl;
  }

  const apiBase = getApiBaseUrl();
  if (apiBase) {
    if (apiBase.startsWith('https://')) {
      return apiBase.replace('https://', 'wss://');
    }
    if (apiBase.startsWith('http://')) {
      return apiBase.replace('http://', 'ws://');
    }
  }

  if (typeof window !== 'undefined' && window.location.host && !window.location.host.includes('localhost:8080')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  return 'ws://10.0.2.2:3000'; // Android emulator local fallback
}

/**
 * Initializes Android Native UI (StatusBar, Splash)
 */
export async function initializeAndroidNative(theme: 'dark' | 'light') {
  if (!isNativeAndroid) return;

  try {
    // Hide splash screen smoothly after app mounts
    await SplashScreen.hide();

    // Configure status bar color and style
    await StatusBar.setStyle({
      style: theme === 'dark' ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: theme === 'dark' ? '#0c1317' : '#00a884',
    });
  } catch (err) {
    console.warn('Native UI initialization skipped or failed:', err);
  }
}

/**
 * Requests Notification permission safely on Android 13+
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeAndroid) return false;

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Shows an Android System notification for incoming messages
 */
export async function showAndroidNotification(title: string, body: string, id?: number) {
  if (!isNativeAndroid) return;

  try {
    const notifId = id || Math.floor(Math.random() * 1000000) + 1;
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: notifId,
          schedule: { at: new Date(Date.now() + 100) },
          sound: undefined,
          smallIcon: 'ic_stat_notification',
          iconColor: '#00a884',
        },
      ],
    });
  } catch (err) {
    console.warn('Could not post notification:', err);
  }
}

/**
 * Subtle haptic feedback for user interactions
 */
export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Light) {
  if (!isNativeAndroid) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Graceful fallback
  }
}
