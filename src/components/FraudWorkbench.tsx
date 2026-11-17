import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertStatus,
  Analyst,
  Customer,
  DeviceRecord,
  FraudAlert,
  FraudScore,
  Transaction,
} from '../types/risk';
import {
  formatDateTime,
  formatINR,
  formatTimeElapsed,
} from '../utils/formatters';
import {
  AlertStatusBadge,
  CustomerIdLink,
  DecisionBadge,
  KycBadge,
  PayeeBadge,
} from './StatusBadge';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldAlert,
  Smartphone,
  Users,
  XCircle,
} from 'lucide-react';

interface FraudWorkbenchProps {
  alerts: FraudAlert[];
  transactions: Transaction[];
  fraudScores: FraudScore[];
  devices: DeviceRecord[];
  customers: Customer[];
  analysts: Analyst[];
  activeAnalystId: string;
  selectedAlertId: string;
  onSelectAlert: (alertId: string) => void;
  onOpenCustomer360: (customerId: string) => void;
  onResolveAlert: (
    alertId: string,
    payload: {
      status: AlertStatus;
      confirmed_fraud: boolean | null;
      notes: string;
      analyst_id: string | null;
    }
  ) => void;
}

export const FraudWorkbench: React.FC<FraudWorkbenchProps> = ({
  alerts,
  transactions,
  fraudScores,
  devices,
  customers,
  analysts,
  activeAnalystId,
  selectedAlertId,
  onSelectAlert,
  onOpenCustomer360,
  onResolveAlert,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | AlertStatus>('All');
  const [analystFilter, setAnalystFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  // Workbench decision form state synced with selected alert
  const selectedAlert =
    alerts.find((a) => a.alert_id === selectedAlertId) ?? alerts[0];

  const [confirmedFraud, setConfirmedFraud] = useState<boolean | null>(
    selectedAlert?.confirmed_fraud ?? null
  );
  const [notes, setNotes] = useState<string>(selectedAlert?.notes ?? '');
  const [assignedAnalyst, setAssignedAnalyst] = useState<string>(
    selectedAlert?.analyst_id ?? activeAnalystId
  );

  useEffect(() => {
    if (selectedAlert) {
      setConfirmedFraud(selectedAlert.confirmed_fraud);
      setNotes(selectedAlert.notes);
      setAssignedAnalyst(selectedAlert.analyst_id ?? activeAnalystId);
      setHistoryOpen(false);
    }
  }, [selectedAlert?.alert_id, selectedAlert?.status, selectedAlert?.resolved_at, activeAnalystId]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (statusFilter !== 'All' && alert.status !== statusFilter) return false;
      if (analystFilter === 'UNASSIGNED' && alert.analyst_id !== null) return false;
      if (
        analystFilter !== 'ALL' &&
        analystFilter !== 'UNASSIGNED' &&
        alert.analyst_id !== analystFilter
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const txn = transactions.find((t) => t.txn_id === alert.txn_id);
        const match =
          alert.alert_id.toLowerCase().includes(q) ||
          alert.txn_id.toLowerCase().includes(q) ||
          alert.customer_id.toLowerCase().includes(q) ||
          (txn?.payee_upi_id.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [alerts, statusFilter, analystFilter, searchQuery, transactions]);

  const txn = transactions.find((t) => t.txn_id === selectedAlert?.txn_id);
  const score = fraudScores.find((s) => s.txn_id === selectedAlert?.txn_id);
  const device = devices.find((d) => d.device_hash === txn?.device_hash);
  const customer = customers.find((c) => c.customer_id === selectedAlert?.customer_id);

  const isMuleRingDevice = (device?.customer_links.length ?? 0) > 1;

  const handleActionSubmit = (nextStatus: AlertStatus) => {
    if (!selectedAlert) return;
    onResolveAlert(selectedAlert.alert_id, {
      status: nextStatus,
      confirmed_fraud: nextStatus === 'Resolved' ? confirmedFraud : null,
      notes,
      analyst_id: assignedAnalyst || activeAnalystId,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Panel: Alert Queue */}
      <section className="lg:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col lg:max-h-[calc(100vh-116px)]">
        <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Fraud Alert Queue
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {filteredAlerts.length} of {alerts.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter alert_id, txn_id, customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Status Segmented Filter */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-md">
            {(['All', 'Open', 'In Review', 'Resolved'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Analyst Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="workbench-analyst-filter"
              className="text-xs text-slate-500 whitespace-nowrap"
            >
              Analyst:
            </label>
            <select
              id="workbench-analyst-filter"
              value={analystFilter}
              onChange={(e) => setAnalystFilter(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Analysts</option>
              <option value="UNASSIGNED">Unassigned</option>
              {analysts.map((a) => (
                <option key={a.analyst_id} value={a.analyst_id}>
                  {a.analyst_id} · {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Alert List */}
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {filteredAlerts.map((alert) => {
            const itemTxn = transactions.find((t) => t.txn_id === alert.txn_id);
            const itemScore = fraudScores.find((s) => s.txn_id === alert.txn_id);
            const isSelected = selectedAlert?.alert_id === alert.alert_id;
            const riskScore = itemScore?.risk_score ?? 0;

            return (
              <button
                key={alert.alert_id}
                type="button"
                onClick={() => onSelectAlert(alert.alert_id)}
                className={`w-full text-left px-4 py-3 transition-colors cursor-pointer block ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-50 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold">
                    {alert.alert_id}
                  </span>
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : riskScore >= 85
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : riskScore >= 65
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Score {riskScore}
                  </span>
                </div>

                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {formatINR(itemTxn?.amount ?? 0)}
                  </span>
                  <span
                    className={`text-xs ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {itemTxn?.channel}
                  </span>
                </div>

                <div
                  className={`mt-1.5 flex items-center justify-between gap-2 text-xs ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  <span className="truncate">
                    {alert.status} · {alert.analyst_id ?? 'Unassigned'}
                  </span>
                  <span className="font-mono tabular-nums shrink-0">
                    {formatTimeElapsed(alert.opened_at)}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No fraud alerts match the current status or analyst filter.
            </div>
          )}
        </div>
      </section>

      {/* Main Panel: Transaction & Score Inspector */}
      <section className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        {selectedAlert && txn && score ? (
          <>
            {/* Inspector Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-mono text-base font-bold text-slate-900">
                    {selectedAlert.alert_id}
                  </h2>
                  <AlertStatusBadge status={selectedAlert.status} />
                  {selectedAlert.confirmed_fraud === true && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <XCircle className="w-3 h-3" />
                      Confirmed Fraud
                    </span>
                  )}
                  {selectedAlert.confirmed_fraud === false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Cleared (Legitimate)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>
                    Customer:{' '}
                    <CustomerIdLink
                      customerId={selectedAlert.customer_id}
                      onSelect={onOpenCustomer360}
                      sublabel={customer?.full_name}
                    />
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Opened {formatDateTime(selectedAlert.opened_at)}</span>
                  {selectedAlert.resolved_at && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Resolved {formatDateTime(selectedAlert.resolved_at)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="inspector-assign-analyst"
                  className="text-xs text-slate-500 whitespace-nowrap"
                >
                  Assigned:
                </label>
                <select
                  id="inspector-assign-analyst"
                  value={assignedAnalyst}
                  onChange={(e) => setAssignedAnalyst(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {analysts.map((a) => (
                    <option key={a.analyst_id} value={a.analyst_id}>
                      {a.analyst_id} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. Transaction Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Transaction Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50/70 border border-slate-200 rounded-md">
                  <div>
                    <div className="text-xs text-slate-500">Transaction ID</div>
                    <div className="mt-1 font-mono text-xs font-semibold text-slate-900">
                      {txn.txn_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Amount</div>
                    <div className="mt-1 font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {formatINR(txn.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Timestamp</div>
                    <div className="mt-1 font-mono text-xs text-slate-800 tabular-nums">
                      {formatDateTime(txn.txn_time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Merchant Category</div>
                    <div className="mt-1 text-xs font-medium text-slate-900">
                      {txn.merchant_category} ({txn.channel})
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500">Payee UPI ID</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {txn.payee_upi_id}
                      </span>
                      <PayeeBadge status={txn.payee_status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Model Scoring Breakdown */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Model Scoring Breakdown
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{score.model_version}</span>
                    <span aria-hidden="true">·</span>
                    <span>{score.score_id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-3.5 border border-slate-200 rounded-md">
                    <div className="text-xs text-slate-500">Risk Score</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span
                        className={`font-mono text-2xl font-bold tabular-nums ${
                          score.risk_score >= 85
                            ? 'text-red-700'
                            : score.risk_score >= 65
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {score.risk_score}
                      </span>
                      <span className="font-mono text-xs text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score.risk_score >= 85
                            ? 'bg-red-600'
                            : score.risk_score >= 65
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${score.risk_score}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-md">
                    <div className="text-xs text-slate-500">Model Decision</div>
                    <div className="mt-2">
                      <DecisionBadge decision={score.decision} />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Evaluated {formatTimeElapsed(score.scored_at)}
                    </div>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-md">
                    <div className="text-xs text-slate-500">Active Model Version</div>
                    <div className="mt-1.5 font-mono text-sm font-semibold text-slate-900">
                      {score.model_version}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {score.reason_codes.length} triggered signals
                    </div>
                  </div>
                </div>

                {/* Reason Codes Pills */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">
                    Triggered Reason Codes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {score.reason_codes.map((rc) => (
                      <div
                        key={rc.code}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border ${
                          rc.severity === 'high'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : rc.severity === 'medium'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="font-mono font-semibold">{rc.code}</span>
                        <span className="opacity-60">·</span>
                        <span>{rc.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collapsible Re-Scoring History Accordion */}
                {score.history.length > 0 && (
                  <div className="mt-4 border border-slate-200 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((prev) => !prev)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-medium text-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        {historyOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        Model Re-Scoring History ({score.history.length} versions evaluated)
                      </span>
                      <span className="font-mono text-slate-500">
                        {score.history[score.history.length - 1].risk_score} →{' '}
                        {score.history[0].risk_score}
                      </span>
                    </button>
                    {historyOpen && (
                      <div className="divide-y divide-slate-100 bg-white">
                        {score.history.map((h) => (
                          <div
                            key={h.model_version}
                            className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-semibold text-slate-900">
                                {h.model_version}
                              </span>
                              <DecisionBadge decision={h.decision} />
                              <span className="text-slate-500 font-mono tabular-nums">
                                {formatDateTime(h.scored_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                {h.reason_codes.map((r) => r.code).join(', ')}
                              </span>
                              <span className="font-mono font-bold text-slate-900 tabular-nums">
                                Score: {h.risk_score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Device & Mule-Ring Graph/Table */}
              {device && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      Device Fingerprint & Mule-Ring Linkage
                    </h3>
                    <span className="font-mono text-xs text-slate-500">
                      {device.customer_links.length} linked customer account
                      {device.customer_links.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Mule-Ring Warning Callout */}
                  {isMuleRingDevice && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
                      <div className="text-xs text-red-900">
                        <div className="font-semibold">
                          Mule-Ring Alert: Shared Device Detected Across{' '}
                          {device.customer_links.length} Distinct Customers
                        </div>
                        <p className="mt-0.5 text-red-800">
                          Device <span className="font-mono font-semibold">{device.device_hash}</span> and SIM{' '}
                          <span className="font-mono font-semibold">{device.sim_hash}</span> have authenticated multiple distinct accounts. Inspect linked profiles below before clearing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Device Metadata Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3.5 bg-slate-50/70 border border-slate-200 rounded-md text-xs">
                    <div>
                      <span className="text-slate-500 block">device_hash</span>
                      <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                        {device.device_hash}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Operating System & Model</span>
                      <span className="font-medium text-slate-900 mt-0.5 block">
                        {device.os}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">sim_hash</span>
                      <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                        {device.sim_hash}
                      </span>
                    </div>
                  </div>

                  {/* Visual Node Graph for Multi-Customer Devices + Linked Accounts Table */}
                  {isMuleRingDevice && (
                    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-3">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        Shared Hardware Topology
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="px-3.5 py-2.5 bg-slate-900 text-white rounded-md text-center shrink-0">
                          <div className="text-[11px] text-slate-300">Shared Device</div>
                          <div className="font-mono text-xs font-semibold mt-0.5">
                            {device.device_hash}
                          </div>
                          <div className="font-mono text-[11px] text-slate-300 mt-0.5">
                            {device.sim_hash}
                          </div>
                        </div>

                        <div className="hidden sm:block w-8 h-px bg-red-300 shrink-0" />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                          {device.customer_links.map((link) => {
                            const linkedCust = customers.find(
                              (c) => c.customer_id === link.customer_id
                            );
                            const isCurrent = link.customer_id === selectedAlert.customer_id;
                            return (
                              <div
                                key={link.customer_id}
                                className={`p-2.5 rounded-md border text-xs ${
                                  isCurrent
                                    ? 'bg-red-50 border-red-300'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <CustomerIdLink
                                    customerId={link.customer_id}
                                    onSelect={onOpenCustomer360}
                                  />
                                  {isCurrent && (
                                    <span className="text-[11px] font-medium text-red-700">
                                      Subject
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-slate-700 font-medium truncate">
                                  {linkedCust?.full_name}
                                </div>
                                <div className="mt-0.5 text-[11px] text-slate-500">
                                  {link.risk_flag}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Linked CUSTOMER_DEVICE Table */}
                  <div className="border border-slate-200 rounded-md overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                          <th className="py-2 px-3">Customer ID</th>
                          <th className="py-2 px-3">KYC Status</th>
                          <th className="py-2 px-3">First Used</th>
                          <th className="py-2 px-3">Last Used</th>
                          <th className="py-2 px-3">Device Risk Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {device.customer_links.map((link) => {
                          const linkedCust = customers.find(
                            (c) => c.customer_id === link.customer_id
                          );
                          return (
                            <tr key={link.customer_id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 whitespace-nowrap">
                                <CustomerIdLink
                                  customerId={link.customer_id}
                                  onSelect={onOpenCustomer360}
                                  sublabel={linkedCust?.full_name}
                                />
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {linkedCust && <KycBadge status={linkedCust.kyc_status} />}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                                {formatDateTime(link.first_used)}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                                {formatDateTime(link.last_used)}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {link.risk_flag === 'Clean' ? (
                                  <span className="text-emerald-700 font-medium">Clean</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    {link.risk_flag}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Analyst Action Bar */}
            <div className="sticky bottom-0 z-10 bg-slate-50 border-t border-slate-200 px-6 py-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                    Fraud Determination:
                  </span>
                  <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setConfirmedFraud(true)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                        confirmedFraud === true
                          ? 'bg-red-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Confirmed Fraud (True)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmedFraud(false)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                        confirmedFraud === false
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      False Positive (False)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedAlert.status !== 'In Review' &&
                    selectedAlert.status !== 'Resolved' && (
                      <button
                        type="button"
                        onClick={() => handleActionSubmit('In Review')}
                        className="px-3.5 py-2 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Mark In Review
                      </button>
                    )}
                  <button
                    type="button"
                    disabled={confirmedFraud === null}
                    onClick={() => handleActionSubmit('Resolved')}
                    className={`px-4 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      confirmedFraud === null
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                    }`}
                  >
                    {selectedAlert.status === 'Resolved'
                      ? 'Update Resolution'
                      : 'Close & Resolve Alert'}
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add investigation notes (e.g., confirmed SIM swap with customer, froze mule wallet)..."
                  aria-label="Analyst investigation notes"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-sm text-slate-500">
            Select an alert from the queue to inspect transaction and device telemetry.
          </div>
        )}
      </section>
    </div>
  );
};
