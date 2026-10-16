import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildPlainReceipt } from './receiptBuilder';
import type { Printer, PrinterService, ReceiptData } from './types';

export class PdfPrinter implements PrinterService {
  async listPrinters(): Promise<Printer[]> {
    return [{ id: 'pdf', name: 'PDF / Compartir', type: 'pdf' }];
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async print(receipt: ReceiptData): Promise<void> {
    // Nuevo flujo: compartir como TEXTO PLANO (no PDF)
    await this.shareAsText(receipt);
  }

  async shareAsPdf(receipt: ReceiptData): Promise<void> {
    await this.shareAsText(receipt); // alias
  }

  /**
   * Compartir como TEXTO PLANO.
   * RawBT (o cualquier app) lo recibe y lo manda a la impresora directo.
   */
  async shareAsText(receipt: ReceiptData): Promise<void> {
    const text = buildPlainReceipt(receipt);

    // 1. Guardar como .txt
    const fileName = `receipt-${Date.now()}.txt`;
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, text, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 2. Compartir el .txt
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Enviar a impresora',
      UTI: 'public.plain-text',
    });
  }

  async copyAsText(receipt: ReceiptData): Promise<void> {
    await Clipboard.setStringAsync(buildPlainReceipt(receipt));
  }
}