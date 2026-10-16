import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, roles, permisos, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.company}>{user?.company?.name}</Text>
      </View>

      <Section title="Roles">
        <View style={styles.chips}>
          {roles.map((r) => (
            <View key={r} style={styles.chip}>
              <Text style={styles.chipText}>{r}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title={`Permisos (${permisos.length})`}>
        <View style={styles.chips}>
          {permisos.map((p) => (
            <View key={p} style={[styles.chip, styles.chipOutline]}>
              <Text style={styles.chipTextSmall}>{p}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* ---------- CONFIGURACIÓN ---------- */}
      <Section title="Configuración">
        <TouchableOpacity
          onPress={() => router.push('/printer-settings')}
          style={styles.menuBtn}
          activeOpacity={0.85}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="print-outline" size={20} color="#D4A017" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuBtnText}>Configurar impresora</Text>
            <Text style={styles.menuBtnSub}>
              Elegir la impresora térmica por defecto
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/profile/changepassword')}
          style={styles.menuBtn}
          activeOpacity={0.85}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="lock-closed-outline" size={20} color="#D4A017" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuBtnText}>Cambiar contraseña</Text>
            <Text style={styles.menuBtnSub}>
              Actualizar tu contraseña de acceso
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>
      </Section>

      <TouchableOpacity onPress={onLogout} style={styles.logout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  avatarBox: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0B0B0B', fontSize: 34, fontWeight: '700' },
  name: { color: '#FFF', fontSize: 22, fontWeight: '700', marginTop: 12 },
  email: { color: '#888', fontSize: 14, marginTop: 4 },
  company: { color: '#D4A017', fontSize: 13, marginTop: 6, fontWeight: '600' },
  section: { marginTop: 24 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#D4A017',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipOutline: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222',
  },
  chipText: { color: '#0B0B0B', fontWeight: '700', fontSize: 12 },
  chipTextSmall: { color: '#DDD', fontSize: 11 },

  /* --- Botones de configuración --- */
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginBottom: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,160,23,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  menuBtnSub: { color: '#888', fontSize: 12, marginTop: 2 },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a1414',
  },
  logoutText: { color: '#FF6B6B', fontSize: 15, fontWeight: '600' },
});