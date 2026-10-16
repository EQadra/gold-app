import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { transactionsApi } from '../src/api/transactions';
import { useAuth } from '../src/context/AuthContext';
import { buildReceiptData, printer } from '../src/print';
import { fmtCompact as fmt, toNum } from '../src/utils/format';
import { calculateGold } from '../src/utils/goldCalc';

interface FormState {
  client_name: string;
  price_oz_usd: string;
  eur_usd_rate: string;
  purity: string;
  grams: string;
  discount_percentage: string;
  is_investment: boolean;
  tipo_venta: 'compra' | 'venta';
}

const initialState: FormState = {
  client_name: '',
  price_oz_usd: '',
  eur_usd_rate: '',
  purity: '0.75',
  grams: '',
  discount_percentage: '',
  is_investment: true,
  tipo_venta: 'venta',
};

export default function NewTransactionScreen() {
  const { user } = useAuth();
  const companyName = user?.company?.name ?? 'Mi Empresa';

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const calc = calculateGold({
    grams: toNum(form.grams),
    purity: toNum(form.purity),
    priceOzUsd: toNum(form.price_oz_usd),
    eurUsdRate: toNum(form.eur_usd_rate),
    discountPct: toNum(form.discount_percentage),
    isInvestment: form.is_investment,
  });

  const isValid =
    toNum(form.grams) > 0 &&
    toNum(form.purity) > 0 &&
    toNum(form.price_oz_usd) > 0 &&
    toNum(form.eur_usd_rate) > 0;

  const clearAll = () => setForm(initialState);

  const onSubmit = async () => {
    if (!isValid) {
      Alert.alert('Datos incompletos', 'Revisa los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await transactionsApi.create({
        grams: toNum(form.grams),
        purity: toNum(form.purity),
        price_oz_usd: toNum(form.price_oz_usd),
        eur_usd_rate: toNum(form.eur_usd_rate),
        discount_percentage: toNum(form.discount_percentage) || 0,
        is_investment: form.is_investment,
        client_name: form.client_name || undefined,
        tipo_venta: form.tipo_venta,
      });

      setReceiptVisible(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        clearAll();
        router.back();
      }, 1500);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.message ?? 'No se pudo registrar la transacción.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyReceipt = async () => {
    try {
      const receipt = buildReceiptData({ companyName, form, calc });
      await printer.copyAsText(receipt);
      Alert.alert('Copiado', 'Recibo copiado al portapapeles.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo copiar');
    }
  };

  const printReceipt = async () => {
    try {
      const receipt = buildReceiptData({ companyName, form, calc });
      await printer.print(receipt);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo imprimir');
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
        {/* Tipo de venta */}
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.row}>
          {(['venta', 'compra'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => set('tipo_venta', t)}
              style={[styles.pill, form.tipo_venta === t && styles.pillActive]}
            >
              <Text
                style={[
                  styles.pillText,
                  form.tipo_venta === t && styles.pillTextActive,
                ]}
              >
                {t === 'venta' ? 'Venta' : 'Compra'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inversión */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => set('is_investment', !form.is_investment)}
        >
          <Ionicons
            name={form.is_investment ? 'checkbox' : 'square-outline'}
            size={22}
            color="#D4A017"
          />
          <Text style={styles.checkText}>
            Oro de inversión (exento de IVA)
          </Text>
        </TouchableOpacity>

        {/* Inputs */}
        <Field
          label="Cliente / Empresa"
          value={form.client_name}
          onChangeText={(v) => set('client_name', v)}
          placeholder="Nombre del cliente"
        />
        <Field
          label="Precio onza (USD)"
          value={form.price_oz_usd}
          onChangeText={(v) => set('price_oz_usd', v)}
          placeholder="Ej: 2400.50"
          keyboardType="decimal-pad"
        />
        <Field
          label="Tipo de cambio EUR/USD"
          value={form.eur_usd_rate}
          onChangeText={(v) => set('eur_usd_rate', v)}
          placeholder="Ej: 0.92"
          keyboardType="decimal-pad"
        />
        <Field
          label="Ley / Pureza"
          value={form.purity}
          onChangeText={(v) => set('purity', v)}
          placeholder="Ej: 0.75 (75%)"
          keyboardType="decimal-pad"
          hint="0.01 – 1.00"
        />
        <Field
          label="Gramos"
          value={form.grams}
          onChangeText={(v) => set('grams', v)}
          placeholder="Ej: 10.5"
          keyboardType="decimal-pad"
        />
        <Field
          label="Descuento (%)"
          value={form.discount_percentage}
          onChangeText={(v) => set('discount_percentage', v)}
          placeholder="Ej: 5"
          keyboardType="decimal-pad"
        />

        {/* Resultado en vivo */}
        {isValid && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Cálculo</Text>

            <Row label="€/gramo (ley)" value={`${fmt(calc.eurPerGram)} €`} />
            <Row label="$/gramo (ley)" value={`${fmt(calc.usdPerGram)} $`} />
            <View style={styles.divider} />

            <Row label="Subtotal" value={`${fmt(calc.subtotalEur)} €`} />
            {calc.discountEur > 0 && (
              <Row
                label="Descuento"
                value={`- ${fmt(calc.discountEur)} €`}
                accent="#FF6B6B"
              />
            )}
            {calc.vatApplied && (
              <Row
                label={`IVA (${(calc.vatRate * 100).toFixed(0)}%)`}
                value={`${fmt(calc.vatEur)} €`}
              />
            )}
            <View style={styles.divider} />
            <Row label="TOTAL EUR" value={`${fmt(calc.totalEur)} €`} big />
            <Row label="TOTAL USD" value={`${fmt(calc.totalUsd)} $`} big />
          </View>
        )}

        {/* Botones */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={clearAll}
            style={[styles.btn, styles.btnGhost]}
          >
            <Text style={styles.btnGhostText}>Limpiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setReceiptVisible(true)}
            disabled={!isValid}
            style={[
              styles.btn,
              styles.btnSecondary,
              !isValid && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.btnSecondaryText}>Ver recibo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ModalReceipt
        visible={receiptVisible}
        onClose={() => setReceiptVisible(false)}
        onSave={onSubmit}
        onCopy={copyReceipt}
        onPrint={printReceipt}
        form={form}
        calc={calc}
        saving={loading}
      />

      <ModalSuccess visible={success} />
    </KeyboardAvoidingView>
  );
}

/* -------- Subcomponentes -------- */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        autoCorrect={false}
        style={styles.input}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function Row({
  label,
  value,
  big,
  accent,
}: {
  label: string;
  value: string;
  big?: boolean;
  accent?: string;
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.rowLabel, big && styles.rowLabelBig]}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          big && styles.rowValueBig,
          accent && { color: accent },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ModalReceipt({
  visible,
  onClose,
  onSave,
  onCopy,
  onPrint,
  form,
  calc,
  saving,
}: any) {
  return (
    <ModalBase visible={visible} onClose={onClose}>
      <Text style={styles.modalTitle}>Recibo</Text>
      <View style={styles.receiptDivider} />
      {form.client_name ? (
        <Text style={styles.receiptText}>👤 {form.client_name}</Text>
      ) : null}
      <Text style={styles.receiptText}>
        Tipo: {form.tipo_venta === 'venta' ? 'Venta' : 'Compra'}
      </Text>
      <Text style={styles.receiptText}>
        IVA: {calc.vatApplied ? '21%' : 'Exento (inversión)'}
      </Text>
      <View style={styles.receiptDivider} />
      <Text style={styles.receiptText}>
        €/g: {fmt(calc.eurPerGram)} €
      </Text>
      <Text style={styles.receiptText}>
        Gramos: {fmt(Number(form.grams) || 0)} g
      </Text>
      <View style={styles.receiptDivider} />
      <Text style={styles.receiptTotal}>Total: {fmt(calc.totalEur)} €</Text>
      <Text style={styles.receiptTextSmall}>
        {fmt(calc.totalUsd)} $ · Ley {form.purity}
      </Text>

      <View style={styles.modalActions}>
        <TouchableOpacity
          onPress={onCopy}
          style={[styles.btn, styles.btnGhost]}
        >
          <Text style={styles.btnGhostText}>Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onPrint}
          style={[styles.btn, styles.btnSecondary]}
        >
          <Text style={styles.btnSecondaryText}>Imprimir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={[styles.btn, styles.btnPrimary]}
        >
          {saving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.btnPrimaryText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ModalBase>
  );
}

function ModalSuccess({ visible }: { visible: boolean }) {
  return (
    <ModalBase visible={visible} onClose={() => {}}>
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Ionicons name="checkmark-circle" size={64} color="#4ADE80" />
        <Text style={styles.successTitle}>¡Guardado!</Text>
        <Text style={styles.successText}>
          Transacción registrada correctamente
        </Text>
      </View>
    </ModalBase>
  );
}

function ModalBase({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>{children}</View>
      </View>
    </Modal>
  );
}

/* -------- Styles -------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  scroll: { padding: 20, paddingTop: 20, paddingBottom: 60 },

  label: { color: '#AAA', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  hint: { color: '#666', fontSize: 11, marginTop: 4 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: { color: '#AAA', fontSize: 13 },
  rowLabelBig: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  rowValue: { color: '#FFF', fontSize: 13 },
  rowValueBig: { fontSize: 18, fontWeight: '700' },

  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A017',
  },
  pillActive: { backgroundColor: '#D4A017' },
  pillText: { color: '#D4A017', fontWeight: '700' },
  pillTextActive: { color: '#0B0B0B' },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  checkText: { color: '#DDD', fontSize: 14 },

  resultCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginTop: 8,
  },
  resultTitle: {
    color: '#D4A017',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 10,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#D4A017' },
  btnPrimaryText: { color: '#0B0B0B', fontWeight: '700', fontSize: 15 },
  btnSecondary: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  btnSecondaryText: { color: '#D4A017', fontWeight: '700', fontSize: 15 },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  btnGhostText: { color: '#AAA', fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  receiptDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#333',
    marginVertical: 10,
  },
  receiptText: { color: '#DDD', fontSize: 14, marginVertical: 3 },
  receiptTextSmall: { color: '#888', fontSize: 12, marginTop: 4 },
  receiptTotal: {
    color: '#D4A017',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },

  successTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  successText: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});