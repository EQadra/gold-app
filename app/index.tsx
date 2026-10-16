import { useAuth } from '@/src/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { token, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B0B', justifyContent: 'center' }}>
        <ActivityIndicator color="#D4A017" size="large" />
      </View>
    );
  }

  return token
    ? <Redirect href="/dashboard" />
    : <Redirect href="/login" />;
}