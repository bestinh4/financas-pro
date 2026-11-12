export type TransactionType = 'Receita' | 'Despesa';

export type TransactionStatus = 'Pago' | 'Recebido' | 'Pendente' | 'Inativado';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  accountId: string; // references Account id or Card id
  paymentMethod: 'conta' | 'cartao';
  cardId?: string;
  status: TransactionStatus;
  isInactive: boolean;
  notes?: string;
  invoiceSettled?: boolean;
  isInvoicePayment?: boolean;
  installments?: {
    current: number;
    total: number;
  };
}

export interface Account {
  id: string;
  name: string;
  type: 'corrente' | 'custodia' | 'reserva' | 'especie';
  typeLabel: string;
  institution: string;
  color: string;
  icon: string;
  initialBalance: number;
  isActive: boolean;
  accountNumber?: string;
}

export interface InternalTransfer {
  id: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  status: 'Ativo' | 'Inativado';
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  bgGradient: string;
  linkedAccountId: string;
}

export interface CategoryBudget {
  category: string;
  icon: string;
  color: string;
  limit: number;
}

export type ActiveTab = 'dashboard' | 'lancamentos' | 'contas' | 'cartoes-e-faturas' | 'orcamento-e-metas' | 'relatorios';
