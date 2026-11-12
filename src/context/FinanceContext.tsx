import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Account, CreditCard, InternalTransfer, Transaction, CategoryBudget, ActiveTab } from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CREDIT_CARDS,
  INITIAL_TRANSACTIONS,
  INITIAL_TRANSFERS,
  INITIAL_BUDGETS,
  MONTHLY_HISTORY_2024,
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface FinanceContextType {
  // Navigation & Filters
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  filterAccount: string;
  setFilterAccount: (accId: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Data
  accounts: Account[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  transfers: InternalTransfer[];
  budgets: CategoryBudget[];

  // Computed account balances
  accountBalances: Record<string, number>;
  totalConsolidatedBalance: number;

  // Computed KPIs for selected period
  monthlyReceitas: number;
  monthlyDespesas: number;
  resultadoLiquido: number;
  margemPoupanca: number;
  faturasEmAbertoTotal: number;
  totalLimiteLivre: number;

  // Computed filtered list
  filteredTransactions: Transaction[];

  // Category breakdown for selected period
  categoryBreakdown: { category: string; amount: number; percentage: number; color: string }[];

  // Monthly Cash Flow data
  cashFlowHistory: { month: string; receitas: number; despesas: number; liquido: number }[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'isInactive'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  toggleInactivateTransaction: (id: string) => void;
  deleteTransaction: (id: string) => void;
  executeTransfer: (transfer: Omit<InternalTransfer, 'id' | 'status'>) => boolean;
  addAccount: (account: Omit<Account, 'id' | 'isActive'>) => void;
  updateBudget: (category: string, newLimit: number) => void;
  payCardInvoice: (cardId: string, fromAccountId: string, amount: number) => void;
  resetToDefaultData: () => void;

  // Notifications
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'financas_pro_v2_';

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('10');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Persistent States
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}accounts`);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}cards`);
      return saved ? JSON.parse(saved) : INITIAL_CREDIT_CARDS;
    } catch {
      return INITIAL_CREDIT_CARDS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}transactions`);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [transfers, setTransfers] = useState<InternalTransfer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}transfers`);
      return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
    } catch {
      return INITIAL_TRANSFERS;
    }
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}budgets`);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}cards`, JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}transfers`, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}budgets`, JSON.stringify(budgets));
  }, [budgets]);

  // Toast Helpers
  const showToast = (title: string, description?: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Dynamic Account Balances
  // Initial Balance + Active Receitas - Active Bank Despesas + Transfers In - Transfers Out
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    accounts.forEach((acc) => {
      balances[acc.id] = acc.initialBalance;
    });

    const initialTxMap = new Map(INITIAL_TRANSACTIONS.map((tx) => [tx.id, tx]));
    const currentTxMap = new Map(transactions.map((tx) => [tx.id, tx]));

    // 1. Initial transactions that were altered (inactivated or deleted)
    INITIAL_TRANSACTIONS.forEach((initTx) => {
      const current = currentTxMap.get(initTx.id);
      const wasActiveInitially = !initTx.isInactive;
      const isCurrentlyActive = current ? !current.isInactive : false;

      if (wasActiveInitially && !isCurrentlyActive) {
        if (initTx.paymentMethod === 'conta' && balances[initTx.accountId] !== undefined) {
          if (initTx.type === 'Receita') {
            balances[initTx.accountId] -= initTx.amount;
          } else {
            balances[initTx.accountId] += initTx.amount;
          }
        }
      } else if (!wasActiveInitially && isCurrentlyActive) {
        if (initTx.paymentMethod === 'conta' && balances[initTx.accountId] !== undefined) {
          if (initTx.type === 'Receita') {
            balances[initTx.accountId] += initTx.amount;
          } else {
            balances[initTx.accountId] -= initTx.amount;
          }
        }
      }
    });

    // 2. Brand new transactions (not in initial baseline)
    transactions.forEach((tx) => {
      if (!initialTxMap.has(tx.id) && !tx.isInactive && tx.paymentMethod === 'conta') {
        if (balances[tx.accountId] !== undefined) {
          if (tx.type === 'Receita') {
            balances[tx.accountId] += tx.amount;
          } else {
            balances[tx.accountId] -= tx.amount;
          }
        }
      }
    });

    // 3. Transfers delta
    const initialTransferIds = new Set(INITIAL_TRANSFERS.map((t) => t.id));
    transfers.forEach((tr) => {
      if (!initialTransferIds.has(tr.id) && tr.status === 'Ativo') {
        if (balances[tr.fromAccountId] !== undefined) {
          balances[tr.fromAccountId] -= tr.amount;
        }
        if (balances[tr.toAccountId] !== undefined) {
          balances[tr.toAccountId] += tr.amount;
        }
      }
    });

    return balances;
  }, [accounts, transactions, transfers]);

  const totalConsolidatedBalance = useMemo(() => {
    return Object.values(accountBalances).reduce((sum, val) => sum + val, 0);
  }, [accountBalances]);

  // Active transactions in selected month & year
  const activeMonthTransactions = useMemo(() => {
    const padMonth = selectedMonth.padStart(2, '0');
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const parts = tx.date.split('-');
      if (parts.length < 2) return false;
      const txYear = parts[0];
      const txMonth = parts[1];
      return txYear === selectedYear && txMonth === padMonth;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Filtered transactions for the Table view
  const filteredTransactions = useMemo(() => {
    return activeMonthTransactions.filter((tx) => {
      if (filterAccount !== 'all') {
        if (tx.accountId !== filterAccount && tx.cardId !== filterAccount) {
          return false;
        }
      }
      if (filterCategory !== 'all') {
        const catNorm = tx.category.toLowerCase().replace(/[^a-z]/g, '');
        const filterNorm = filterCategory.toLowerCase().replace(/[^a-z]/g, '');
        if (!catNorm.includes(filterNorm) && !filterNorm.includes(catNorm)) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesAcc = tx.accountId.toLowerCase().includes(query);
        const matchesVal = tx.amount.toString().includes(query);
        if (!matchesDesc && !matchesCat && !matchesAcc && !matchesVal) {
          return false;
        }
      }
      return true;
    });
  }, [activeMonthTransactions, filterAccount, filterCategory, searchTerm]);

  // Monthly KPIs
  const monthlyReceitas = useMemo(() => {
    return activeMonthTransactions
      .filter((tx) => !tx.isInactive && tx.type === 'Receita')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activeMonthTransactions]);

  const monthlyDespesas = useMemo(() => {
    return activeMonthTransactions
      .filter((tx) => !tx.isInactive && tx.type === 'Despesa' && !tx.isInvoicePayment)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activeMonthTransactions]);

  const resultadoLiquido = useMemo(() => {
    return monthlyReceitas - monthlyDespesas;
  }, [monthlyReceitas, monthlyDespesas]);

  const margemPoupanca = useMemo(() => {
    if (monthlyReceitas <= 0) return 0;
    return (resultadoLiquido / monthlyReceitas) * 100;
  }, [monthlyReceitas, resultadoLiquido]);

  // Card Invoices in selected month
  const faturasEmAbertoTotal = useMemo(() => {
    return activeMonthTransactions
      .filter((tx) => !tx.isInactive && tx.paymentMethod === 'cartao' && !tx.invoiceSettled)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activeMonthTransactions]);

  const totalLimiteLivre = useMemo(() => {
    const totalLimits = creditCards.reduce((acc, c) => acc + c.limit, 0);
    return Math.max(0, totalLimits - faturasEmAbertoTotal);
  }, [creditCards, faturasEmAbertoTotal]);

  // Category Breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    const activeDespesas = activeMonthTransactions.filter(
      (tx) => !tx.isInactive && tx.type === 'Despesa' && !tx.isInvoicePayment
    );
    const totalExp = activeDespesas.reduce((acc, tx) => acc + tx.amount, 0);

    activeDespesas.forEach((tx) => {
      const current = map.get(tx.category) || 0;
      map.set(tx.category, current + tx.amount);
    });

    const categoryColors: Record<string, string> = {
      Moradia: '#0051d5',
      Alimentação: '#316bf3',
      Transporte: '#009668',
      'Saúde & Cuidados': '#dae2fd',
      'Lazer & Cultura': '#76777d',
      Outros: '#cbdbf5',
    };

    const result = Array.from(map.entries()).map(([category, amount]) => {
      const percentage = totalExp > 0 ? (amount / totalExp) * 100 : 0;
      return {
        category,
        amount,
        percentage,
        color: categoryColors[category] || '#565e74',
      };
    });

    result.sort((a, b) => b.amount - a.amount);
    return result;
  }, [activeMonthTransactions]);

  // Dynamic Cash Flow for 2024
  const cashFlowHistory = useMemo(() => {
    return MONTHLY_HISTORY_2024.map((item, idx) => {
      const monthNum = (idx + 1).toString().padStart(2, '0');
      if (monthNum === selectedMonth && selectedYear === '2024') {
        return {
          month: item.month,
          receitas: monthlyReceitas,
          despesas: monthlyDespesas,
          liquido: resultadoLiquido,
        };
      }
      return item;
    });
  }, [selectedMonth, selectedYear, monthlyReceitas, monthlyDespesas, resultadoLiquido]);

  // Actions
  const addTransaction = (txData: Omit<Transaction, 'id' | 'isInactive'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      isInactive: false,
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      'Lançamento Registrado',
      `${txData.type === 'Receita' ? '+ R$' : '- R$'} ${txData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${txData.description}`,
      'success'
    );
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
    showToast('Lançamento Atualizado', 'As alterações foram salvas com sucesso.', 'info');
  };

  const toggleInactivateTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const newInactive = !tx.isInactive;
          showToast(
            newInactive ? 'Lançamento Inativado' : 'Lançamento Reativado',
            newInactive
              ? `O registro "${tx.description}" foi inativado e excluído dos totais contábeis.`
              : `O registro "${tx.description}" foi reintegrado à contabilidade ativa.`,
            newInactive ? 'warning' : 'success'
          );
          return {
            ...tx,
            isInactive: newInactive,
            status: newInactive ? 'Inativado' : (tx.type === 'Receita' ? 'Recebido' : 'Pago'),
          };
        }
        return tx;
      })
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    showToast('Lançamento Excluído', 'O registro foi removido definitivamente.', 'error');
  };

  const executeTransfer = (transferData: Omit<InternalTransfer, 'id' | 'status'>): boolean => {
    if (transferData.fromAccountId === transferData.toAccountId) {
      showToast('Erro na Transferência', 'Contas de origem e destino devem ser distintas.', 'error');
      return false;
    }

    const available = accountBalances[transferData.fromAccountId] || 0;
    if (transferData.amount <= 0) {
      showToast('Valor Inválido', 'O valor da transferência deve ser maior que zero.', 'error');
      return false;
    }

    if (transferData.amount > available) {
      showToast(
        'Aviso de Saldo Insuficiente',
        `A conta de origem possui R$ ${available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, mas a transferência foi executada sob supervisão contábil.`,
        'warning'
      );
    }

    const newTransfer: InternalTransfer = {
      ...transferData,
      id: `#TR-${Math.floor(109 + Math.random() * 890)}`,
      status: 'Ativo',
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    showToast(
      'Transferência Efetivada',
      `R$ ${transferData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} transferidos com Neutralidade DRE (R$ 0,00).`,
      'success'
    );
    return true;
  };

  const addAccount = (accountData: Omit<Account, 'id' | 'isActive'>) => {
    const id = `acc-${Date.now()}`;
    const newAcc: Account = {
      ...accountData,
      id,
      isActive: true,
    };
    setAccounts((prev) => [...prev, newAcc]);
    showToast('Nova Conta Cadastrada', `${newAcc.name} foi integrada ao patrimônio consolidado.`, 'success');
  };

  const updateBudget = (category: string, newLimit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit: newLimit } : b))
    );
    showToast('Orçamento Atualizado', `Teto de "${category}" ajustado para R$ ${newLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'info');
  };

  const payCardInvoice = (cardId: string, fromAccountId: string, amount: number) => {
    const card = creditCards.find((c) => c.id === cardId);
    const cardName = card ? card.name : 'Cartão';
    
    // Register bank debit transaction for paying the card with anti-dupla contagem flag
    const paymentTx: Transaction = {
      id: `tx-pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Pagamento de Fatura ${cardName}`,
      category: 'Outros',
      type: 'Despesa',
      amount,
      accountId: fromAccountId,
      paymentMethod: 'conta',
      status: 'Pago',
      isInactive: false,
      isInvoicePayment: true,
      notes: `Liquidação bancária de fatura com proteção anti-dupla contagem.`,
    };

    // Mark current open card transactions as settled and prepend the bank debit transaction
    setTransactions((prev) => [
      paymentTx,
      ...prev.map((tx) =>
        tx.cardId === cardId && !tx.invoiceSettled
          ? { ...tx, invoiceSettled: true }
          : tx
      ),
    ]);

    showToast(
      'Fatura Liquidada com Sucesso',
      `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pagos via débito em conta. Limite restabelecido.`,
      'success'
    );
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}accounts`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}cards`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}transactions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}transfers`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}budgets`);

    setAccounts(INITIAL_ACCOUNTS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTransfers(INITIAL_TRANSFERS);
    setBudgets(INITIAL_BUDGETS);
    setSelectedMonth('10');
    setSelectedYear('2024');
    setFilterAccount('all');
    setFilterCategory('all');
    setSearchTerm('');

    showToast('Dados Restaurados', 'Todos os parâmetros executivos foram redefinidos para o padrão original.', 'info');
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        filterAccount,
        setFilterAccount,
        filterCategory,
        setFilterCategory,
        searchTerm,
        setSearchTerm,
        accounts,
        creditCards,
        transactions,
        transfers,
        budgets,
        accountBalances,
        totalConsolidatedBalance,
        monthlyReceitas,
        monthlyDespesas,
        resultadoLiquido,
        margemPoupanca,
        faturasEmAbertoTotal,
        totalLimiteLivre,
        filteredTransactions,
        categoryBreakdown,
        cashFlowHistory,
        addTransaction,
        updateTransaction,
        toggleInactivateTransaction,
        deleteTransaction,
        executeTransfer,
        addAccount,
        updateBudget,
        payCardInvoice,
        resetToDefaultData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
