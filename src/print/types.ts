export interface ReceiptLine {
  label: string;
  value: string;
}

export interface ReceiptTotal {
  label: string;
  value: string;
  big?: boolean;
}

export interface ReceiptData {
  companyName: string;
  companyInfo?: string;
  clientName?: string;
  date: string;
  tipoVenta: 'venta' | 'compra';
  items: ReceiptLine[];
  totals: ReceiptTotal[];
  footer?: string;
}

export interface Printer {
  id: string;
  name: string;
  type: 'pdf' | 'bluetooth' | 'usb' | 'network';
  address?: string;
}

export interface PrinterService {
  listPrinters(): Promise<Printer[]>;
  print(receipt: ReceiptData, printerId?: string): Promise<void>;
  shareAsPdf(receipt: ReceiptData): Promise<void>;
  copyAsText(receipt: ReceiptData): Promise<void>;
  isAvailable(): Promise<boolean>;
  /** Solo implementado en BluetoothPrinter. */
  connect?(address: string): Promise<void>;
  /** Solo implementado en BluetoothPrinter. */
  getSavedPrinter?(): Promise<Printer | null>;
}