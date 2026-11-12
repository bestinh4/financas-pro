import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const ConfiguracoesView: React.FC = () => {
  const { profileName, updateProfileName, accounts, creditCards, transactions, transfers, budgets, clearAllData, showToast } = useFinance();
  const [name, setName] = useState(profileName);
  const [confirmStep, setConfirmStep] = useState(0);

  const exportBackup = () => {
    const backup = { app: 'Finanças Pro', schemaVersion: 1, exportedAt: new Date().toISOString(), profileName, accounts, creditCards, transactions, transfers, budgets };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'financas-pro-backup.json'; anchor.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado', 'O arquivo JSON foi gerado com os dados atualmente cadastrados.', 'success');
  };



  return (
    <div className="tab-content flex flex-col w-full gap-space-lg animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container/60 shadow-card">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Preferências</span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Configurações</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Personalize seu perfil e gerencie os dados armazenados neste dispositivo.</p>
      </div>

      <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container/60 shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary">person</span><h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Perfil</h3></div>
        <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="profile-name">Nome exibido no sistema</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Digite seu nome" className="flex-1 px-3 py-2 rounded-lg border border-surface-container bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary" />
          <button onClick={() => { updateProfileName(name); showToast('Perfil atualizado', 'Seu nome foi salvo neste dispositivo.', 'success'); }} className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold">Salvar nome</button>
        </div>
        <p className="text-label-sm text-on-surface-variant">O nome é opcional e pode ser alterado quando quiser.</p>
      </section>

      <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container/60 shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary">database</span><h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Dados e backup</h3></div>
        <p className="text-body-sm text-on-surface-variant">Os dados financeiros são armazenados localmente neste navegador. Não há sincronização bancária ou nuvem ativa nesta versão.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[['Contas', accounts.length], ['Cartões', creditCards.length], ['Lançamentos', transactions.length], ['Transferências', transfers.length], ['Orçamentos', budgets.length]].map(([label, count]) => <div key={label} className="rounded-lg bg-surface-container-low p-3"><div className="text-label-sm text-on-surface-variant">{label}</div><div className="font-headline-sm text-headline-sm text-on-surface font-semibold">{count}</div></div>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportBackup} className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-2"><span className="material-symbols-outlined">download</span>Exportar backup JSON</button>
        </div>
        <p className="text-label-sm text-on-surface-variant">A exportação está disponível. A restauração de arquivos será adicionada após validação completa dos vínculos entre contas, cartões e lançamentos.</p>
      </section>

      <section className="bg-surface-container-lowest p-space-lg rounded-xl border border-error/30 shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-error">delete_forever</span><h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Limpar dados do aplicativo</h3></div>
        <p className="text-body-sm text-on-surface-variant">Apaga contas, cartões, lançamentos, transferências, orçamentos e nome do perfil deste aplicativo neste navegador. A ação não pode ser desfeita. Exporte um backup antes, se precisar guardar seus registros.</p>
        {confirmStep === 0 ? <button onClick={() => setConfirmStep(1)} className="self-start px-4 py-2 rounded-lg border border-error text-error font-semibold">Iniciar limpeza</button> : <div className="flex flex-wrap items-center gap-2"><span className="text-body-sm text-error font-semibold">Confirme a exclusão permanente dos dados deste aplicativo.</span><button onClick={() => { clearAllData(); setName(''); setConfirmStep(0); }} className="px-4 py-2 rounded-lg bg-error text-white font-semibold">Sim, apagar tudo</button><button onClick={() => setConfirmStep(0)} className="px-4 py-2 rounded-lg border border-surface-container text-on-surface">Cancelar</button></div>}
      </section>
    </div>
  );
};
