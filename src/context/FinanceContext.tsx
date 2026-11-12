import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Account, CreditCard, InternalTransfer, Transaction, CategoryBudget, ActiveTab } from '../types';

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
  addCreditCard: (card: Omit<CreditCard, 'id'>) => boolean;
  addBudget: (budget: CategoryBudget) => boolean;
  updateBudget: (category: string, newLimit: number) => void;
  payCardInvoice: (cardId: string, fromAccountId: string, amount: number) => boolean;
  resetToDefaultData: () => void;
  clearAllData: () => void;
  profileName: string;
  updateProfileName: (name: string) => void;

  // Notifications
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'financas_pro_v3_';
const LEGACY_STORAGE_KEY_PREFIX = 'financas_pro_v2_';

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()));
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Persistent States
  const [accounts, setAccounts] = useState<Account[]>(() => { try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}accounts`) || '[]'); } catch { return []; } });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => { try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}cards`) || '[]'); } catch { return []; } });

  const [transactions, setTransactions] = useState<Transaction[]>(() => { try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}transactions`) || '[]'); } catch { return []; } });

  const [transfers, setTransfers] = useState<InternalTransfer[]>(() => { try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}transfers`) || '[]'); } catch { return []; } });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => { try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}budgets`) || '[]'); } catch { return []; } });
  const [profileName, setProfileName] = useState<string>(() => localStorage.getItem(`${STORAGE_KEY_PREFIX}profile`) || '');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Remove only this application's previous demo-storage namespace. Other apps' data is untouched.
  useEffect(() => {
    Object.keys(localStorage).filter((key) => key.startsWith(LEGACY_STORAGE_KEY_PREFIX)).forEach((key) => localStorage.removeItem(key));
  }, []);

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

  useEffect(() => { localStorage.setItem(`${STORAGE_KEY_PREFIX}profile`, profileName); }, [profileName]);

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

  // Account balances are derived exclusively from the user's own records.
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach((account) => { balances[account.id] = Number(account.initialBalance) || 0; });
    transactions.forEach((tx) => {
      if (tx.isInactive || tx.paymentMethod !== 'conta' || balances[tx.accountId] === undefined) return;
      balances[tx.accountId] += tx.type === 'Receita' ? tx.amount : -tx.amount;
    });
    transfers.forEach((transfer) => {
      if (transfer.status !== 'Ativo') return;
      if (balances[transfer.fromAccountId] !== undefined) balances[transfer.fromAccountId] -= transfer.amount;
      if (balances[transfer.toAccountId] !== undefined) balances[transfer.toAccountId] += transfer.amount;
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

  // Rolling 12-month cash flow, calculated only from real user transactions.
  const cashFlowHistory = useMemo(() => {
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return monthLabels.map((monthLabel, index) => {
      const month = String(index + 1).padStart(2, '0');
      const rows = transactions.filter((tx) => !tx.isInactive && tx.date?.startsWith(selectedYear + '-' + month));
      const receitas = rows.filter((tx) => tx.type === 'Receita').reduce((sum, tx) => sum + tx.amount, 0);
      const despesas = rows.filter((tx) => tx.type === 'Despesa' && !tx.isInvoicePayment).reduce((sum, tx) => sum + tx.amount, 0);
      return { month: monthLabel, receitas, despesas, liquido: receitas - despesas };
    });
  }, [transactions, selectedYear]);

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
    if (!Number.isFinite(transferData.amount) || transferData.amount <= 0) {
      showToast('Valor Inválido', 'O valor da transferência deve ser maior que zero.', 'error');
      return false;
    }

    if (!accounts.some((account) => account.id === transferData.fromAccountId) || !accounts.some((account) => account.id === transferData.toAccountId)) {
      showToast('Conta inválida', 'Selecione contas cadastradas para realizar a transferência.', 'error');
      return false;
    }
    if (transferData.amount > available) {
      showToast('Saldo insuficiente', 'A transferência não foi realizada porque o saldo da conta de origem é insuficiente.', 'error');
      return false;
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

  const addCreditCard = (cardData: Omit<CreditCard, 'id'>): boolean => {
    if (!cardData.name.trim() || !cardData.issuer.trim() || !accounts.some((account) => account.id === cardData.linkedAccountId) ||
        !Number.isFinite(cardData.limit) || cardData.limit <= 0 ||
        !Number.isInteger(cardData.closingDay) || cardData.closingDay < 1 || cardData.closingDay > 31 ||
        !Number.isInteger(cardData.dueDay) || cardData.dueDay < 1 || cardData.dueDay > 31) {
      showToast('Dados do cartão inválidos', 'Confira nome, emissor, limite, vencimento, fechamento e conta vinculada.', 'warning');
      return false;
    }
    const card: CreditCard = { ...cardData, id: 'card-' + Date.now() };
    setCreditCards((prev) => [...prev, card]);
    showToast('Cartão cadastrado', card.name + ' foi adicionado ao controle de cartões.', 'success');
    return true;
  };

  const addBudget = (budget: CategoryBudget): boolean => {
    const category = budget.category.trim();
    if (!category || !Number.isFinite(budget.limit) || budget.limit <= 0) {
      showToast('Orçamento inválido', 'Informe uma categoria e um limite mensal maior que zero.', 'warning');
      return false;
    }
    if (budgets.some((item) => item.category.toLowerCase() === category.toLowerCase())) {
      showToast('Categoria já cadastrada', 'Edite o orçamento existente para essa categoria.', 'warning');
      return false;
    }
    setBudgets((prev) => [...prev, { ...budget, category }]);
    showToast('Orçamento criado', 'O limite mensal de ' + category + ' foi cadastrado.', 'success');
    return true;
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
    const openInvoice = transactions.filter((tx) => !tx.isInactive && tx.cardId === cardId && !tx.invoiceSettled).reduce((sum, tx) => sum + tx.amount, 0);
    if (!card || !accounts.some((account) => account.id === fromAccountId) || !Number.isFinite(amount) || amount <= 0 || Math.abs(amount - openInvoice) > 0.009 || amount > (accountBalances[fromAccountId] || 0)) {
      showToast('Pagamento não realizado', 'Verifique o cartão, a conta de débito, o valor total da fatura e o saldo disponível.', 'error');
      return false;
    }
    
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
    return true;
  };

  const clearAllData = () => {
    Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_KEY_PREFIX) || key.startsWith(LEGACY_STORAGE_KEY_PREFIX)).forEach((key) => localStorage.removeItem(key));
    setAccounts([]); setCreditCards([]); setTransactions([]); setTransfers([]); setBudgets([]); setProfileName('');
    setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0')); setSelectedYear(String(new Date().getFullYear()));
    setFilterAccount('all'); setFilterCategory('all'); setSearchTerm('');
    showToast('Dados apagados', 'Os dados financeiros e o perfil deste aplicativo foram removidos deste dispositivo.', 'success');
  };

  const resetToDefaultData = clearAllData;
  const updateProfileName = (name: string) => setProfileName(name.trim().slice(0, 80));

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
        addCreditCard,
        addBudget,
        updateBudget,
        payCardInvoice,
        resetToDefaultData,
        clearAllData,
        profileName,
        updateProfileName,
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
