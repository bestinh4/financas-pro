import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ActiveTab } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, resetToDefaultData, transactions, accounts } = useFinance();
  const [confirmReset, setConfirmReset] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'receipt_long' },
    { id: 'contas', label: 'Contas', icon: 'account_balance' },
    { id: 'cartoes-e-faturas', label: 'Cartões & Faturas', icon: 'credit_card' },
    { id: 'orcamento-e-metas', label: 'Orçamento & Metas', icon: 'target' },
    { id: 'relatorios', label: 'Relatórios & DRE', icon: 'monitoring' },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-margin-md border-b border-surface-container/60">
            <div
              className="flex items-center gap-space-sm cursor-pointer select-none"
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-primary-fixed text-[20px]">
                  account_balance_wallet
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-on-surface tracking-tight leading-none">
                  Finanças Pro
                </span>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-0.5">
                  Executivo 2.0
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-space-md py-space-md">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-space-md py-2.5 rounded-lg text-left transition-all duration-150 group ${
                    isActive
                      ? 'bg-surface-container-low text-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface font-normal'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        isActive
                          ? 'text-secondary fill-1'
                          : 'text-on-surface-variant group-hover:text-primary'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="font-body-md text-body-md">{item.label}</span>
                  </div>
                  {item.id === 'lancamentos' && (
                    <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-md bg-surface-container text-on-surface-variant">
                      {transactions.filter((t) => !t.isInactive).length}
                    </span>
                  )}
                  {item.id === 'contas' && (
                    <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded-md bg-surface-container text-on-surface-variant">
                      {accounts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Audit & System Status Card */}
        <div className="p-margin-md flex flex-col gap-3">
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-xs border border-surface-container shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Status do Sistema
              </span>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" title="Online & Operacional"></span>
            </div>
            <span className="font-metric-data text-metric-data text-on-surface font-semibold">
              Auditoria Contábil
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Sincronizado via Open Finance
            </span>
          </div>

          {confirmReset ? (
            <div className="bg-surface-container p-2.5 rounded-lg border border-secondary/30 flex flex-col gap-2 animate-in fade-in duration-150">
              <span className="font-label-sm text-xs font-semibold text-on-surface">
                Restaurar dados de amostra padrão?
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    resetToDefaultData();
                    setConfirmReset(false);
                  }}
                  className="flex-1 py-1 px-2 bg-primary text-on-primary rounded text-label-sm font-semibold hover:bg-inverse-surface transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="py-1 px-2 text-on-surface-variant hover:text-on-surface rounded text-label-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-on-surface-variant hover:text-secondary hover:bg-surface-container-low rounded-lg transition-colors font-label-sm text-label-sm cursor-pointer"
              title="Redefinir dados para o estado inicial"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Restaurar Amostra Padrão</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
