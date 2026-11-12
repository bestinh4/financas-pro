import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewTxModal: () => void;
  onOpenScanReceipt?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenNewTxModal, onOpenScanReceipt }) => {
  const {
    totalConsolidatedBalance,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    showToast,
  } = useFinance();

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const monthsList = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const currentMonthLabel =
    monthsList.find((m) => m.value === selectedMonth)?.label || 'Outubro';

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast(
        'Sincronização Concluída',
        'Contas Itaú, BTG Pactual e Nubank atualizadas via Open Finance.',
        'success'
      );
    }, 700);
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 sm:px-margin-lg border-b border-surface-container/40">
      <div className="flex items-center gap-2 sm:gap-margin-md">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Month / Year Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="flex items-center gap-space-sm bg-surface-container-low hover:bg-surface-container px-space-md py-1.5 rounded-lg text-on-surface cursor-pointer transition-colors border border-surface-container"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
            <span className="font-title-md text-title-md">
              {currentMonthLabel} {selectedYear}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
              {isMonthPickerOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isMonthPickerOpen && (
            <div className="absolute top-full mt-2 left-0 bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl p-3 z-50 w-64 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Ano Fiscal
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-surface-container-low text-body-md font-semibold text-on-surface px-2 py-0.5 rounded-md focus:outline-none cursor-pointer"
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {monthsList.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`py-1.5 px-2.5 rounded-lg text-left font-body-sm text-body-sm transition-colors ${
                      selectedMonth === m.value
                        ? 'bg-secondary text-on-secondary font-semibold'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Consolidated General Balance in Header */}
        <div className="hidden lg:flex items-center gap-space-md px-margin-md py-1 bg-surface-container-lowest rounded-lg border border-surface-container/60">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Saldo Geral Consolidado
            </span>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">R$</span>
              <span className="font-headline-md text-headline-md text-on-surface tracking-tight" id="header-total-balance">
                {totalConsolidatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+4.8%</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Notifications, Sync, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-space-md">
        {/* Scanner IA Button */}
        {onOpenScanReceipt && (
          <button
            onClick={onOpenScanReceipt}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Escanear Comprovante com IA"
          >
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            <span className="font-label-md text-label-md font-semibold hidden md:inline">Escanear com IA</span>
          </button>
        )}

        {/* Quick New Transaction button */}
        <button
          onClick={onOpenNewTxModal}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-inverse-surface transition-colors shadow-xs cursor-pointer"
          title="Novo Lançamento Rápido"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="font-label-md text-label-md font-semibold">Lançamento</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            type="button"
            aria-label="Notificações"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container">
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  Auditoria & Alertas
                </span>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant">
                  2 novos
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-surface-container-low/60 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                    verified_user
                  </span>
                  <div className="flex-1">
                    <p className="font-title-md text-xs font-semibold text-on-surface">
                      Conciliação Automática Realizada
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      Saldos de Itaú e BTG 100% alinhados com extrato oficial.
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low/60 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-500 mt-0.5">
                    schedule
                  </span>
                  <div className="flex-1">
                    <p className="font-title-md text-xs font-semibold text-on-surface">
                      Fatura XP Vence em 10/Nov
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                      R$ 2.840,20 fechada pronta para débito agendado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSync}
          className={`p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors ${
            isSyncing ? 'animate-spin text-secondary' : ''
          }`}
          type="button"
          title="Sincronizar com Open Finance"
        >
          <span className="material-symbols-outlined text-[20px]">sync</span>
        </button>

        <div className="h-6 w-[1px] bg-surface-container"></div>

        {/* User Profile */}
        <div className="flex items-center gap-space-sm pl-space-xs cursor-pointer select-none">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
              Rodrigo Alencar
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
              Diretor Executivo
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-xs shadow-xs">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
