import {
  connectPrinter,
  requestBluetoothPermission
} from '@rejaul/react-native-printer-kit';
import { Platform } from 'react-native';
import { printerStorage } from './storage';
import type { Printer, PrinterService, ReceiptData } from './types';

export class BluetoothPrinter implements PrinterService {
  private connectedAddress: string | null = null;

  async connect(address: string): Promise<void> {
    // Solicitar permisos de Bluetooth
    const granted = await requestBluetoothPermission();
    if (!granted) throw new Error('Permisos de Bluetooth denegados.');
    
    await connectPrinter({ address });
    this.connectedAddress = address;
  }

async print(receipt: ReceiptData, printerId?: string): Promise<void> {
  const address =
    printerId ?? this.connectedAddress ?? (await printerStorage.get())?.address;
  if (!address) throw new Error('No hay impresora configurada.');

  if (this.connectedAddress !== address) {
    await this.connect(address);
  }

  const { printText } = await import('@rejaul/react-native-printer-kit');
  const { buildPlainReceipt } = await import('./receiptBuilder');

  const plainText = buildPlainReceipt(receipt);

  await printText({ text: plainText + '\n\n\n' });
}

  async disconnect(): Promise<void> {
    this.connectedAddress = null;
  }

  async getSavedPrinter(): Promise<Printer | null> {
    return printerStorage.get();
  }

  async listPrinters(): Promise<Printer[]> {
    const saved = await printerStorage.get();
    return saved ? [saved] : [];
  }

  async shareAsPdf(): Promise<void> {}
  async copyAsText(): Promise<void> {}
  async isAvailable(): Promise<boolean> {
    return Platform.OS === 'android';
  }
}