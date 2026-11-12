import React from 'react';
import { useFinance } from '../context/FinanceContext';

interface DashboardViewProps {
  onOpenNewTx: () => void;
  onOpenExportDRE: () => void;
  onOpenAdjustBudget: () => void;
  onOpenScanReceipt?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTx,
  onOpenExportDRE,
  onOpenAdjustBudget,
  onOpenScanReceipt,
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    filterAccount,
    setFilterAccount,
    filterCategory,
    setFilterCategory,
    accounts,
    monthlyReceitas,
    monthlyDespesas,
    resultadoLiquido,
    margemPoupanca,
    faturasEmAbertoTotal,
    totalLimiteLivre,
    accountBalances,
    filteredTransactions,
    categoryBreakdown,
    cashFlowHistory,
    budgets,
    setActiveTab,
  } = useFinance();

  // Selected account balance or primary liquid account
  const primaryLiquidBalance = Object.values(accountBalances)[0] ?? 0;

  // Format currency
  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Latest transactions reflecting current filters or general active transactions
  const recentTransactions = filteredTransactions.slice(0, 4);

  // Compute highest expense category for center of Donut
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Budget calculations
  const moradiaBudget = budgets.find((b) => b.category.includes('Moradia')) || {
    limit: 0,
    category: 'Moradia & Contas',
  };
  const moradiaSpent =
    categoryBreakdown.find((c) => c.category.toLowerCase().includes('moradia'))?.amount || 0;
  const moradiaPercent = moradiaBudget.limit > 0 ? Math.min(100, Math.round((moradiaSpent / moradiaBudget.limit) * 100)) : 0;

  const alimentacaoBudget = budgets.find((b) => b.category.includes('Restaurantes') || b.category.includes('Alimentação')) || {
    limit: 0,
    category: 'Restaurantes & Bares',
  };
  const alimentacaoSpent =
    categoryBreakdown.find((c) => c.category.toLowerCase().includes('alimenta'))?.amount || 0;
  const alimentacaoPercent = alimentacaoBudget.limit > 0 ? Math.min(100, Math.round((alimentacaoSpent / alimentacaoBudget.limit) * 100)) : 0;

  // Compute dynamic SVG parameters for the Cashflow bar chart
  const maxBarValue = Math.max(...cashFlowHistory.map((m) => Math.max(m.receitas, m.despesas)), 20000);
  const chartHeight = 160;

  // Generate SVG paths for cash flow chart
  const barWidth = 14;
  const monthGap = 65;
  const startX = 25;

  // Polyline points for Net Line
  const netLinePoints = cashFlowHistory
    .map((item, idx) => {
      const x = startX + idx * monthGap + barWidth;
      // map net income to y coordinate
      const normalizedNet = Math.max(0, Math.min(1, item.liquido / 10000));
      const y = 190 - normalizedNet * 75;
      return `${x},${y}`;
    })
    .join(' ');

  // Compute Donut SVG stroke-dasharray & stroke-dashoffset for each category
  // Circumference = 2 * PI * 60 ~= 377
  const circumference = 377;
  let accumulatedOffset = 0;
  const donutSegments = categoryBreakdown.map((item) => {
    const strokeDash = (item.percentage / 100) * circumference;
    const currentOffset = accumulatedOffset;
    accumulatedOffset += strokeDash;
    return {
      category: item.category,
      color: item.color,
      dashArray: `${strokeDash.toFixed(1)} ${circumference}`,
      dashOffset: -currentOffset,
    };
  });

  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* FILTROS RÁPIDOS & CONTROLES EXECUTIVOS */}
      <section className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-card border border-surface-container/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Mês & Ano */}
          <div className="flex items-center gap-space-xs px-3 py-1.5 bg-surface-container-low rounded-lg text-on-surface border border-surface-container">
            <span className="material-symbols-outlined text-secondary text-[18px]">calendar_month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-title-md text-title-md text-on-surface focus:outline-none cursor-pointer pr-1"
            >
              <option value="10">Outubro</option>
              <option value="09">Setembro</option>
              <option value="08">Agosto</option>
              <option value="07">Julho</option>
              <option value="06">Junho</option>
              <option value="05">Maio</option>
              <option value="04">Abril</option>
              <option value="03">Março</option>
              <option value="02">Fevereiro</option>
              <option value="01">Janeiro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
            <span className="text-outline-variant">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-title-md text-title-md text-on-surface focus:outline-none cursor-pointer"
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => <option key={year} value={String(year)}>{year}</option>)}
            </select>
          </div>

          <div className="h-6 w-[1px] bg-surface-container hidden sm:block"></div>

          {/* Filtro de Conta */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg border border-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">account_balance</span>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="bg-transparent font-body-md text-body-md text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Contas ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Categoria */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg border border-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">category</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent font-body-md text-body-md text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              <option value="moradia">Moradia</option>
              <option value="alimentacao">Alimentação</option>
              <option value="transporte">Transporte</option>
              <option value="saude">Saúde & Bem-estar</option>
              <option value="lazer">Lazer & Viagens</option>
              <option value="receita">Receitas PJ</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-sm">
          <div className="hidden xl:flex flex-col text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Última Conciliação
            </span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Sem sincronização bancária
            </span>
          </div>

          {onOpenScanReceipt && (
            <button
              onClick={onOpenScanReceipt}
              className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Ler Comprovante ou Cupom Fiscal com IA"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span className="font-label-md text-label-md font-semibold">Escanear com IA</span>
            </button>
          )}

          <button
            onClick={onOpenExportDRE}
            className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-surface-container cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">file_download</span>
            <span className="font-label-md text-label-md font-medium">Exportar DRE</span>
          </button>

          <button
            onClick={onOpenNewTx}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-inverse-surface transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label-md text-label-md font-semibold">Novo Lançamento</span>
          </button>
        </div>
      </section>

      {/* 5 CARDS DE INDICADORES PRINCIPAIS (KPIs) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {/* Card 1: Receitas do Mês */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card shadow-card-hover border border-surface-container/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-tertiary-fixed/30 pointer-events-none transition-transform group-hover:scale-125"></div>
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Receitas do Mês</span>
              <span className="w-7 h-7 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-on-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">R$</span>
              <span className="font-metric-display text-metric-display text-on-surface tracking-tight font-bold">
                {formatBRL(monthlyReceitas)}
              </span>
            </div>
          </div>
          <div className="mt-space-md flex items-center gap-1.5 pt-space-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
              +12.0%
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">vs mês anterior</span>
          </div>
        </div>

        {/* Card 2: Despesas do Mês */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-card shadow-card-hover border border-surface-container/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-error-container/40 pointer-events-none transition-transform group-hover:scale-125"></div>
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Despesas do Mês</span>
              <span className="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">trending_down</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">R$</span>
              <span className="font-metric-display text-metric-display text-on-surface tracking-tight font-bold">
                {formatBRL(monthlyDespesas)}
              </span>
            </div>
          </div>
          <div className="mt-space-md flex items-center gap-1.5 pt-space-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-semibold">
              -4.0%
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">redução de custos</span>
          </div>
        </div>

        {/* Card 3: Resultado Líquido */}
        <div className="bg-tertiary-container rounded-xl p-space-md shadow-card-tertiary shadow-card-hover text-on-tertiary flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-gradient-to-bl from-tertiary-fixed-dim/20 to-transparent pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-tertiary-fixed font-medium">
                Resultado Líquido
              </span>
              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                {resultadoLiquido >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-label-md text-label-md text-tertiary-fixed-dim font-medium">
                {resultadoLiquido >= 0 ? '+R$' : '-R$'}
              </span>
              <span className="font-metric-display text-metric-display text-on-tertiary tracking-tight font-bold">
                {formatBRL(Math.abs(resultadoLiquido))}
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-tertiary-fixed-dim">Margem de Poupança</span>
            <span className="font-title-md text-title-md text-tertiary-fixed font-bold">
              {margemPoupanca.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 4: Saldo Consolidado */}
        <div
          onClick={() => setActiveTab('contas')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-card shadow-card-hover border border-surface-container/60 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-secondary-fixed/40 pointer-events-none transition-transform group-hover:scale-125"></div>
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Saldo Consolidado</span>
              <span className="w-7 h-7 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">R$</span>
              <span className="font-metric-display text-metric-display text-on-surface tracking-tight font-bold">
                {formatBRL(primaryLiquidBalance)}
              </span>
            </div>
          </div>
          <div className="mt-space-md flex items-center gap-1.5 pt-space-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm">
              Disponível em {accounts.length} contas ativas
            </span>
          </div>
        </div>

        {/* Card 5: Faturas em Aberto */}
        <div
          onClick={() => setActiveTab('cartoes-e-faturas')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-card shadow-card-hover border border-surface-container/60 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">Faturas em Aberto</span>
              <span className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">R$</span>
              <span className="font-metric-display text-metric-display text-on-surface tracking-tight font-bold">
                {formatBRL(faturasEmAbertoTotal)}
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex flex-col gap-1">
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Limite livre:</span>
              <span className="text-on-surface font-semibold">R$ {formatBRL(totalLimiteLivre)}</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (faturasEmAbertoTotal / (faturasEmAbertoTotal + totalLimiteLivre || 1)) * 100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO CENTRAL: GRÁFICO HISTÓRICO + DONUT POR CATEGORIA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
        {/* Gráfico Histórico */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Fluxo de Caixa Operacional
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Evolução Receitas x Despesas ({selectedYear})
              </h2>
            </div>
            <div className="flex items-center gap-space-md text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-secondary"></span>
                <span className="font-label-sm text-label-sm">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-surface-container-highest"></span>
                <span className="font-label-sm text-label-sm">Despesas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 rounded bg-tertiary-fixed-dim"></span>
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">Líquido</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto pt-2">
            <div className="min-w-[620px] h-64 relative flex flex-col justify-end">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25">
                <div className="w-full h-[1px] bg-outline-variant"></div>
                <div className="w-full h-[1px] bg-outline-variant"></div>
                <div className="w-full h-[1px] bg-outline-variant"></div>
                <div className="w-full h-[1px] bg-outline-variant"></div>
                <div className="w-full h-[1px] bg-outline-variant"></div>
              </div>

              {/* SVG Bars, Line & Labels */}
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 225">
                {cashFlowHistory.map((item, idx) => {
                  const recHeight = (item.receitas / maxBarValue) * chartHeight;
                  const despHeight = (item.despesas / maxBarValue) * chartHeight;
                  const x1 = startX + idx * monthGap;
                  const x2 = x1 + 18;
                  const y1 = 195 - recHeight;
                  const y2 = 195 - despHeight;
                  const isSelected = (idx + 1).toString().padStart(2, '0') === selectedMonth;
                  const centerX = x1 + 17;

                  return (
                    <g
                      key={item.month}
                      className="cursor-pointer group"
                      onClick={() => setSelectedMonth((idx + 1).toString().padStart(2, '0'))}
                    >
                      <title>{`${item.month}: Receitas R$ ${formatBRL(item.receitas)} | Despesas R$ ${formatBRL(item.despesas)} | Líquido R$ ${formatBRL(item.liquido)}`}</title>
                      {/* Receitas Bar */}
                      <rect
                        x={x1}
                        y={y1}
                        width={16}
                        height={recHeight}
                        rx={3}
                        fill="#0051d5"
                        opacity={isSelected ? 1.0 : 0.8}
                        className="transition-opacity group-hover:opacity-100"
                      />
                      {/* Despesas Bar */}
                      <rect
                        x={x2}
                        y={y2}
                        width={16}
                        height={despHeight}
                        rx={3}
                        fill={isSelected ? '#b4c5ff' : '#d3e4fe'}
                        className="transition-opacity group-hover:opacity-95"
                      />
                      {/* Month Label accurately centered directly below bar pair */}
                      <text
                        x={centerX}
                        y={218}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight={isSelected ? '700' : '500'}
                        fill={isSelected ? '#0051d5' : '#76777d'}
                        fontFamily="Inter, sans-serif"
                      >
                        {item.month}
                      </text>
                    </g>
                  );
                })}

                {/* Net Line */}
                <polyline
                  fill="none"
                  stroke="#009668"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={netLinePoints}
                />

                {/* Net Points */}
                {cashFlowHistory.map((item, idx) => {
                  const x = startX + idx * monthGap + barWidth;
                  const normalizedNet = Math.max(0, Math.min(1, item.liquido / 10000));
                  const y = 190 - normalizedNet * 75;
                  const isSelected = (idx + 1).toString().padStart(2, '0') === selectedMonth;

                  return (
                    <circle
                      key={`dot-${item.month}`}
                      cx={x}
                      cy={y}
                      r={isSelected ? 4.5 : 3.5}
                      fill={isSelected ? '#6ffbbe' : '#ffffff'}
                      stroke={isSelected ? '#002113' : '#009668'}
                      strokeWidth="2.5"
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm flex flex-wrap items-center justify-between gap-space-sm border border-surface-container">
            <div className="flex items-center gap-space-xs text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[20px]">insights</span>
              <span className="font-body-md text-body-md font-medium">
                Resultado líquido no período: <strong>R$ {formatBRL(resultadoLiquido)}</strong>
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Indicadores calculados conforme os dados cadastrados
            </span>
          </div>
        </div>

        {/* Donut por Categoria */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Abertura de Custos
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                Total: R$ {formatBRL(monthlyDespesas)}
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Despesas por Categoria</h2>
          </div>

          <div className="relative flex items-center justify-center my-space-md">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              {donutSegments.map((seg, i) => (
                <circle
                  key={`donut-${i}`}
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="22"
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Maior Gasto</span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                {topCategory ? `${topCategory.percentage.toFixed(1)}%` : '0%'}
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">
                {topCategory ? topCategory.category : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 font-body-md text-body-md">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-on-surface">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-on-surface">R$ {formatBRL(cat.amount)}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant w-10 text-right">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LINHA INFERIOR: ÚLTIMAS MOVIMENTAÇÕES + ORÇAMENTO POR CATEGORIA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Últimas Movimentações */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Livro Diário
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Últimas Movimentações</h3>
            </div>
            <button
              onClick={() => setActiveTab('lancamentos')}
              className="font-label-md text-label-md text-secondary hover:underline flex items-center gap-0.5"
            >
              Ver todas
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[560px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-2.5 px-3 rounded-l-lg">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Conta</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-body-md text-body-md">
                {recentTransactions.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-on-surface-variant">Nenhum lançamento cadastrado neste período.</td></tr> : recentTransactions.map((tx) => {
                  const isDesp = tx.type === 'Despesa';
                  const accountObj = accounts.find((a) => a.id === tx.accountId);
                  const isInactive = tx.isInactive;

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
                        <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">
                            {tx.category === 'Moradia'
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
                      <td className="py-3 px-3 text-on-surface-variant">{tx.category}</td>
                      <td className="py-3 px-3 text-on-surface-variant">
                        {accountObj?.name || (tx.cardId ? 'Cartão cadastrado' : 'Conta não identificada')}
                      </td>
                      <td className="py-3 px-3 text-center">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Governança Orçamentária: Metas do Mês */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Governança Orçamentária
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Metas do Mês</h3>
            </div>
            <span className="font-label-sm text-label-sm bg-surface-container-low text-on-surface px-2.5 py-1 rounded-lg border border-surface-container">
              Período selecionado
            </span>
          </div>

          <div className="flex flex-col gap-space-md">
            {/* Moradia & Contas */}
            <div className="flex flex-col gap-1.5 p-space-sm bg-surface-container-low/40 rounded-lg border border-surface-container/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                    home
                  </span>
                  <span className="font-title-md text-title-md text-on-surface">
                    {moradiaBudget.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                    R$ {formatBRL(moradiaSpent)} / R$ {formatBRL(moradiaBudget.limit)}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold ${
                      moradiaPercent >= 100
                        ? 'bg-error-container text-error'
                        : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}
                  >
                    {moradiaPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-on-tertiary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${moradiaPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>{moradiaBudget.limit > 0 ? (moradiaPercent <= 95 ? 'Dentro do planejado' : 'Atenção ao teto') : 'Defina um orçamento'}</span>
                <span>Saldo: R$ {formatBRL(Math.max(0, moradiaBudget.limit - moradiaSpent))}</span>
              </div>
            </div>

            {/* Restaurantes & Bares */}
            <div className="flex flex-col gap-1.5 p-space-sm bg-surface-container-low/40 rounded-lg border border-surface-container/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">restaurant</span>
                  <span className="font-title-md text-title-md text-on-surface">
                    {alimentacaoBudget.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                    R$ {formatBRL(alimentacaoSpent)} / R$ {formatBRL(alimentacaoBudget.limit)}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold ${
                      alimentacaoPercent >= 100
                        ? 'bg-error-container text-error'
                        : 'bg-surface-container-highest text-secondary'
                    }`}
                  >
                    {alimentacaoPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${alimentacaoPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span className="text-secondary font-medium">{alimentacaoBudget.limit > 0 ? (alimentacaoPercent >= 85 ? 'Atenção ao limite' : 'Dentro do limite') : 'Defina um orçamento'}</span>
                <span>Saldo: R$ {formatBRL(Math.max(0, alimentacaoBudget.limit - alimentacaoSpent))}</span>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-xs flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total Orçado: R${' '}
              {formatBRL(budgets.reduce((acc, b) => acc + b.limit, 0))}
            </span>
            <button
              onClick={onOpenAdjustBudget}
              className="font-label-md text-label-md text-secondary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Ajustar Orçamentos
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
