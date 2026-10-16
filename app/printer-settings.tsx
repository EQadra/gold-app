import { printer, printerStorage } from '@/src/print';
import type { Printer } from '@/src/print/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePrintersDiscovery } from 'react-native-esc-pos-printer';

// MAC de tu impresora MPT-II (temporal, solo para la prueba)
const TEST_MAC = 'DC:0D:51:40:B7:AB';

export default function PrinterSetupScreen() {
  const [saved, setSaved] = useState<Printer | null>(null);
  const [testing, setTesting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { start, isDiscovering, printers, printerError } = usePrintersDiscovery();

  // Cargar impresora guardada
  useEffect(() => {
    printerStorage.get().then(setSaved);
  }, []);

  // Auto-iniciar descubrimiento
  useEffect(() => {
    start({ timeout: 8000 });
  }, []);

  const onSelect = async (device: any) => {
    const p: Printer = {
      id: device.target ?? device.deviceName,
      name: device.deviceName ?? 'Impresora',
      type: 'bluetooth',
      address: device.target,
    };
    await printerStorage.save(p);
    setSaved(p);
    Alert.alert(
      '✅ Guardada',
      `${p.name} configurada como impresora por defecto.`
    );
  };

  const onClear = async () => {
    await printerStorage.clear();
    setSaved(null);
    Alert.alert('Borrada', 'La impresora por defecto ha sido eliminada.');
  };

  // ---------- PRUEBA DIRECTA CON MAC HARDCODEADA ----------
  const onTestDirect = async () => {
    setTesting(true);
    try {
      await printer.connect(TEST_MAC);
      Alert.alert(
        '✅ Conectado',
        `La impresora ${TEST_MAC} respondió al connect.\n\n` +
          'Si al imprimir no sale nada, es SPP puro y hay que migrar de librería.'
      );
    } catch (e: any) {
      Alert.alert(
        '❌ Falló la conexión',
        e?.message ?? 'No conecta. Probablemente es Bluetooth Classic (SPP).'
      );
    } finally {
      setTesting(false);
    }
  };

  // ---------- GUARDAR LA MAC MANUALMENTE ----------
  const onSaveManual = async () => {
    const p: Printer = {
      id: TEST_MAC,
      name: 'MPT-II',
      type: 'bluetooth',
      address: TEST_MAC,
    };
    await printerStorage.save(p);
    setSaved(p);
    Alert.alert('✅ Guardada', 'MPT-II configurada manualmente.');
  };

//--------------------------------------------------------------------

const onTestPrint = async () => {
  setPrinting(true);
  try {
    await printer.connect(TEST_MAC);

    const { printText } = await import('@rejaul/react-native-printer-kit');

    await printText({
      text:
        'GOLD APP\n' +
        'Prueba de impresion\n' +
        '--------------------\n' +
        'Producto 1     $10.00\n' +
        'Producto 2      $5.00\n' +
        '--------------------\n' +
        'TOTAL          $15.00\n' +
        '--------------------\n' +
        'Gracias por su compra\n\n\n',
    });

    Alert.alert('✅ Impreso', 'Si ves el texto, funciona.');
  } catch (e: any) {
    console.log('PRINT ERROR:', e?.message ?? e);
    Alert.alert('❌ Falló la impresión', e?.message ?? 'No imprime');
  } finally {
    setPrinting(false);
  }
};
  // ---------- PRUEBA DE IMPRESIÓN REAL ----------
  // const onTestPrint = async () => {
  //   setPrinting(true);
  //   try {
  //     await printer.connect(TEST_MAC);

  //     await printer.print({
  //       companyName: 'GOLD APP',
  //       companyInfo: 'Prueba de impresión',
  //       date: new Date().toLocaleString(),
  //       tipoVenta: 'prueba',
  //       clientName: 'Cliente Demo',
  //       items: [
  //         { label: 'Producto 1', value: '$10.00' },
  //         { label: 'Producto 2', value: '$5.00' },
  //       ],
  //       totals: [
  //         { label: 'Subtotal', value: '$15.00' },
  //         { label: 'TOTAL', value: '$15.00', big: true },
  //       ],
  //       footer: 'Gracias por su compra',
  //     });

  //     Alert.alert('✅ Impreso', 'Si ves papel salir, funciona.');
  //   } catch (e: any) {
  //     console.log('PRINT ERROR:', e?.message ?? e);
  //     Alert.alert('❌ Falló la impresión', e?.message ?? 'No imprime');
  //   } finally {
  //     setPrinting(false);
  //   }
  // };

  return (
    <View style={styles.root}>
      {/* Estado actual */}
      <View style={styles.savedBox}>
        <Text style={styles.savedLabel}>Impresora actual</Text>
        {saved ? (
          <View style={styles.savedRow}>
            <Ionicons name="print" size={20} color="#4ADE80" />
            <View style={{ flex: 1 }}>
              <Text style={styles.savedName}>{saved.name}</Text>
              <Text style={styles.savedAddress}>{saved.address}</Text>
            </View>
            <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.savedEmpty}>Sin impresora configurada</Text>
        )}
      </View>

      {/* ---------- BOTONES DE PRUEBA (temporal) ---------- */}
      <View style={styles.testBox}>
        <Text style={styles.testTitle}>Prueba manual</Text>
        <Text style={styles.testMac}>{TEST_MAC}</Text>

        <View style={styles.testRow}>
          <TouchableOpacity
            onPress={onTestDirect}
            disabled={testing || printing}
            style={[styles.testBtn, (testing || printing) && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {testing ? (
              <ActivityIndicator color="#0B0B0B" size="small" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={16} color="#0B0B0B" />
                <Text style={styles.testBtnText}>Probar conexión</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onTestPrint}
            disabled={testing || printing}
            style={[
              styles.testBtnOutline,
              (testing || printing) && { opacity: 0.6 },
            ]}
            activeOpacity={0.85}
          >
            {printing ? (
              <ActivityIndicator color="#D4A017" size="small" />
            ) : (
              <>
                <Ionicons name="print-outline" size={16} color="#D4A017" />
                <Text style={styles.testBtnOutlineText}>Probar imprimir</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onSaveManual}
          style={styles.testBtnGhost}
          activeOpacity={0.85}
        >
          <Ionicons name="save-outline" size={16} color="#888" />
          <Text style={styles.testBtnGhostText}>Guardar MAC manualmente</Text>
        </TouchableOpacity>
      </View>

      {/* Descubrimiento */}
      <View style={styles.discoverHeader}>
        <Text style={styles.discoverTitle}>
          {isDiscovering ? 'Buscando impresoras...' : 'Impresoras encontradas'}
        </Text>
        <TouchableOpacity
          onPress={() => start({ timeout: 8000 })}
          disabled={isDiscovering}
          style={styles.refreshBtn}
        >
          <Ionicons name="refresh" size={18} color="#D4A017" />
        </TouchableOpacity>
      </View>

      {isDiscovering && printers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.hint}>
            Asegúrate de que tu impresora está encendida y emparejada.
          </Text>
        </View>
      ) : printers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bluetooth-outline" size={48} color="#333" />
          <Text style={styles.empty}>Sin impresoras encontradas</Text>
          <Text style={styles.hint}>
            Comprueba que el Bluetooth está activado y la impresora está
            emparejada en los ajustes del sistema.
          </Text>
        </View>
      ) : (
        <FlatList
          data={printers}
          keyExtractor={(item, idx) => item.target ?? String(idx)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              style={styles.printerCard}
              activeOpacity={0.85}
            >
              <View style={styles.printerIcon}>
                <Ionicons name="print-outline" size={22} color="#D4A017" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.printerName}>{item.deviceName}</Text>
                <Text style={styles.printerAddress}>{item.target}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#444" />
            </TouchableOpacity>
          )}
        />
      )}

      {printerError ? (
        <Text style={styles.errorText}>
          Error: {String(printerError?.message ?? printerError)}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        activeOpacity={0.85}
      >
        <Text style={styles.backBtnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },

  savedBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  savedLabel: { color: '#888', fontSize: 12, marginBottom: 8, fontWeight: '600' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  savedAddress: { color: '#666', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  savedEmpty: { color: '#666', fontSize: 13, fontStyle: 'italic' },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
  },

  /* ---------- Bloque temporal de prueba ---------- */
  testBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
  },
  testTitle: {
    color: '#D4A017',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  testMac: {
    color: '#FFF',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  testRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D4A017',
  },
  testBtnText: { color: '#0B0B0B', fontWeight: '700', fontSize: 13 },
  testBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4A017',
  },
  testBtnOutlineText: { color: '#D4A017', fontWeight: '700', fontSize: 13 },
  testBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
  },
  testBtnGhostText: { color: '#888', fontWeight: '600', fontSize: 12 },

  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  discoverTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  empty: { color: '#666', fontSize: 14, marginTop: 12 },
  hint: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },

  printerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    gap: 12,
  },
  printerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,160,23,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  printerAddress: { color: '#666', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },

  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },

  backBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
  },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});