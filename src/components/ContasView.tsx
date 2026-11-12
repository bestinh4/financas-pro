import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { parseCurrencyInput } from '../utils/currency';

interface ContasViewProps {
  onOpenNewAccountModal: () => void;
}

export const ContasView: React.FC<ContasViewProps> = ({ onOpenNewAccountModal }) => {
  const {
    accounts,
    accountBalances,
    totalConsolidatedBalance,
    transfers,
    executeTransfer,
  } = useFinance();

  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [transfData, setTransfData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromAccountId: accounts[0]?.id || '',
    toAccountId: accounts[1]?.id || '',
    amount: '',
    description: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.length < 2 || !accounts.some((a) => a.id === transfData.fromAccountId) || !accounts.some((a) => a.id === transfData.toAccountId)) {
      setErrorMessage('Cadastre pelo menos duas contas para realizar uma transferência.');
      return;
    }
    if (transfData.fromAccountId === transfData.toAccountId) {
      setErrorMessage('A conta de origem e destino não podem ser iguais. Selecione contas distintas.');
      return;
    }
    const val = parseCurrencyInput(transfData.amount);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Informe um valor de transferência válido.');
      return;
    }
    if (!transfData.description.trim()) {
      setErrorMessage('Informe uma descrição para a auditoria.');
      return;
    }

    setErrorMessage('');
    const success = executeTransfer({
      date: transfData.date,
      fromAccountId: transfData.fromAccountId,
      toAccountId: transfData.toAccountId,
      amount: val,
      description: transfData.description.trim(),
    });

    if (success) {
      setTransfData({
        date: new Date().toISOString().split('T')[0],
        fromAccountId: accounts[0]?.id || '',
        toAccountId: accounts[1]?.id || '',
        amount: '',
        description: '',
      });
      setIsTransferFormOpen(false);
    }
  };

  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header da Aba Contas */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-surface-container-lowest p-space-md rounded-xl shadow-card border border-surface-container/60 gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Gestão Patrimonial &amp; Tesouraria
            </span>
            <span className="px-2 py-0.5 rounded-full text-label-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
              {accounts.length} Contas Ativas
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">
            Gestão de Contas &amp; Transferências
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Controle de contas e fluxo de caixa entre contas próprias
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-space-sm">
          <button
            onClick={onOpenNewAccountModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors font-medium border border-surface-container cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">add</span>
            <span className="font-label-md text-label-md">Nova Conta</span>
          </button>

          <button
            disabled={accounts.length < 2}
            title={accounts.length < 2 ? 'Cadastre pelo menos duas contas' : 'Nova transferência'}
            onClick={() => setIsTransferFormOpen(!isTransferFormOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-inverse-surface transition-colors shadow-sm font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            <span className="font-label-md text-label-md">Nova Transferência</span>
          </button>
        </div>
      </div>

      {/* Grid de Contas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-space-md">
        {accounts.map((acc) => {
          const balance = accountBalances[acc.id] ?? acc.initialBalance;

          return (
            <div
              key={acc.id}
              className="bg-surface-container-lowest rounded-xl p-space-md shadow-card shadow-card-hover border border-surface-container flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px]"
                    style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{acc.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-title-md text-title-md text-on-surface leading-tight font-semibold">
                      {acc.name}
                    </h4>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {acc.typeLabel}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed uppercase">
                  Ativa
                </span>
              </div>

              <div className="my-space-md">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {acc.type === 'custodia' ? 'Posição Consolidada' : 'Saldo Disponível'}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">R$</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                    {formatBRL(balance)}
                  </span>
                </div>
              </div>

              <div className="pt-space-xs border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>{acc.accountNumber || 'Sem identificação adicional'}</span>
                <span className="inline-flex items-center font-semibold text-secondary">
                  Registro local
                </span>
              </div>
            </div>
          );
        })}

        {/* Card Resumo: Saldo Total em Custódia */}
        <div className="bg-primary-container text-on-primary rounded-xl p-space-md shadow-card-dark shadow-card-hover flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-gradient-to-bl from-primary-fixed/20 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
              Saldo Total Custódia
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container-highest/20 flex items-center justify-center text-tertiary-fixed">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>

          <div>
            <span className="font-label-sm text-label-sm text-primary-fixed-dim">Consolidação Geral</span>
            <div className="flex items-baseline gap-1">
              <span className="font-label-sm text-label-sm text-primary-fixed-dim font-medium">R$</span>
              <span className="font-headline-lg text-headline-lg font-bold text-on-primary tracking-tight">
                {formatBRL(totalConsolidatedBalance)}
              </span>
            </div>
          </div>

          <div className="mt-space-md pt-space-xs border-t border-surface-tint/30 flex items-center justify-between text-[11px] text-primary-fixed-dim">
            <span>{accounts.length} Instituições ativas</span>
            <span className="text-tertiary-fixed font-semibold">Dados registrados</span>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE TRANSFERÊNCIA ENTRE CONTAS PRÓPRIAS */}
      {isTransferFormOpen && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container animate-in fade-in duration-200">
          {/* Box Informativo de Integridade */}
          <div className="mb-space-md p-space-md bg-surface-container-low rounded-xl border border-secondary/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">balance</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Regra de Neutralidade Contábil
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Transferências entre contas alteram os saldos de origem e destino, mas têm{' '}
                <strong>impacto R$ 0,00 no DRE consolidado de Receitas e Despesas do mês</strong>,
                preservando a acurácia dos demonstrativos financeiros executivos.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">swap_horiz</span>
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                Nova Transferência entre Contas Próprias
              </h3>
            </div>
            <button
              onClick={() => setIsTransferFormOpen(false)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Data da Transferência
              </label>
              <input
                type="date"
                required
                value={transfData.date}
                onChange={(e) => setTransfData({ ...transfData, date: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Conta de Origem (Débito)
              </label>
              <select
                value={transfData.fromAccountId}
                onChange={(e) => {
                  setTransfData({ ...transfData, fromAccountId: e.target.value });
                  setErrorMessage('');
                }}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (R$ {formatBRL(accountBalances[acc.id] ?? acc.initialBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center md:col-span-1 pt-6 text-on-surface-variant">
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-secondary">arrow_forward</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Conta de Destino (Crédito)
              </label>
              <select
                value={transfData.toAccountId}
                onChange={(e) => {
                  setTransfData({ ...transfData, toAccountId: e.target.value });
                  setErrorMessage('');
                }}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (R$ {formatBRL(accountBalances[acc.id] ?? acc.initialBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Valor da Transferência (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                min="0.01"
                required
                placeholder="Ex: 5.000,00"
                value={transfData.amount}
                onChange={(e) => setTransfData({ ...transfData, amount: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface font-semibold focus:outline-none border border-transparent focus:border-secondary"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-8">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Descrição / Finalidade
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Aporte emergencial, aplicação em CDB, transferência de liquidez..."
                value={transfData.description}
                onChange={(e) => setTransfData({ ...transfData, description: e.target.value })}
                className="bg-surface-container-low p-2 rounded-lg text-body-md text-on-surface focus:outline-none border border-transparent focus:border-secondary"
              />
            </div>

            <div className="flex items-end justify-end gap-2 md:col-span-4">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-semibold hover:bg-inverse-surface transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send_money</span>
                <span>Efetivar Transferência</span>
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="text-error font-label-sm text-label-sm mt-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* TABELA DO LIVRO DE TRANSFERÊNCIAS RECENTES */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-space-md gap-space-xs">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Auditoria de Tesouraria
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Livro de Transferências Recentes
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">
              {transfers.length} Transferências Auditadas
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-lg">ID Transf</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Conta Origem</th>
                <th className="py-2.5 px-3 text-center">Fluxo</th>
                <th className="py-2.5 px-3">Conta Destino</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Impacto DRE</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-md text-body-md">
              {transfers.map((tr) => {
                const originAcc = accounts.find((a) => a.id === tr.fromAccountId);
                const destAcc = accounts.find((a) => a.id === tr.toAccountId);

                return (
                  <tr key={tr.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3 px-3 text-on-surface-variant font-mono text-label-sm font-semibold">
                      {tr.id}
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant whitespace-nowrap">
                      {tr.date.split('-').reverse().join('/')}
                    </td>
                    <td className="py-3 px-3 text-on-surface font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: originAcc?.color || '#0051d5' }}
                        ></span>
                        <span>{originAcc?.name || tr.fromAccountId}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-secondary">
                      <span className="material-symbols-outlined text-[18px]">trending_flat</span>
                    </td>
                    <td className="py-3 px-3 text-on-surface font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: destAcc?.color || '#009668' }}
                        ></span>
                        <span>{destAcc?.name || tr.toAccountId}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant">{tr.description}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                        {tr.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-medium bg-surface-container text-on-surface-variant border border-surface-container-high">
                        Neutro (R$ 0,00)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-on-surface whitespace-nowrap">
                      R$ {formatBRL(tr.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
