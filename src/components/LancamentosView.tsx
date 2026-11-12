import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { parseCurrencyInput } from '../utils/currency';

interface LancamentosViewProps {
  onOpenScanReceipt?: () => void;
}

export const LancamentosView: React.FC<LancamentosViewProps> = ({ onOpenScanReceipt }) => {
  const {
    filteredTransactions,
    transactions,
    searchTerm,
    setSearchTerm,
    addTransaction,
    toggleInactivateTransaction,
    deleteTransaction,
    accounts,
    creditCards,
    showToast,
    setActiveTab,
  } = useFinance();

  // Form state for inline creation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'Despesa' as 'Despesa' | 'Receita',
    category: 'Moradia',
    accountOrCard: accounts[0]?.id || creditCards[0]?.id || '',
  });

  // Additional filter for Status in this view
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const activeCount = transactions.filter((t) => !t.isInactive).length;
  const inactiveCount = transactions.filter((t) => t.isInactive).length;

  const displayedTransactions = filteredTransactions.filter((tx) => {
    if (statusFilter === 'active') return !tx.isInactive;
    if (statusFilter === 'inactive') return tx.isInactive;
    return true;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(formData.amount);
    if (!formData.date || !formData.description.trim() || !Number.isFinite(val) || val <= 0) {
      showToast('Campos Inválidos', 'Preencha uma descrição válida e um valor positivo.', 'warning');
      return;
    }

    const hasCurrentSelection =
      accounts.some((account) => account.id === formData.accountOrCard) ||
      creditCards.some((card) => card.id === formData.accountOrCard);
    const effectiveAccountOrCard = hasCurrentSelection
      ? formData.accountOrCard
      : accounts[0]?.id || creditCards[0]?.id || '';
    const selectedCard = creditCards.find((card) => card.id === effectiveAccountOrCard);
    const linkedAccount = selectedCard
      ? accounts.find((account) => account.id === selectedCard.linkedAccountId)
      : accounts.find((account) => account.id === effectiveAccountOrCard);

    if (!linkedAccount) {
      showToast('Conta necessária', 'Selecione uma conta válida ou vincule o cartão a uma conta cadastrada.', 'warning');
      return;
    }

    if (selectedCard && formData.type === 'Receita') {
      showToast('Meio de recebimento inválido', 'Receitas não podem ser registradas em um cartão de crédito. Selecione uma conta bancária.', 'warning');
      return;
    }

    addTransaction({
      date: formData.date,
      description: formData.description.trim(),
      amount: val,
      type: formData.type,
      category: formData.category,
      paymentMethod: selectedCard ? 'cartao' : 'conta',
      accountId: linkedAccount.id,
      cardId: selectedCard?.id,
      status: formData.type === 'Receita' ? 'Recebido' : 'Pago',
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'Despesa',
      category: 'Moradia',
      accountOrCard: accounts[0]?.id || creditCards[0]?.id || '',
    });
    setIsFormOpen(false);
  };

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-surface-container-lowest p-space-md rounded-xl shadow-card border border-surface-container/60 gap-space-md">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            Gestão de Fluxo
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Livro Diário de Lançamentos
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-space-sm">
          {/* Status filter buttons */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-surface-container text-body-sm shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'active'
                  ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Inativados
            </button>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container flex-1 sm:flex-initial min-w-[200px]">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar lançamentos..."
              className="bg-transparent text-body-md text-on-surface focus:outline-none w-full sm:w-48 md:w-56"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {onOpenScanReceipt && (
            <button
              onClick={onOpenScanReceipt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Ler Comprovante ou Cupom Fiscal com IA"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span className="font-label-md text-label-md font-semibold">Escanear com IA</span>
            </button>
          )}

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-inverse-surface transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFormOpen ? 'remove_circle' : 'add_circle'}
            </span>
            <span className="font-label-md text-label-md font-semibold">Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Formulário de Cadastro / Edição Rápida */}
      {isFormOpen && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">edit_note</span>
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                Cadastrar Lançamento no Livro Diário
              </h3>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">Data</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Consultoria Alpha, Supermercado St. Marche, Condomínio..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Valor (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface font-semibold focus:outline-none border border-transparent focus:border-secondary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'Despesa' | 'Receita' })
                }
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary cursor-pointer"
              >
                <option value="Despesa">Despesa (-)</option>
                <option value="Receita">Receita (+)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary cursor-pointer"
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

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Conta / Meio de Liquidação
              </label>
{accounts.length === 0 && creditCards.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
                    Nenhuma conta ou cartão cadastrado. Cadastre uma conta bancária para habilitar os lançamentos.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setActiveTab('contas');
                    }}
                    className="w-full rounded-lg border border-secondary px-3 py-2 text-body-sm font-semibold text-secondary hover:bg-secondary/10 transition-colors"
                  >
                    Ir para cadastro de contas
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={formData.accountOrCard || accounts[0]?.id || creditCards[0]?.id || ''}
                  onChange={(e) => setFormData({ ...formData, accountOrCard: e.target.value })}
                  className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary cursor-pointer"
                >
                  <option value="" disabled>Selecione uma conta ou cartão</option>
                  {accounts.length > 0 && (
                    <optgroup label="Contas Bancárias">
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {creditCards.length > 0 && (
                    <optgroup label="Cartões de Crédito">
                      {creditCards.map((card) => (
                        <option key={card.id} value={card.id}>{card.name} ({card.issuer})</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-semibold hover:bg-inverse-surface transition-colors shadow-sm cursor-pointer"
              >
                Salvar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela Completa do Livro Diário com Inativação Lógica */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-space-md gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
            Mostrando todos os registros auditados com status de inativação lógica disponível.
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">
              {activeCount} Ativos | {inactiveCount} Inativados
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg">Data</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Conta / Meio</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-md text-body-md">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((tx) => {
                  const isDesp = tx.type === 'Despesa';
                  const isInactive = tx.isInactive;
                  const accountObj = accounts.find((a) => a.id === tx.accountId);
                  const cardObj = creditCards.find((c) => c.id === tx.cardId);

                  const displayName =
                    cardObj ? `${cardObj.issuer} ${cardObj.name}` : accountObj?.name || 'Conta';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        isInactive ? 'opacity-50 bg-surface-container-low/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-on-surface-variant text-center whitespace-nowrap">
                        {tx.date.split('-').slice(1).reverse().join('/')}
                      </td>

                      <td className="py-3 px-3 text-on-surface font-semibold flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface shrink-0">
                          <span className="material-symbols-outlined text-[16px]">
                            {isInactive
                              ? 'cancel'
                              : tx.category === 'Moradia'
                              ? 'apartment'
                              : tx.category === 'Alimentação'
                              ? 'shopping_cart'
                              : tx.type === 'Receita'
                              ? 'domain_verification'
                              : 'receipt'}
                          </span>
                        </span>
                        <span className={isInactive ? 'line-through text-on-surface-variant' : ''}>
                          {tx.description}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-on-surface-variant whitespace-nowrap">
                        {tx.category}
                      </td>

                      <td className="py-3 px-3 text-on-surface-variant whitespace-nowrap">
                        {displayName}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-semibold ${
                            isInactive
                              ? 'bg-outline-variant text-on-surface-variant'
                              : isDesp
                              ? 'bg-error-container text-error'
                              : 'bg-tertiary-fixed text-on-tertiary-fixed'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${
                          isInactive
                            ? 'text-outline line-through'
                            : isDesp
                            ? 'text-error'
                            : 'text-on-tertiary-container'
                        }`}
                      >
                        {isDesp ? '- R$ ' : '+ R$ '}
                        {formatBRL(tx.amount)}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Toggle Inactivate */}
                          <button
                            onClick={() => toggleInactivateTransaction(tx.id)}
                            title={isInactive ? 'Reativar lançamento' : 'Inativar lançamento (manter histórico)'}
                            className={`p-1 rounded-md transition-colors ${
                              isInactive
                                ? 'text-secondary hover:text-on-surface hover:bg-surface-container'
                                : 'text-on-surface-variant hover:text-error hover:bg-error-container/30'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isInactive ? 'restore' : 'block'}
                            </span>
                          </button>

                          {/* Delete permanently */}
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            title="Excluir permanentemente"
                            className="p-1 rounded-md text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
