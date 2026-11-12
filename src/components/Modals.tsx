import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { parseCurrencyInput } from '../utils/currency';

interface NewTxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanReceipt?: () => void;
}

export const NewTxModal: React.FC<NewTxModalProps> = ({ isOpen, onClose, onOpenScanReceipt }) => {
  const { addTransaction, accounts, creditCards, showToast } = useFinance();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Despesa' | 'Receita'>('Despesa');
  const [category, setCategory] = useState('Moradia');
  const [accountOrCard, setAccountOrCard] = useState(accounts[0]?.id || creditCards[0]?.id || '');
  const [notes, setNotes] = useState('');

  // The modal may mount before the first account is created. Keep the displayed
  // fallback selection and the submitted selection in sync with live context data.
  const effectiveAccountOrCard =
    accounts.some((account) => account.id === accountOrCard) || creditCards.some((card) => card.id === accountOrCard)
      ? accountOrCard
      : accounts[0]?.id || creditCards[0]?.id || '';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(amount);
    if (!description.trim() || isNaN(val) || val <= 0) {
      showToast('Campos Obrigatórios', 'Preencha uma descrição válida e um valor positivo.', 'warning');
      return;
    }

    const isCard = creditCards.some((c) => c.id === effectiveAccountOrCard);
    const selectedAccount = accounts.find((account) => account.id === effectiveAccountOrCard);
    const selectedCard = creditCards.find((card) => card.id === effectiveAccountOrCard);
    const linkedAccount = selectedCard ? accounts.find((account) => account.id === selectedCard.linkedAccountId) : selectedAccount;
    if (!linkedAccount) {
      showToast('Conta necessária', 'Cadastre uma conta bancária válida antes de registrar este lançamento ou vincule o cartão a uma conta existente.', 'warning');
      return;
    }

    addTransaction({
      date,
      description: description.trim(),
      amount: val,
      type,
      category,
      paymentMethod: isCard ? 'cartao' : 'conta',
      accountId: linkedAccount.id,
      cardId: isCard ? effectiveAccountOrCard : undefined,
      status: type === 'Receita' ? 'Recebido' : 'Pago',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-space-lg shadow-2xl border border-surface-container">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">add_circle</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">Novo Lançamento</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {onOpenScanReceipt && (
          <div className="mb-4 p-2.5 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">document_scanner</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                Preencher com foto de comprovante ou nota?
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenScanReceipt}
              className="px-2.5 py-1 bg-secondary text-on-secondary rounded-md text-label-sm font-semibold hover:bg-secondary/90 transition-colors cursor-pointer shadow-xs"
            >
              Usar IA
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-body-md">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant font-medium">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant font-medium">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'Despesa' | 'Receita')}
                className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none cursor-pointer"
              >
                <option value="Despesa">Despesa (-)</option>
                <option value="Receita">Receita (+)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Consultoria, Compra Mercado, Aluguel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant font-medium">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-surface-container-low p-2 rounded-lg text-on-surface font-semibold border border-transparent focus:border-secondary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant font-medium">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none cursor-pointer"
              >
                <option value="Moradia">Moradia</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Receita PJ">Receita PJ</option>
                <option value="Saúde & Cuidados">Saúde & Cuidados</option>
                <option value="Transporte">Transporte</option>
                <option value="Lazer & Cultura">Lazer & Cultura</option>
                <option value="Aportes & Reservas">Aportes & Reservas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">
              Conta ou Cartão
            </label>
            <select
              value={effectiveAccountOrCard}
              onChange={(e) => setAccountOrCard(e.target.value)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Selecione uma conta ou cartão</option>
              <optgroup label="Contas Bancárias">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.typeLabel})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cartões de Crédito">
                {creditCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.issuer})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">
              Observações / Centro de Custo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Nota fiscal 4091, ref contrato anual..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-inverse-surface transition-colors shadow-sm"
            >
              Registrar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose }) => {
  const { addAccount, showToast } = useFinance();

  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<'corrente' | 'custodia' | 'reserva' | 'especie'>('corrente');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = initialBalance.trim() ? parseCurrencyInput(initialBalance) : 0;
    if (!Number.isFinite(balance) || balance < 0) {
      showToast('Saldo inválido', 'Informe um saldo inicial válido usando vírgula ou ponto decimal.', 'warning');
      return;
    }
    if (!name.trim()) {
      showToast('Campo Obrigatório', 'Informe o nome da instituição ou conta.', 'warning');
      return;
    }

    const typeLabels: Record<string, string> = {
      corrente: 'Conta Corrente',
      custodia: 'Custódia / CDBs',
      reserva: 'Reserva de Emergência',
      especie: 'Dinheiro em Espécie',
    };

    const colors: Record<string, string> = {
      corrente: '#0051d5',
      custodia: '#001e62',
      reserva: '#820ad1',
      especie: '#45464d',
    };

    const icons: Record<string, string> = {
      corrente: 'account_balance',
      custodia: 'savings',
      reserva: 'shield',
      especie: 'payments',
    };

    addAccount({
      name: name.trim(),
      institution: institution.trim() || name.trim(),
      type,
      typeLabel: typeLabels[type],
      color: colors[type],
      icon: icons[type],
      initialBalance: balance,
      accountNumber: accountNumber.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest rounded-xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-space-lg shadow-2xl border border-surface-container">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">account_balance</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">Nova Conta Bancária</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-body-md">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">
              Nome da Conta / Instituição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Santander Select, Bradesco Prime, Safra..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">Tipo de Conta</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none cursor-pointer"
            >
              <option value="corrente">Conta Corrente</option>
              <option value="custodia">Custódia / CDBs / Investimento</option>
              <option value="reserva">Reserva de Emergência</option>
              <option value="especie">Dinheiro em Espécie / Cofre</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">
              Saldo Inicial (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface font-semibold border border-transparent focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant font-medium">
              Agência e Conta (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Ag 1234 C/C 56789-0"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="bg-surface-container-low p-2 rounded-lg text-on-surface border border-transparent focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-inverse-surface transition-colors shadow-sm"
            >
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
