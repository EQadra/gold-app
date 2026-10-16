import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RegisterScreen() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setError(null);

    if (!form.name || !form.email || !form.password || !form.company_name) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        company_name: form.company_name.trim(),
      });
      router.replace('/dashboard');
    } catch (e: any) {
      // Errores 422 de Laravel
      if (e?.errors) {
        const first = Object.values(e.errors)[0] as string[];
        setError(first?.[0] ?? 'Error al registrarse');
      } else {
        setError(e?.message ?? 'Error al registrarse');
      }
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
        <View style={styles.header}>
          <Ionicons name="diamond" size={40} color="#D4A017" />
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Registra tu empresa y empieza a operar
          </Text>
        </View>

        <View style={styles.card}>
          <Field label="Nombre completo *" value={form.name} onChangeText={set('name')} placeholder="Juan Pérez" />
          <Field label="Email *" value={form.email} onChangeText={set('email')} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Nombre de la empresa *" value={form.company_name} onChangeText={set('company_name')} placeholder="Oro Madrid S.L." />

          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.passRow}>
            <TextInput
              value={form.password}
              onChangeText={set('password')}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#666"
              secureTextEntry={!showPass}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eye}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <Field
            label="Confirmar contraseña *"
            value={form.password_confirmation}
            onChangeText={set('password_confirmation')}
            placeholder="Repite la contraseña"
            secureTextEntry={!showPass}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={loading}
            style={[styles.btn, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#0B0B0B" />
            ) : (
              <Text style={styles.btnText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/login" style={styles.link}>
              Iniciar sesión
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#666"
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        secureTextEntry={props.secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  label: { color: '#AAA', fontSize: 13, marginBottom: 6, fontWeight: '500' },
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
  passRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  eye: { padding: 12, position: 'absolute', right: 0 },
  error: { color: '#FF6B6B', fontSize: 13, marginTop: 4, marginBottom: 4, textAlign: 'center' },
  btn: {
    backgroundColor: '#D4A017',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: '#0B0B0B', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#888', fontSize: 14 },
  link: { color: '#D4A017', fontSize: 14, fontWeight: '600' },
});