import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const RelatoriosView: React.FC = () => {
  const {
    selectedMonth,
    selectedYear,
    monthlyReceitas,
    monthlyDespesas,
    resultadoLiquido,
    categoryBreakdown,
    transactions,
    showToast,
  } = useFinance();

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getPercentOfRevenue = (amount: number) => {
    if (monthlyReceitas <= 0) return '0.0%';
    return `${((amount / monthlyReceitas) * 100).toFixed(1)}%`;
  };

  const handleExportCSV = () => {
    const activeTx = transactions.filter((t) => !t.isInactive);
    const headers = ['ID', 'Data', 'Descricao', 'Categoria', 'Tipo', 'Conta', 'Valor', 'Status'];
    const rows = activeTx.map((t) => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.accountId,
      t.amount.toFixed(2),
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DRE_FinancasPro_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('DRE Exportado com Sucesso', 'Arquivo CSV baixado para conferência.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-surface-container-lowest p-space-md rounded-xl shadow-card border border-surface-container/60 gap-space-md no-print">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            Auditoria & Controladoria
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Demonstrativo do Resultado do Exercício (DRE)
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Período Fiscal: {selectedMonth}/{selectedYear} - Consolidação Gerencial em Padrão Contábil
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-surface-container cursor-pointer font-medium text-body-sm shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-inverse-surface transition-colors shadow-sm font-semibold cursor-pointer text-body-sm"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Relatório Estruturado DRE */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card-prominent border border-surface-container/60 flex flex-col">
        <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Finanças Pro Executivo 2.0 - Relatório Gerencial DRE
            </h3>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Demonstrativo calculado a partir dos lançamentos cadastrados
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-semibold text-label-sm uppercase">Dados do período</span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[660px] text-left border-collapse font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-2.5 px-4 rounded-l-lg">Conta / Classificação Contábil</th>
                <th className="py-2.5 px-4 text-center">Tipo</th>
                <th className="py-2.5 px-4 text-right">Análise Vertical (AV)</th>
                <th className="py-2.5 px-4 text-right rounded-r-lg">Valor Consolidado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              <tr className="bg-surface-container-low/40 font-semibold text-on-surface">
                <td className="py-3 px-4">RECEITAS REGISTRADAS</td><td className="py-3 px-4 text-center">Crédito</td>
                <td className="py-3 px-4 text-right">{getPercentOfRevenue(monthlyReceitas)}</td><td className="py-3 px-4 text-right text-on-tertiary-container">R$ {formatBRL(monthlyReceitas)}</td>
              </tr>
              {categoryBreakdown.map((item) => (
                <tr key={item.category}><td className="py-2.5 px-8 text-on-surface-variant">{item.category}</td><td className="py-2.5 px-4 text-center text-on-surface-variant">Despesa</td><td className="py-2.5 px-4 text-right text-on-surface-variant">{getPercentOfRevenue(item.amount)}</td><td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(item.amount)}</td></tr>
              ))}
              <tr className="bg-error-container/30 font-bold text-on-surface"><td className="py-3 px-4">TOTAL DE DESPESAS</td><td className="py-3 px-4 text-center text-error">Débito</td><td className="py-3 px-4 text-right text-error">{getPercentOfRevenue(monthlyDespesas)}</td><td className="py-3 px-4 text-right text-error">- R$ {formatBRL(monthlyDespesas)}</td></tr>
              <tr className="bg-tertiary-container text-on-tertiary font-bold text-headline-md"><td className="py-4 px-4">RESULTADO LÍQUIDO</td><td className="py-4 px-4 text-center">Líquido</td><td className="py-4 px-4 text-right">{getPercentOfRevenue(resultadoLiquido)}</td><td className="py-4 px-4 text-right">R$ {formatBRL(resultadoLiquido)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Footer Audit notes */}
        <div className="mt-6 pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between text-label-sm text-on-surface-variant gap-2">
          <span>Relatório informativo calculado com base nos registros locais do período selecionado.</span>
        </div>
      </div>
    </div>
  );
};
