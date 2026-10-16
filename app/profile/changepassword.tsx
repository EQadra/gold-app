import { authApi } from '@/src/api/auth';
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

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValid =
    current.length > 0 && next.length >= 8 && next === confirm;

  const onSubmit = async () => {
    if (!isValid) {
      Alert.alert('Datos incompletos', 'Revisa los campos.');
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: current,
        new_password: next,
        new_password_confirmation: confirm,
      });
      Alert.alert('✅ Listo', 'Contraseña actualizada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      // Log detallado para depurar el error del backend
      console.log('STATUS:', e?.response?.status);
      console.log('DATA:', JSON.stringify(e?.response?.data, null, 2));

      const msg =
        e?.response?.data?.message ??
        e?.message ??
        'No se pudo cambiar la contraseña';

      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
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
        <View style={styles.card}>
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput
            value={current}
            onChangeText={setCurrent}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>
            Nueva contraseña (mín. 8 caracteres)
          </Text>
          <TextInput
            value={next}
            onChangeText={setNext}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>
            Confirmar nueva contraseña
          </Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry={!showPass}
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() => setShowPass((v) => !v)}
            style={styles.toggle}
          >
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#888"
            />
            <Text style={styles.toggleText}>
              {showPass ? 'Ocultar' : 'Mostrar'} contraseñas
            </Text>
          </TouchableOpacity>

          {next.length > 0 && next !== confirm && (
            <Text style={styles.warn}>Las contraseñas no coinciden</Text>
          )}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={!isValid || saving}
            style={[styles.btn, (!isValid || saving) && { opacity: 0.5 }]}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#0B0B0B" />
            ) : (
              <Text style={styles.btnText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { padding: 20, paddingTop: 20, paddingBottom: 60 },
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 18,
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
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  toggleText: { color: '#888', fontSize: 12 },
  warn: {
    color: '#FF6B6B',
    fontSize: 12,
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
  btnText: { color: '#0B0B0B', fontWeight: '700', fontSize: 15 },
});