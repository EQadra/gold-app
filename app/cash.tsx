import { cashApi } from '@/src/api/cash';
import { fmt, toNum } from '@/src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { transactionsApi } from '../src/api/transactions';
import type { CashRegister, Transaction } from '../src/types/api';

/* ============================================================
   PANTALLA
   ============================================================ */

export default function CashScreen() {
  const [current, setCurrent] = useState<CashRegister | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todayTotals, setTodayTotals] = useState({
    total_eur: 0,
    total_usd: 0,
    grams: 0,
    count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState<CashRegister | null>(null);

  // Formularios
  const [openForm, setOpenForm] = useState({ cash_eur: '', gold: '' });
  const [closeForm, setCloseForm] = useState({ cash_eur: '', gold: '' });
  const [submitting, setSubmitting] = useState(false);

  /* ============================================================
     CARGA DE DATOS
     ============================================================ */

  const loadAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const [curRes, histRes, dayRes] = await Promise.allSettled([
        cashApi.current(),
        cashApi.history(),
        transactionsApi.day(),
      ]);

      if (curRes.status === 'fulfilled') {
        setCurrent(curRes.value.data ?? null);
      }

      if (histRes.status === 'fulfilled') {
        const h = histRes.value;
        setHistory(h?.data?.data ?? []);
      }

      if (dayRes.status === 'fulfilled') {
        setTodayTransactions(dayRes.value.data ?? []);
        setTodayTotals(dayRes.value.totales);
      }

      if (
        curRes.status === 'rejected' &&
        histRes.status === 'rejected' &&
        dayRes.status === 'rejected'
      ) {
        throw new Error('No se pudo conectar con el servidor');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar la caja');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  /* ============================================================
     ABRIR CAJA
     ============================================================ */

  const openCash = async () => {
    const cash = toNum(openForm.cash_eur);
    const gold = toNum(openForm.gold);

    if (cash < 0 || gold < 0) {
      Alert.alert('Error', 'Los valores no pueden ser negativos');
      return;
    }

    setSubmitting(true);
    try {
      await cashApi.open({
        opening_cash_eur: cash,
        opening_gold: gold,
      });
      setOpenModalVisible(false);
      setOpenForm({ cash_eur: '', gold: '' });
      await loadAll();
      Alert.alert('✅ Caja abierta', 'La caja se abrió correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo abrir la caja');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     CERRAR CAJA
     ============================================================ */

  const closeCash = async () => {
    if (!current) return;
    const cash = toNum(closeForm.cash_eur);
    const gold = toNum(closeForm.gold);

    setSubmitting(true);
    try {
      await cashApi.close({
        closing_cash_eur: cash,
        closing_gold: gold,
      });
      setCloseModalVisible(false);
      setCloseForm({ cash_eur: '', gold: '' });
      await loadAll();
      Alert.alert('✅ Caja cerrada', 'La caja se cerró correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cerrar la caja');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================================
     RENDER: tarjeta de cierre histórico
     ============================================================ */

  const renderClosure = (item: CashRegister) => {
    const isOpen = item.status === 'open';
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.closureCard}
        activeOpacity={0.8}
        onPress={() => {
          setSelectedClosure(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.closureHeader}>
          <Text style={styles.closureDate}>{item.date}</Text>
          <View
            style={[
              styles.closureBadge,
              isOpen ? styles.badgeOpen : styles.badgeClosed,
            ]}
          >
            <Text style={styles.badgeText}>
              {isOpen ? 'ABIERTA' : 'CERRADA'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Apertura EUR</Text>
          <Text style={styles.rowValue}>{fmt(item.opening_cash_eur)} €</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cierre EUR</Text>
          <Text style={styles.rowValue}>
            {item.closing_cash_eur != null
              ? `${fmt(item.closing_cash_eur)} €`
              : '—'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Oro</Text>
          <Text style={styles.rowValue}>
            {fmt(item.opening_gold, 3)} →{' '}
            {item.closing_gold != null ? fmt(item.closing_gold, 3) : '—'} g
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* ============================================================
     RENDER PRINCIPAL
     ============================================================ */

  if (loading && !current && history.length === 0) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAll(true)}
            tintColor="#D4A017"
          />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ==================== ESTADO ACTUAL ==================== */}
        <Text style={styles.sectionTitle}>Estado de caja</Text>

        {current ? (
          <View style={styles.currentCard}>
            <View style={styles.currentTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.statusRow}>
                  <View style={styles.statusDotOpen} />
                  <Text style={styles.statusOpenText}>CAJA ABIERTA</Text>
                </View>
                <Text style={styles.currentName}>{current.name}</Text>
                <Text style={styles.currentDate}>{current.date}</Text>
              </View>
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={28} color="#4ADE80" />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.balancesRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>Saldo EUR</Text>
                <Text style={styles.balanceValue}>
                  {fmt(current.balance_eur)} €
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>Saldo Oro</Text>
                <Text style={styles.balanceValue}>
                  {fmt(current.balance_gold, 3)} g
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.openingInfo}>
              <Text style={styles.openingLabel}>
                Apertura: {fmt(current.opening_cash_eur)} € ·{' '}
                {fmt(current.opening_gold, 3)} g
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setCloseForm({
                  cash_eur: String(current.balance_eur ?? ''),
                  gold: String(current.balance_gold ?? ''),
                });
                setCloseModalVisible(true);
              }}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed" size={18} color="#0B0B0B" />
              <Text style={styles.closeBtnText}>Cerrar caja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noCashCard}>
            <Ionicons name="alert-circle-outline" size={42} color="#FF6B6B" />
            <Text style={styles.noCashTitle}>No hay caja abierta</Text>
            <Text style={styles.noCashText}>
              Debes abrir una caja antes de registrar transacciones.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setOpenForm({ cash_eur: '', gold: '' });
                setOpenModalVisible(true);
              }}
              style={styles.openBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={18} color="#0B0B0B" />
              <Text style={styles.openBtnText}>Abrir caja</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================== RESUMEN DEL DÍA ==================== */}
        <Text style={styles.sectionTitle}>Movimiento de hoy</Text>

        <View style={styles.statsGrid}>
          <StatMini
            icon="receipt-outline"
            label="Transacciones"
            value={String(todayTotals.count)}
          />
          <StatMini
            icon="cash-outline"
            label="Total EUR"
            value={`${fmt(todayTotals.total_eur)} €`}
          />
          <StatMini
            icon="diamond-outline"
            label="Gramos"
            value={`${fmt(todayTotals.grams, 3)} g`}
          />
          <StatMini
            icon="cash-outline"
            label="Total USD"
            value={`${fmt(todayTotals.total_usd)} $`}
          />
        </View>

        {todayTransactions.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.subSectionTitle}>Últimas transacciones</Text>
            {todayTransactions.slice(0, 5).map((t) => (
              <View key={t.id} style={styles.miniTxRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniTxClient} numberOfLines={1}>
                    {t.client_name || 'Cliente mostrador'}
                  </Text>
                  <Text style={styles.miniTxMeta}>
                    {fmt(t.grams, 3)} g · {t.hora}
                  </Text>
                </View>
                <Text style={styles.miniTxTotal}>{fmt(t.total_eur)} €</Text>
              </View>
            ))}
          </View>
        )}

        {/* ==================== HISTORIAL ==================== */}
        <Text style={styles.sectionTitle}>Historial de cierres</Text>

        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="archive-outline" size={42} color="#333" />
            <Text style={styles.emptyText}>Sin cierres anteriores</Text>
          </View>
        ) : (
          history.map((item) => renderClosure(item))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==================== MODAL ABRIR ==================== */}
      <FormModal
        visible={openModalVisible}
        title="Abrir caja"
        subtitle="Introduce los valores iniciales del día"
        onClose={() => setOpenModalVisible(false)}
        onConfirm={openCash}
        confirmText="Abrir caja"
        submitting={submitting}
      >
        <FormField
          label="Efectivo inicial (EUR)"
          value={openForm.cash_eur}
          onChangeText={(v) => setOpenForm((f) => ({ ...f, cash_eur: v }))}
          placeholder="0.00"
          keyboardType="decimal-pad"
          icon="cash-outline"
        />
        <FormField
          label="Oro inicial (gramos)"
          value={openForm.gold}
          onChangeText={(v) => setOpenForm((f) => ({ ...f, gold: v }))}
          placeholder="0.000"
          keyboardType="decimal-pad"
          icon="diamond-outline"
        />
      </FormModal>

      {/* ==================== MODAL CERRAR ==================== */}
      <FormModal
        visible={closeModalVisible}
        title="Cerrar caja"
        subtitle="Introduce el conteo físico final"
        onClose={() => setCloseModalVisible(false)}
        onConfirm={closeCash}
        confirmText="Cerrar caja"
        submitting={submitting}
      >
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Saldos esperados</Text>
          <Text style={styles.hintText}>
            EUR: {fmt(current?.balance_eur ?? 0)} €
          </Text>
          <Text style={styles.hintText}>
            Oro: {fmt(current?.balance_gold ?? 0, 3)} g
          </Text>
        </View>

        <FormField
          label="Efectivo contado (EUR)"
          value={closeForm.cash_eur}
          onChangeText={(v) => setCloseForm((f) => ({ ...f, cash_eur: v }))}
          placeholder="0.00"
          keyboardType="decimal-pad"
          icon="cash-outline"
        />
        <FormField
          label="Oro contado (gramos)"
          value={closeForm.gold}
          onChangeText={(v) => setCloseForm((f) => ({ ...f, gold: v }))}
          placeholder="0.000"
          keyboardType="decimal-pad"
          icon="diamond-outline"
        />
      </FormModal>

      {/* ==================== MODAL DETALLE ==================== */}
      <DetailClosureModal
        visible={detailModalVisible}
        closure={selectedClosure}
        onClose={() => setDetailModalVisible(false)}
      />
    </View>
  );
}

/* ============================================================
   SUBCOMPONENTES
   ============================================================ */

function StatMini({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statMini}>
      <Ionicons name={icon} size={20} color="#D4A017" />
      <Text style={styles.statMiniValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.formInputWrapper}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color="#888"
            style={{ marginLeft: 12 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#555"
          keyboardType={keyboardType}
          style={styles.formInput}
        />
      </View>
    </View>
  );
}

function FormModal({
  visible,
  title,
  subtitle,
  onClose,
  onConfirm,
  confirmText,
  submitting,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  submitting: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={submitting}
            style={[styles.modalConfirmBtn, submitting && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#0B0B0B" />
            ) : (
              <Text style={styles.modalConfirmText}>{confirmText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DetailClosureModal({
  visible,
  closure,
  onClose,
}: {
  visible: boolean;
  closure: CashRegister | null;
  onClose: () => void;
}) {
  if (!closure) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { maxHeight: '88%' }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Cierre {closure.date}</Text>
              <Text style={styles.modalSubtitle}>
                {closure.status === 'open' ? 'Caja abierta' : 'Caja cerrada'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Saldos</Text>
              <DetailRow
                label="Apertura EUR"
                value={`${fmt(closure.opening_cash_eur)} €`}
              />
              <DetailRow
                label="Cierre EUR"
                value={
                  closure.closing_cash_eur != null
                    ? `${fmt(closure.closing_cash_eur)} €`
                    : '—'
                }
              />
              <DetailRow
                label="Apertura oro"
                value={`${fmt(closure.opening_gold, 3)} g`}
              />
              <DetailRow
                label="Cierre oro"
                value={
                  closure.closing_gold != null
                    ? `${fmt(closure.closing_gold, 3)} g`
                    : '—'
                }
              />
              <DetailRow
                label="Balance EUR"
                value={`${fmt(closure.balance_eur)} €`}
              />
              <DetailRow
                label="Balance oro"
                value={`${fmt(closure.balance_gold, 3)} g`}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalConfirmBtn, { backgroundColor: '#1F1F1F' }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalConfirmText, { color: '#FFF' }]}>
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a0f0f',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a1a1a',
    marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },

  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  subSectionTitle: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  currentCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  currentTop: { flexDirection: 'row', alignItems: 'flex-start' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusDotOpen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statusOpenText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  currentName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  currentDate: { color: '#888', fontSize: 12, marginTop: 4 },
  walletIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balancesRow: { flexDirection: 'row', paddingVertical: 4 },
  balanceLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  balanceValue: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  openingInfo: { paddingVertical: 4 },
  openingLabel: { color: '#666', fontSize: 11 },

  divider: { height: 1, backgroundColor: '#222', marginVertical: 14 },

  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  closeBtnText: { color: '#0B0B0B', fontWeight: '700', fontSize: 15 },

  noCashCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a1414',
  },
  noCashTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  noCashText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4A017',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  openBtnText: { color: '#0B0B0B', fontWeight: '700', fontSize: 15 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statMini: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  statMiniValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  statMiniLabel: { color: '#888', fontSize: 11, marginTop: 2 },

  miniTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#141414',
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  miniTxClient: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  miniTxMeta: { color: '#666', fontSize: 11, marginTop: 2 },
  miniTxTotal: { color: '#D4A017', fontSize: 14, fontWeight: '700' },

  closureCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  closureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closureDate: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  closureBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeOpen: { backgroundColor: '#14532d' },
  badgeClosed: { backgroundColor: '#333' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: { color: '#888', fontSize: 12 },
  rowValue: { color: '#DDD', fontSize: 13, fontWeight: '500' },

  emptyBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  emptyText: { color: '#666', fontSize: 13, marginTop: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#888', fontSize: 12, marginTop: 4 },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },

  formLabel: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  formInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  formInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  hintBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A017',
  },
  hintTitle: {
    color: '#D4A017',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  hintText: { color: '#AAA', fontSize: 12, marginTop: 2 },

  modalConfirmBtn: {
    backgroundColor: '#D4A017',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalConfirmText: { color: '#0B0B0B', fontWeight: '700', fontSize: 15 },

  detailSection: { marginVertical: 4 },
  detailSectionTitle: {
    color: '#D4A017',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: { color: '#888', fontSize: 13 },
  detailValue: { color: '#DDD', fontSize: 13, fontWeight: '500' },
});