import { Account, CreditCard, InternalTransfer, Transaction, CategoryBudget } from '../types';

// Empty defaults: no sample financial or personal data is loaded into a new installation.
export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_CREDIT_CARDS: CreditCard[] = [];
export const INITIAL_TRANSFERS: InternalTransfer[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_BUDGETS: CategoryBudget[] = [];
export const MONTHLY_HISTORY_2024: { month: string; receitas: number; despesas: number; liquido: number }[] = [];
