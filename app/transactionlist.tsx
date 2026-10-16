import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaginatedTransactions, transactionsApi } from '../src/api/transactions';
import type { Transaction } from '../src/types/api';
import { fmtCompact as fmt, fmtDate, fmtEur, fmtGrams } from '../src/utils/format';

export default function TransactionsListScreen() {
  const [pages, setPages] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const load = useCallback(async (targetPage = 1, append = false) => {
    if (!append) {
      targetPage === 1 ? setLoading(true) : setRefreshing(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const res: PaginatedTransactions = await transactionsApi.list(targetPage);
      const items = res.data.data;

      setPages((prev) => (append ? [...prev, ...items] : items));
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar transacciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const onRefresh = () => load(1, false);
  const onEndReached = () => {
    if (!loadingMore && page < lastPage) {
      load(page + 1, true);
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => setSelected(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.client} numberOfLines={1}>
          {item.client_name || 'Cliente mostrador'}
        </Text>
        <View
          style={[
            styles.badge,
            item.tipo_venta === 'venta' ? styles.badgeSell : styles.badgeBuy,
          ]}
        >
          <Text style={styles.badgeText}>
            {item.tipo_venta === 'venta' ? 'VENTA' : 'COMPRA'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Total</Text>
        <Text style={styles.rowValue}>{fmtEur(item.total_eur)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Gramos</Text>
        <Text style={styles.rowValue}>{fmtGrams(item.grams)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Ley</Text>
        <Text style={styles.rowValue}>{item.purity}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Hora</Text>
        <Text style={styles.rowValue}>{item.hora}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
    

      <Text style={styles.subtitle}>Total: {total}</Text>

      {loading && pages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={() => load(1)} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : pages.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={64} color="#333" />
          <Text style={styles.empty}>Sin transacciones todavía</Text>
          <TouchableOpacity
            onPress={() => router.push('/newtransaction')}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Crear la primera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4A017"
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color="#D4A017"
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      <DetailModal tx={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function DetailModal({
  tx,
  onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={!!tx}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {tx && (
            <>
              <Text style={styles.modalTitle}>Detalle</Text>
              <DetailRow label="Cliente" value={tx.client_name || '—'} />
              <DetailRow label="Tipo" value={tx.tipo_venta} />
              <DetailRow label="Metal" value={tx.metal_type} />
              <DetailRow label="Gramos" value={fmtGrams(tx.grams)} />
              <DetailRow label="Ley" value={String(tx.purity)} />
              <DetailRow
                label="Descuento"
                value={`${fmt(tx.discount_percentage)} %`}
              />
              <View style={styles.divider} />
              <DetailRow label="€/g" value={fmtEur(tx.price_per_gram_eur)} />
              <DetailRow label="$/g" value={`${fmt(tx.price_per_gram_usd)} $`} />
              <DetailRow label="Subtotal" value={fmtEur(tx.subtotal_eur)} />
              {tx.vat_applied && (
                <DetailRow label="IVA" value={fmtEur(tx.vat_eur)} />
              )}
              <View style={styles.divider} />
              <DetailRow
                label="TOTAL EUR"
                value={fmtEur(tx.total_eur)}
                big
              />
              <DetailRow
                label="TOTAL USD"
                value={`${fmt(tx.total_usd)} $`}
                big
              />
              <View style={styles.divider} />
              <DetailRow label="Hora" value={tx.hora} />
              <DetailRow
                label="Fecha"
                value={fmtDate(tx.created_at) || tx.created_at}
              />

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, big && styles.detailLabelBig]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, big && styles.detailValueBig]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  subtitle: {
    color: '#888',
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  error: { color: '#FF6B6B', fontSize: 14, textAlign: 'center' },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4A017',
  },
  retryText: { color: '#D4A017', fontWeight: '700' },
  empty: { color: '#666', fontSize: 14, marginTop: 12 },
  cta: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#D4A017',
  },
  ctaText: { color: '#0B0B0B', fontWeight: '700' },

  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  client: { color: '#FFF', fontSize: 15, fontWeight: '700', flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeSell: { backgroundColor: '#7f1d1d' },
  badgeBuy: { backgroundColor: '#14532d' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: { color: '#888', fontSize: 13 },
  rowValue: { color: '#FFF', fontSize: 13, fontWeight: '500' },

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
    maxHeight: '90%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 10 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: { color: '#888', fontSize: 13 },
  detailLabelBig: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  detailValue: { color: '#DDD', fontSize: 13 },
  detailValueBig: { color: '#D4A017', fontWeight: '700', fontSize: 16 },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
  },
  closeBtnText: { color: '#FFF', fontWeight: '700' },
});