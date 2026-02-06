import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { httpClient } from '@/constants/httpClient';
import { removeToken, getToken } from '@/constants/tokenFile';

const INACTIVE_TIMEOUT = 10 * 60 * 1000; 
const CHECK_INTERVAL = 60 * 1000;

export function useAutoLogout() {
  const lastActivityTime = useRef(Date.now());
  const backgroundTime = useRef<number | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const isLoggingOut = useRef(false);
  const isActiveSession = useRef(false);
  const [isLoggingOutState, setIsLoggingOutState] = useState(false);

  const updateActivity = useCallback(() => {
    if (!isActiveSession.current) return;
    lastActivityTime.current = Date.now();
    console.log('🔄 Activity detected');
  }, []);

  const stopTimer = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current) return;

    isLoggingOut.current = true;
    setIsLoggingOutState(true);
    stopTimer();

    console.log('🚨 INACTIVITY TIMEOUT — LOGGING OUT');

    try {
      await removeToken();
      await AsyncStorage.multiRemove([
        'token','user','userName','userEmail','userPhone',
        'bookings','myBookings','paymentReference',
      ]);

      delete httpClient.defaults.headers.common['Authorization'];

      Alert.alert(
        'Session Expired',
        'Your session expired due to inactivity.',
        [{
          text: 'OK',
          onPress: () => {
            isActiveSession.current = false;
            isLoggingOut.current = false;
            setIsLoggingOutState(false);
            router.replace('/auth/Login');
          }
        }],
        { cancelable: false }
      );
    } catch {
      isLoggingOut.current = false;
      setIsLoggingOutState(false);
    }
  }, []);

  const checkInactivity = useCallback(async () => {
    if (!isActiveSession.current || isLoggingOut.current) return;

    const inactiveTime = Date.now() - lastActivityTime.current;

    console.log(
      `⏰ Inactive: ${Math.floor(inactiveTime / 60000)}m ${Math.floor((inactiveTime % 60000) / 1000)}s`
    );

    if (inactiveTime >= INACTIVE_TIMEOUT) {
      await handleLogout();
    }
  }, [handleLogout]);

  const startTimer = () => {
    if (checkIntervalRef.current) return;
    console.log('⏱️ AutoLogout timer started');
    checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL);
  };

  useEffect(() => {
    const watchToken = setInterval(async () => {
      const token = await getToken();

      if (token && !isActiveSession.current) {
        console.log('✅ Session detected — AutoLogout active');
        isActiveSession.current = true;
        lastActivityTime.current = Date.now();
        startTimer();
      }

      if (!token && isActiveSession.current) {
        console.log('🛑 Session ended — AutoLogout stopped');
        isActiveSession.current = false;
        stopTimer();
      }
    }, 2000);

    return () => clearInterval(watchToken);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (!isActiveSession.current) return;

      if (appState.current === 'active' && next.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        console.log('📴 App backgrounded');
      }

      if (appState.current.match(/inactive|background/) && next === 'active') {
        console.log('📲 App foregrounded');
        await checkInactivity();
      }

      appState.current = next;
    });

    return () => {
      console.log('🧹 AutoLogout cleanup');
      stopTimer();
      sub.remove();
      backgroundTime.current = null;
      isActiveSession.current = false;
    };
  }, [checkInactivity]);

  return { updateActivity, isLoggingOut: isLoggingOutState };
}
