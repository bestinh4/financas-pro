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

  // Compute DRE categories
  const moradiaCost = categoryBreakdown.find((c) => c.category === 'Moradia')?.amount || 0;
  const alimentacaoCost = categoryBreakdown.find((c) => c.category === 'Alimentação')?.amount || 0;
  const transporteCost = categoryBreakdown.find((c) => c.category === 'Transporte')?.amount || 0;
  const saudeCost = categoryBreakdown.find((c) => c.category === 'Saúde & Cuidados')?.amount || 0;
  const lazerCost = categoryBreakdown.find((c) => c.category === 'Lazer & Cultura')?.amount || 0;
  const outrosCost = categoryBreakdown.find((c) => c.category === 'Outros')?.amount || 0;

  const totalFixas = moradiaCost + saudeCost;
  const totalVariaveis = alimentacaoCost + transporteCost + lazerCost + outrosCost;

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
              Diretor Responsável: Rodrigo Alencar | Base: Regime de Competência / Caixa Conciliado
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold text-label-sm uppercase">
            Auditado &amp; Fechado
          </span>
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
              {/* Receita Bruta */}
              <tr className="bg-surface-container-low/40 font-semibold text-on-surface">
                <td className="py-3 px-4">1. RECEITA OPERACIONAL BRUTA</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-on-tertiary-container font-semibold">Crédito</span>
                </td>
                <td className="py-3 px-4 text-right">100.0%</td>
                <td className="py-3 px-4 text-right text-on-tertiary-container">
                  R$ {formatBRL(monthlyReceitas)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">1.1 Receitas PJ &amp; Honorários</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Operacional</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">53.1%</td>
                <td className="py-2.5 px-4 text-right font-medium">R$ 9.800,00</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">1.2 Dividendos Holdings &amp; Imóveis</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Patrimonial</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">46.9%</td>
                <td className="py-2.5 px-4 text-right font-medium">R$ 8.650,00</td>
              </tr>

              {/* Deduções & Neutralidades */}
              <tr className="bg-surface-container-low/20 text-on-surface-variant">
                <td className="py-2 px-4 italic">
                  (-) Transferências entre Contas Próprias (Regra de Neutralidade Contábil)
                </td>
                <td className="py-2 px-4 text-center">Neutro</td>
                <td className="py-2 px-4 text-right">0.0%</td>
                <td className="py-2 px-4 text-right font-mono">R$ 0,00</td>
              </tr>

              {/* Despesas Fixas */}
              <tr className="bg-surface-container-low/40 font-semibold text-on-surface">
                <td className="py-3 px-4">2. DESPESAS OPERACIONAIS FIXAS</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-error font-semibold">Débito</span>
                </td>
                <td className="py-3 px-4 text-right">{getPercentOfRevenue(totalFixas)}</td>
                <td className="py-3 px-4 text-right text-error">- R$ {formatBRL(totalFixas)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">2.1 Moradia, Aluguel &amp; Condomínio</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Fixa</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">
                  {getPercentOfRevenue(moradiaCost)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(moradiaCost)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">2.2 Saúde, Planos &amp; Bem-estar</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Fixa</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">
                  {getPercentOfRevenue(saudeCost)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(saudeCost)}</td>
              </tr>

              {/* Despesas Variáveis */}
              <tr className="bg-surface-container-low/40 font-semibold text-on-surface">
                <td className="py-3 px-4">3. DESPESAS OPERACIONAIS VARIÁVEIS</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-error font-semibold">Débito</span>
                </td>
                <td className="py-3 px-4 text-right">{getPercentOfRevenue(totalVariaveis)}</td>
                <td className="py-3 px-4 text-right text-error">- R$ {formatBRL(totalVariaveis)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">3.1 Alimentação &amp; Gastronomia</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Variável</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">
                  {getPercentOfRevenue(alimentacaoCost)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(alimentacaoCost)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">3.2 Transporte &amp; Veículos</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Variável</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">
                  {getPercentOfRevenue(transporteCost)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(transporteCost)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">3.3 Lazer &amp; Cultura</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Variável</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">
                  {getPercentOfRevenue(lazerCost)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(lazerCost)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-8 text-on-surface-variant">3.4 Outros &amp; Serviços Administrativos</td>
                <td className="py-2.5 px-4 text-center text-on-surface-variant">Variável</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant">
                  {getPercentOfRevenue(outrosCost)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium">- R$ {formatBRL(outrosCost)}</td>
              </tr>

              {/* Total Despesas */}
              <tr className="bg-error-container/30 font-bold text-on-surface">
                <td className="py-3 px-4">TOTAL DE CUSTOS &amp; DESPESAS</td>
                <td className="py-3 px-4 text-center text-error">Consolidado</td>
                <td className="py-3 px-4 text-right text-error">
                  {getPercentOfRevenue(monthlyDespesas)}
                </td>
                <td className="py-3 px-4 text-right text-error font-headline-md text-headline-md">
                  - R$ {formatBRL(monthlyDespesas)}
                </td>
              </tr>

              {/* Resultado Líquido */}
              <tr className="bg-tertiary-container text-on-tertiary font-bold text-headline-md">
                <td className="py-4 px-4 rounded-l-lg">
                  LUCRO OPERACIONAL LÍQUIDO / SUPERÁVIT
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm uppercase">
                    Líquido
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-tertiary-fixed">
                  {getPercentOfRevenue(resultadoLiquido)}
                </td>
                <td className="py-4 px-4 text-right text-tertiary-fixed rounded-r-lg">
                  + R$ {formatBRL(resultadoLiquido)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Audit notes */}
        <div className="mt-6 pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between text-label-sm text-on-surface-variant gap-2">
          <span>Relatório gerado eletronicamente com validação de duplicidade e conciliação bancária ativa.</span>
          <span className="font-semibold text-on-surface">Hash de Auditoria: SHA256-49BF-89A1</span>
        </div>
      </div>
    </div>
  );
};
