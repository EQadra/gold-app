export const PERMISSIONS = {
  CASH_OPEN:   'cash-register.open',
  CASH_CLOSE:  'cash-register.close',
  CASH_VIEW:   'cash-register.view',
  TX_VIEW:     'transactions.view',
  TX_CREATE:   'transactions.create',
  USERS_VIEW:  'users.view',
  USERS_CREATE:'users.create',
  USERS_UPDATE:'users.update',
  USERS_DELETE:'users.delete',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  OWNER:       'owner',
  ADMIN:       'admin',
  CASHIER:     'cashier',
} as const;