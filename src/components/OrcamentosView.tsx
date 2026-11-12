import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currency';

export const OrcamentosView: React.FC = () => {
  const { budgets, categoryBreakdown, addBudget, updateBudget, showToast } = useFinance();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newLimitInput, setNewLimitInput] = useState<string>('');
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Map category spend
  const getCategorySpend = (budgetName: string) => {
    const match = categoryBreakdown.find((c) => {
      const bNorm = budgetName.toLowerCase();
      const cNorm = c.category.toLowerCase();
      return bNorm.includes(cNorm) || cNorm.includes(bNorm.split(' ')[0]);
    });
    return match ? match.amount : 0;
  };

  const handleCreateBudget = (event: React.FormEvent) => {
    event.preventDefault();
    const success = addBudget({
      category: newCategory.trim(),
      icon: 'savings',
      color: '#0051d5',
      limit: parseCurrencyInput(newBudgetLimit),
    });
    if (success) {
      setNewCategory('');
      setNewBudgetLimit('');
      setIsCreatingBudget(false);
    }
  };

  const handleStartEdit = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setNewLimitInput(formatCurrencyInput(String(currentLimit)));
  };

  const handleSaveBudget = (cat: string) => {
    const parsed = parseCurrencyInput(newLimitInput);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Teto Inválido', 'Insira um valor numérico positivo para o orçamento.', 'error');
      return;
    }
    updateBudget(cat, parsed);
    setEditingCategory(null);
  };

  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-surface-container-lowest p-space-md rounded-xl shadow-card border border-surface-container/60 gap-space-md">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            Governança Financeira
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Orçamento &amp; Tetos de Gastos
          </h2>
          <button type="button" onClick={() => setIsCreatingBudget((open) => !open)} className="px-3 py-2 rounded-lg bg-primary text-on-primary font-semibold">
            + Novo orçamento
          </button>

          <p className="font-body-md text-body-md text-on-surface-variant">
            Acompanhe o ritmo de consumo de cada categoria e previna estouros orçamentários
          </p>
        </div>

        <div className="flex items-center gap-space-sm bg-surface-container-low px-3 py-1.5 rounded-lg border border-secondary/20 shadow-xs">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span className="font-label-sm text-label-sm text-on-surface">
            <strong>Orçamento Geral:</strong> R${' '}
            {formatBRL(budgets.reduce((acc, b) => acc + b.limit, 0))} planejado para o mês corrente
          </span>
        </div>
      </div>

      {isCreatingBudget && (
        <form onSubmit={handleCreateBudget} className="bg-surface-container-lowest rounded-xl p-space-lg border border-surface-container shadow-card flex flex-col gap-3">
          <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Novo limite mensal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-label-sm text-on-surface-variant">Categoria
              <select required value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="p-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface">
                <option value="">Selecione uma categoria</option>
                {['Moradia', 'Alimentação', 'Transporte', 'Saúde & Cuidados', 'Lazer & Cultura', 'Outros'].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-label-sm text-on-surface-variant">Limite mensal (R$)
              <input required inputMode="decimal" value={newBudgetLimit} onChange={(e) => setNewBudgetLimit(formatCurrencyInput(e.target.value))} placeholder="0,00" className="p-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsCreatingBudget(false)} className="px-3 py-2 rounded-lg border border-surface-container text-on-surface">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold">Criar orçamento</button>
          </div>
        </form>
      )}

      {/* Grid de Tetos Orçamentários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
        {budgets.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-surface-container p-space-lg text-center text-body-sm text-on-surface-variant">Nenhum orçamento cadastrado. Crie seu primeiro limite mensal para começar a acompanhar os gastos.</div>}
        {budgets.map((b) => {
          const spent = getCategorySpend(b.category);
          const percent = Math.min(100, Math.round((spent / b.limit) * 100));
          const remaining = Math.max(0, b.limit - spent);
          const isOver = spent > b.limit;
          const isWarning = percent >= 85 && !isOver;

          return (
            <div
              key={b.category}
              className="bg-surface-container-lowest rounded-xl p-space-md shadow-card shadow-card-hover border border-surface-container/60 flex flex-col justify-between relative"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">{b.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-title-md text-title-md text-on-surface font-semibold">
                        {b.category}
                      </h4>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Teto Mensal: R$ {formatBRL(b.limit)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                      isOver
                        ? 'bg-error-container text-error'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}
                  >
                    {isOver ? 'Excedido' : `${percent}%`}
                  </span>
                </div>

                <div className="my-2">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      R$ {formatBRL(spent)}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      de R$ {formatBRL(b.limit)}
                    </span>
                  </div>

                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-error'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-on-tertiary-container'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mt-2">
                  <span>
                    {isOver
                      ? `Excedido em R$ ${formatBRL(spent - b.limit)}`
                      : `Restam R$ ${formatBRL(remaining)}`}
                  </span>
                  <span>{isOver ? 'Bloquear novos gastos' : 'Ritmo controlado'}</span>
                </div>
              </div>

              {editingCategory === b.category ? (
                <div className="mt-4 pt-3 border-t border-surface-container flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newLimitInput}
                    onChange={(e) => setNewLimitInput(formatCurrencyInput(e.target.value))}
                    className="w-full bg-surface-container-low text-body-sm text-on-surface p-1.5 rounded-lg border border-secondary focus:outline-none"
                    placeholder="Novo teto R$"
                  />
                  <button
                    onClick={() => handleSaveBudget(b.category)}
                    className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-semibold hover:bg-inverse-surface"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-label-sm"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-surface-container flex justify-end">
                  <button
                    onClick={() => handleStartEdit(b.category, b.limit)}
                    className="font-label-md text-label-md text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Ajustar Teto
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
