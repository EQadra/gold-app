import { Platform } from 'react-native';
import { BluetoothPrinter } from './bluetoothPrinter';
import { PdfPrinter } from './pdfPrinter';
import type { PrinterService } from './types';

/**
 * Servicio de impresión activo.
 * - Android: Bluetooth ESC/POS nativo.
 * - iOS / Web: PDF + compartir (fallback).
 */
export const printer: PrinterService =
  Platform.OS === 'android' ? new BluetoothPrinter() : new PdfPrinter();

export { buildReceiptData } from './buildReceipt';
export { buildPlainReceipt, buildReceiptHtml } from './receiptBuilder';
export { printerStorage } from './storage';
export type {
    Printer,
    ReceiptData,
    ReceiptLine,
    ReceiptTotal
} from './types';
