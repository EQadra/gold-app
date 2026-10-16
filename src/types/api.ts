export interface Company {
  id: number;
  name: string;
  slug: string;
  plan: string;
  pais?: string | null;
  moneda?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  company_id: number;
  telefono?: string | null;
  genero?: 'masculino' | 'femenino' | 'otro' | null;
  avatar?: string | null;
  last_login_at?: string | null;
  company?: Company;
}

export interface AuthResponse {
  message: string;
  user: User;
  roles: string[];
  token: string;
}

export interface ProfileResponse {
  user: User;
  roles: string[];
  permisos: string[];
}

export interface CashRegister {
  id: number;
  company_id: number;
  name: string;
  date: string;
  opening_cash_eur: string;
  opening_gold: string;
  closing_cash_eur?: string | null;
  closing_gold?: string | null;
  balance_eur: string;
  balance_gold: string;
  opened_by: number;
  closed_by?: number | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  company_id: number;
  cash_register_id: number;
  created_by: number;
  client_name: string;
  metal_type: string;
  grams: string;
  purity: string;
  price_oz_usd: string;
  eur_usd_rate: string;
  discount_percentage: string;
  price_per_gram_eur: string;
  price_per_gram_usd: string;
  subtotal_eur: string;
  vat_eur: string;
  total_eur: string;
  total_usd: string;
  vat_applied: boolean;
  moneda: string;
  tipo_venta: 'compra' | 'venta';
  hora: string;
  created_at: string;
}

export interface News {
  id: number;
  titulo: string;
  descripcion: string;
  url?: string | null;
  fecha_publicacion: string;
  created_at: string;
}

export interface DashboardStats {
  stats: { label: string; value: number; icon: string }[];
  caja: CashRegister | null;
  ventas_hoy: {
    total_eur: number;
    total_usd: number;
    grams: number;
    count: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Paginated<T> {
  success: boolean;
  data: {
    current_page: number;
    data: T[];
    last_page: number;
    per_page: number;
    total: number;
  };
}