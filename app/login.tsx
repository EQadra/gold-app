import { api } from '@/src/api/client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Código de invitación
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [validating, setValidating] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }
    try {
      await login({ email: email.trim(), password });
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.message ?? 'Error al iniciar sesión');
    }
  };

  const validateInvite = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Código vacío', 'Introduce un código de invitación.');
      return;
    }
    setValidating(true);
    try {
      const res = await api.post<{ valid: boolean }>('/validate-invite', {
        code: inviteCode.trim(),
      });
      if (res.data?.valid) {
        setInviteOpen(false);
        setInviteCode('');
        router.push('/register');
      } else {
        Alert.alert('Código inválido', 'Revisa el código e inténtalo de nuevo.');
      }
    } catch (e: any) {
      Alert.alert(
        'Código inválido',
        e?.message ?? 'No pudimos validar el código.'
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <Ionicons name="diamond" size={56} color="#D4A017" />
          <Text style={styles.brand}>Gold App</Text>
          <Text style={styles.subtitle}>Gestión de oro y caja</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
          <View style={styles.passRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry={!showPass}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            <TouchableOpacity
              onPress={() => setShowPass((v) => !v)}
              style={styles.eye}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={loading}
            style={[styles.btn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0B0B0B" />
            ) : (
              <Text style={styles.btnText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Código de invitación */}
          {!inviteOpen ? (
            <TouchableOpacity
              onPress={() => setInviteOpen(true)}
              style={styles.inviteToggle}
              activeOpacity={0.7}
            >
              <Ionicons name="key-outline" size={14} color="#555" />
              <Text style={styles.inviteToggleText}>
                ¿Tienes un código de invitación?
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>Código de invitación</Text>
              <View style={styles.inviteRow}>
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="XXXX-XXXX"
                  placeholderTextColor="#555"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                />
                <TouchableOpacity
                  onPress={validateInvite}
                  disabled={validating}
                  style={[
                    styles.inviteValidate,
                    validating && { opacity: 0.6 },
                  ]}
                  activeOpacity={0.85}
                >
                  {validating ? (
                    <ActivityIndicator color="#0B0B0B" size="small" />
                  ) : (
                    <Ionicons name="arrow-forward" size={18} color="#0B0B0B" />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setInviteOpen(false);
                  setInviteCode('');
                }}
                style={styles.inviteCancel}
              >
                <Text style={styles.inviteCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  brand: { color: '#FFF', fontSize: 28, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  label: { color: '#AAA', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 0,
  },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  eye: { padding: 12, position: 'absolute', right: 0 },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#D4A017',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  btnText: { color: '#0B0B0B', fontSize: 16, fontWeight: '700' },

  /* Invitación */
  inviteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  inviteToggleText: { color: '#555', fontSize: 12 },
  inviteBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#222',
  },
  inviteLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteValidate: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCancel: { alignSelf: 'center', marginTop: 10 },
  inviteCancelText: { color: '#666', fontSize: 12 },
});