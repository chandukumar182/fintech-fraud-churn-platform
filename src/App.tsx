import React, { useMemo, useState } from 'react';
import {
  ACCOUNTS,
  ANALYSTS,
  CUSTOMERS,
  DEVICES,
  FRAUD_SCORES,
  INITIAL_CHURN_SCORES,
  INITIAL_FRAUD_ALERTS,
  INITIAL_RETENTION_ACTIONS,
  JOINT_RISK_TREND,
  LOANS,
  REPAYMENTS,
  TRANSACTIONS,
} from './data/mockRiskData';
import {
  AlertStatus,
  FraudAlert,
  NavView,
  RetentionAction,
  RetentionActionType,
  RetentionChannel,
  RetentionOutcome,
} from './types/risk';
import { Sidebar } from './components/Sidebar';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { FraudWorkbench } from './components/FraudWorkbench';
import { ChurnRetentionHub } from './components/ChurnRetentionHub';
import { Customer360Profile } from './components/Customer360Profile';
import { TriggerRetentionModal } from './components/TriggerRetentionModal';
import { Menu, Search } from 'lucide-react';

const VIEW_TITLES: Record<NavView, string> = {
  overview: 'Executive Overview',
  fraud: 'Fraud Investigation Workbench',
  churn: 'Customer Churn & Retention Hub',
  customer360: 'Customer 360° Unified Profile',
};

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAnalystId, setActiveAnalystId] = useState<string>(ANALYSTS[0].analyst_id);

  // Operational Stateful Records
  const [alerts, setAlerts] = useState<FraudAlert[]>(INITIAL_FRAUD_ALERTS);
  const [retentionActions, setRetentionActions] = useState<RetentionAction[]>(
    INITIAL_RETENTION_ACTIONS
  );
  const [churnScores] = useState(INITIAL_CHURN_SCORES);

  // Active Selections
  const [selectedAlertId, setSelectedAlertId] = useState<string>(
    INITIAL_FRAUD_ALERTS[0].alert_id
  );
  const [selectedChurnId, setSelectedChurnId] = useState<string>(
    INITIAL_CHURN_SCORES[0].churn_id
  );
  const [directoryCustomerId, setDirectoryCustomerId] = useState<string>(
    CUSTOMERS[0].customer_id
  );

  // Slide-over Customer 360° Drawer
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);

  // Trigger Retention Modal
  const [triggerModalChurnId, setTriggerModalChurnId] = useState<string | null>(null);

  // Quick Jump Search in Header
  const [quickSearch, setQuickSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return [];
    return CUSTOMERS.filter(
      (c) =>
        c.customer_id.toLowerCase().includes(q) ||
        c.full_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [quickSearch]);

  const openAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'Open').length,
    [alerts]
  );

  const highChurnCount = useMemo(
    () => churnScores.filter((c) => c.risk_band === 'High').length,
    [churnScores]
  );

  const handleOpenCustomer360 = (customerId: string) => {
    setDrawerCustomerId(customerId);
    setDirectoryCustomerId(customerId);
    setQuickSearch('');
    setSearchFocused(false);
  };

  const handleInspectAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setDrawerCustomerId(null);
    setActiveView('fraud');
  };

  const handleOpenChurnHub = (churnId: string) => {
    setSelectedChurnId(churnId);
    setDrawerCustomerId(null);
    setActiveView('churn');
  };

  const handleResolveAlert = (
    alertId: string,
    payload: {
      status: AlertStatus;
      confirmed_fraud: boolean | null;
      notes: string;
      analyst_id: string | null;
    }
  ) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.alert_id === alertId
          ? {
              ...a,
              status: payload.status,
              confirmed_fraud: payload.confirmed_fraud,
              notes: payload.notes,
              analyst_id: payload.analyst_id,
              resolved_at:
                payload.status === 'Resolved' ? new Date().toISOString() : null,
            }
          : a
      )
    );
  };

  const handleDispatchRetention = (payload: {
    churn_id: string;
    customer_id: string;
    action_type: RetentionActionType;
    channel: RetentionChannel;
    offer_detail: string;
  }) => {
    const newAction: RetentionAction = {
      action_id: `RET-${Math.floor(6105 + Math.random() * 800)}`,
      churn_id: payload.churn_id,
      customer_id: payload.customer_id,
      action_type: payload.action_type,
      channel: payload.channel,
      sent_at: new Date().toISOString(),
      outcome: 'Pending',
      offer_detail: payload.offer_detail,
    };
    setRetentionActions((prev) => [newAction, ...prev]);
    setSelectedChurnId(payload.churn_id);
  };

  const handleUpdateActionOutcome = (
    actionId: string,
    outcome: RetentionOutcome
  ) => {
    setRetentionActions((prev) =>
      prev.map((act) => (act.action_id === actionId ? { ...act, outcome } : act))
    );
  };

  const drawerCustomer = CUSTOMERS.find((c) => c.customer_id === drawerCustomerId);
  const directoryCustomer =
    CUSTOMERS.find((c) => c.customer_id === directoryCustomerId) ?? CUSTOMERS[0];

  const triggerModalChurn = churnScores.find(
    (c) => c.churn_id === triggerModalChurnId
  );
  const triggerModalCustomer = CUSTOMERS.find(
    (c) => c.customer_id === triggerModalChurn?.customer_id
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        openAlertsCount={openAlertsCount}
        highChurnCount={highChurnCount}
        analysts={ANALYSTS}
        activeAnalystId={activeAnalystId}
        onChangeAnalyst={setActiveAnalystId}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Context Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline">Risk Ops</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-900 truncate">
                {VIEW_TITLES[activeView]}
              </h1>
            </div>
          </div>

          {/* Quick Customer Jump Search */}
          <div className="relative w-56 sm:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={quickSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Jump to customer_id or name..."
              aria-label="Quick jump to customer 360 profile"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute right-0 left-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden z-30">
                {searchResults.map((c) => (
                  <button
                    key={c.customer_id}
                    type="button"
                    onMouseDown={() => handleOpenCustomer360(c.customer_id)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between gap-2 border-b last:border-b-0 border-slate-100 cursor-pointer"
                  >
                    <span className="font-mono font-semibold text-slate-900">
                      {c.customer_id}
                    </span>
                    <span className="text-slate-600 truncate">
                      {c.full_name} · {c.city}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {activeView === 'overview' && (
            <ExecutiveOverview
              customers={CUSTOMERS}
              accounts={ACCOUNTS}
              alerts={alerts}
              transactions={TRANSACTIONS}
              fraudScores={FRAUD_SCORES}
              churnScores={churnScores}
              loans={LOANS}
              trendData={JOINT_RISK_TREND}
              onOpenCustomer360={handleOpenCustomer360}
              onInspectAlert={handleInspectAlert}
              onOpenChurnHub={handleOpenChurnHub}
            />
          )}

          {activeView === 'fraud' && (
            <FraudWorkbench
              alerts={alerts}
              transactions={TRANSACTIONS}
              fraudScores={FRAUD_SCORES}
              devices={DEVICES}
              customers={CUSTOMERS}
              analysts={ANALYSTS}
              activeAnalystId={activeAnalystId}
              selectedAlertId={selectedAlertId}
              onSelectAlert={setSelectedAlertId}
              onOpenCustomer360={handleOpenCustomer360}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {activeView === 'churn' && (
            <ChurnRetentionHub
              customers={CUSTOMERS}
              accounts={ACCOUNTS}
              churnScores={churnScores}
              retentionActions={retentionActions}
              selectedChurnId={selectedChurnId}
              onSelectChurnId={setSelectedChurnId}
              onOpenCustomer360={handleOpenCustomer360}
              onOpenTriggerModal={(churnId) => setTriggerModalChurnId(churnId)}
              onUpdateActionOutcome={handleUpdateActionOutcome}
            />
          )}

          {activeView === 'customer360' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <Customer360Profile
                customer={directoryCustomer}
                allCustomers={CUSTOMERS}
                accounts={ACCOUNTS}
                devices={DEVICES}
                loans={LOANS}
                repayments={REPAYMENTS}
                transactions={TRANSACTIONS}
                fraudScores={FRAUD_SCORES}
                fraudAlerts={alerts}
                churnScores={churnScores}
                retentionActions={retentionActions}
                onSelectCustomer={setDirectoryCustomerId}
                onInspectAlert={handleInspectAlert}
                onOpenTriggerModal={(churnId) => setTriggerModalChurnId(churnId)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Customer 360° Slide-Over Drawer (opened by clicking any customer_id anywhere) */}
      {drawerCustomer && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={`Customer 360 profile for ${drawerCustomer.customer_id}`}
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setDrawerCustomerId(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-3xl h-full bg-white border-l border-slate-200 shadow-2xl overflow-hidden">
            <Customer360Profile
              customer={drawerCustomer}
              allCustomers={CUSTOMERS}
              accounts={ACCOUNTS}
              devices={DEVICES}
              loans={LOANS}
              repayments={REPAYMENTS}
              transactions={TRANSACTIONS}
              fraudScores={FRAUD_SCORES}
              fraudAlerts={alerts}
              churnScores={churnScores}
              retentionActions={retentionActions}
              onSelectCustomer={(id) => setDrawerCustomerId(id)}
              onInspectAlert={handleInspectAlert}
              onOpenTriggerModal={(churnId) => setTriggerModalChurnId(churnId)}
              onClose={() => setDrawerCustomerId(null)}
              isDrawer
            />
          </div>
        </div>
      )}

      {/* Trigger Retention Action Modal */}
      {triggerModalChurn && triggerModalCustomer && (
        <TriggerRetentionModal
          churnScore={triggerModalChurn}
          customer={triggerModalCustomer}
          onClose={() => setTriggerModalChurnId(null)}
          onDispatch={handleDispatchRetention}
        />
      )}
    </div>
  );
}
