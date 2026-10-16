import { api } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import type { DashboardStats } from '@/src/types/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard');
      setData(res.data.data);
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando dashboard');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#D4A017"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Hola,</Text>
          <Text style={styles.name}>{user?.name ?? 'Usuario'}</Text>
          <Text style={styles.company}>{user?.company?.name ?? ''}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#D4A017" />
        </TouchableOpacity>
      </View>

      {loading && !data && (
        <View style={styles.center}>
          <ActivityIndicator color="#D4A017" size="large" />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={styles.retry}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && (
        <>
          {/* Stats */}
          <View style={styles.statsGrid}>
            {data.stats.map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons
                  name={mapIcon(s.icon)}
                  size={22}
                  color="#D4A017"
                />
                <Text style={styles.statValue}>
                  {formatValue(s.value)}
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Caja */}
          <Text style={styles.sectionTitle}>Caja</Text>
          <View style={styles.cashCard}>
            {data.caja ? (
              <>
                <View style={styles.cashHeader}>
                  <Ionicons name="wallet" size={20} color="#4ADE80" />
                  <Text style={styles.cashStatus}>Caja abierta</Text>
                </View>
                <Text style={styles.cashName}>{data.caja.name}</Text>
                <View style={styles.cashRow}>
                  <View>
                    <Text style={styles.cashLabel}>Balance EUR</Text>
                    <Text style={styles.cashValue}>
                      {Number(data.caja.balance_eur).toFixed(2)} €
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.cashLabel}>Balance Oro</Text>
                    <Text style={styles.cashValue}>
                      {Number(data.caja.balance_gold).toFixed(3)} g
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.cashEmpty}>
                <Ionicons name="alert-circle-outline" size={22} color="#FF6B6B" />
                <Text style={styles.cashEmptyText}>
                  No hay caja abierta
                </Text>
              </View>
            )}
          </View>

          {/* Accesos rápidos */}
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>
          <View style={styles.quickGrid}>
            <QuickAction
              icon="cash-outline"
              label="Caja"
              onPress={() => router.push('/cash')}
            />
            <QuickAction
              icon="swap-horizontal-outline"
              label="Transacciones"
              onPress={() => router.push('/transactions')}
            />
            <QuickAction
              icon="newspaper-outline"
              label="Noticias"
              onPress={() => router.push('/news')}
            />
            <QuickAction
              icon="people-outline"
              label="Usuarios"
              onPress={() => router.push('/users')}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress}>
      <Ionicons name={icon} size={26} color="#D4A017" />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function mapIcon(name: string): any {
  switch (name) {
    case 'cash': return 'cash-outline';
    case 'cash-multiple': return 'cash-outline';
    case 'gold': return 'diamond-outline';
    case 'history': return 'time-outline';
    default: return 'stats-chart-outline';
  }
}

function formatValue(v: number) {
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  hello: { color: '#888', fontSize: 14 },
  name: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  company: { color: '#D4A017', fontSize: 13, marginTop: 2 },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  center: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    backgroundColor: '#1a0f0f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a1a1a',
    marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 14 },
  retry: { color: '#D4A017', marginTop: 8, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  cashCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  cashHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cashStatus: { color: '#4ADE80', fontSize: 13, fontWeight: '600' },
  cashName: { color: '#FFF', fontSize: 15, marginTop: 8 },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  cashLabel: { color: '#888', fontSize: 12 },
  cashValue: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 4 },
  cashEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  cashEmptyText: { color: '#FF6B6B', fontSize: 14 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#141414',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  quickLabel: { color: '#FFF', fontSize: 13, fontWeight: '500' },
});