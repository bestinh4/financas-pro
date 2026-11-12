/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LancamentosView } from './components/LancamentosView';
import { ContasView } from './components/ContasView';
import { CartoesView } from './components/CartoesView';
import { OrcamentosView } from './components/OrcamentosView';
import { RelatoriosView } from './components/RelatoriosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { NewTxModal, NewAccountModal } from './components/Modals';
import { ScanReceiptModal } from './components/ScanReceiptModal';
import { ToastContainer } from './components/Toast';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Expose global window helper for direct references
  useEffect(() => {
    (window as any).switchToTab = (tab: any) => {
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }, [setActiveTab]);

  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Executive Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewTxModal={() => setIsNewTxModalOpen(true)}
          onOpenScanReceipt={() => setIsScanModalOpen(true)}
        />

        {/* Viewport Content */}
        <main className="w-full pt-16 bg-surface px-4 sm:px-margin-lg py-margin-md flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewTx={() => setIsNewTxModalOpen(true)}
              onOpenExportDRE={() => setActiveTab('relatorios')}
              onOpenAdjustBudget={() => setActiveTab('orcamento-e-metas')}
              onOpenScanReceipt={() => setIsScanModalOpen(true)}
            />
          )}

          {activeTab === 'lancamentos' && (
            <LancamentosView onOpenScanReceipt={() => setIsScanModalOpen(true)} />
          )}

          {activeTab === 'contas' && (
            <ContasView onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)} />
          )}

          {activeTab === 'cartoes-e-faturas' && <CartoesView />}

          {activeTab === 'orcamento-e-metas' && <OrcamentosView />}

          {activeTab === 'relatorios' && <RelatoriosView />}

          {activeTab === 'configuracoes' && <ConfiguracoesView />}
        </main>
      </div>

      {/* Global Modals */}
      <NewTxModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onOpenScanReceipt={() => {
          setIsNewTxModalOpen(false);
          setIsScanModalOpen(true);
        }}
      />

      <NewAccountModal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
      />

      <ScanReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      {/* Toast Notification Stack */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
