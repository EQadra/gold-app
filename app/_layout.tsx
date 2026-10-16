import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppHeader from '../components/AppHeader';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator onReady={() => SplashScreen.hideAsync()} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function RootNavigator({ onReady }: { onReady: () => void }) {
  const { hydrated } = useAuth();

  useEffect(() => {
    if (hydrated) onReady();
  }, [hydrated, onReady]);

  if (!hydrated) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: (props) => <AppHeader {...props} />,
        contentStyle: { backgroundColor: '#0B0B0B' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="newtransaction" options={{ title: 'Nueva transacción' }} />
      <Stack.Screen name="transactionlist" options={{ title: 'Transacciones' }} />
      <Stack.Screen name="cash" options={{ title: 'Caja' }} />
      <Stack.Screen name="news" options={{ title: 'Noticias' }} />
      <Stack.Screen name="users" options={{ title: 'Usuarios' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
    </Stack>
  );
}