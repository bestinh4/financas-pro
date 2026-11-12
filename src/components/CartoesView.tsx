import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const CartoesView: React.FC = () => {
  const { creditCards, transactions, accounts, payCardInvoice, showToast } = useFinance();

  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [payFromAccount, setPayFromAccount] = useState<string>(accounts[0]?.id || '');

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate dynamic current invoice for each card from active transactions (excluding settled invoices)
  const getCardInvoice = (cardId: string) => {
    return transactions
      .filter((tx) => !tx.isInactive && tx.paymentMethod === 'cartao' && tx.cardId === cardId && !tx.invoiceSettled)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const handlePayInvoice = (cardId: string, invoiceAmount: number) => {
    if (invoiceAmount <= 0) {
      showToast('Fatura Zerada', 'Não há saldo devedor pendente nesta fatura.', 'info');
      return;
    }
    if (!accounts.some((account) => account.id === payFromAccount)) {
      showToast('Conta necessária', 'Cadastre uma conta bancária antes de pagar a fatura.', 'warning');
      return;
    }
    if (payCardInvoice(cardId, payFromAccount, invoiceAmount)) setPayingCardId(null);
  };

  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-surface-container-lowest p-space-md rounded-xl shadow-card border border-surface-container/60 gap-space-md">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            Governança de Crédito
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Cartões &amp; Faturas
          </h2>
        </div>

        <div className="flex items-center gap-space-sm bg-surface-container-low px-3 py-1.5 rounded-lg border border-secondary/20">
          <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
          <span className="font-label-sm text-label-sm text-on-surface">
            <strong>Anti-Dupla Contagem Ativo:</strong> Gastos no crédito deduzem limite mas só impactam saldo na liquidação bancária.
          </span>
        </div>
      </div>

      {/* Resumo dos cartões cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        {creditCards.map((card, cardIndex) => {
          const invoiceAmount = getCardInvoice(card.id);
          const limitLivre = Math.max(0, card.limit - invoiceAmount);
          const usedPercent = card.limit > 0 ? Math.min(100, (invoiceAmount / card.limit) * 100) : 0;
          const isXP = cardIndex % 2 === 0;

          return (
            <div
              key={card.id}
              className={`${
                isXP
                  ? 'bg-primary-container text-on-primary shadow-card-dark'
                  : 'bg-gradient-to-bl from-secondary-container to-secondary text-on-secondary shadow-card-secondary'
              } rounded-xl p-space-lg shadow-card-hover relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`font-label-sm text-label-sm ${
                      isXP ? 'text-primary-fixed' : 'text-secondary-fixed'
                    } uppercase tracking-widest font-semibold`}
                  >
                    {card.issuer}
                  </span>
                  <h3
                    className={`font-headline-md text-headline-md ${
                      isXP ? 'text-on-primary' : 'text-on-secondary'
                    } mt-1`}
                  >
                    {card.name}
                  </h3>
                </div>
                <span
                  className={`material-symbols-outlined ${
                    isXP ? 'text-tertiary-fixed' : 'text-secondary-fixed'
                  } text-[32px]`}
                >
                  {isXP ? 'contactless' : 'credit_card'}
                </span>
              </div>

              <div className="my-space-md">
                <span
                  className={`font-label-sm text-label-sm ${
                    isXP ? 'text-primary-fixed-dim' : 'text-secondary-fixed-dim'
                  }`}
                >
                  Vencimento: dia {card.dueDay}
                </span>
                <div
                  className={`font-metric-display text-metric-display ${
                    isXP ? 'text-on-primary' : 'text-on-secondary'
                  } font-bold`}
                >
                  R$ {formatBRL(invoiceAmount)}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-space-xs border-t border-white/20">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span className={isXP ? 'text-primary-fixed-dim' : 'text-secondary-fixed-dim'}>
                    Limite Usado: R$ {formatBRL(invoiceAmount)}
                  </span>
                  <span className={isXP ? 'text-tertiary-fixed font-semibold' : 'text-white font-semibold'}>
                    Limite Livre: R$ {formatBRL(limitLivre)}
                  </span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${isXP ? 'bg-tertiary-fixed' : 'bg-secondary-fixed'} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${usedPercent}%` }}
                  ></div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-label-sm text-[11px] opacity-80">
                    Fechamento: dia {card.closingDay} | Limite Total: R$ {formatBRL(card.limit)}
                  </span>
                  <button
                    onClick={() => setPayingCardId(payingCardId === card.id ? null : card.id)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-label-md text-label-md transition-colors backdrop-blur-xs cursor-pointer"
                  >
                    {payingCardId === card.id ? 'Cancelar' : 'Liquidar Fatura'}
                  </button>
                </div>
              </div>

              {/* Modal / Panel inline to pay invoice */}
              {payingCardId === card.id && (
                <div className="mt-3 p-3 bg-black/30 rounded-lg text-white animate-in fade-in duration-150">
                  <span className="font-label-sm font-semibold text-tertiary-fixed block mb-2">
                    Confirmar Débito Bancário de Fatura:
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select
                      value={payFromAccount}
                      onChange={(e) => setPayFromAccount(e.target.value)}
                      className="w-full sm:w-auto bg-surface-container-lowest text-on-surface text-body-sm p-1.5 rounded-lg focus:outline-none"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          Debitar de: {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handlePayInvoice(card.id, invoiceAmount)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-lg text-label-md hover:bg-tertiary-fixed-dim transition-colors"
                    >
                      Pagar R$ {formatBRL(invoiceAmount)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {creditCards.length === 0 && <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-surface-container text-center text-on-surface-variant">Nenhum cartão cadastrado. Os cartões aparecerão aqui após serem adicionados.</div>}
    </div>
  );
};
