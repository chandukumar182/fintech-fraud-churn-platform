import React, { useMemo, useState } from 'react';
import {
  Account,
  ChurnScore,
  Customer,
  DeviceRecord,
  FraudAlert,
  FraudScore,
  Loan,
  Repayment,
  RetentionAction,
  Transaction,
} from '../types/risk';
import {
  formatDateTime,
  formatINR,
  formatShortDate,
} from '../utils/formatters';
import {
  AccountStatusBadge,
  CustomerIdLink,
  DecisionBadge,
  KycBadge,
  OutcomeBadge,
  PayeeBadge,
  RiskBandBadge,
} from './StatusBadge';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Send,
  ShieldAlert,
  Smartphone,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';

interface Customer360ProfileProps {
  customer: Customer;
  allCustomers: Customer[];
  accounts: Account[];
  devices: DeviceRecord[];
  loans: Loan[];
  repayments: Repayment[];
  transactions: Transaction[];
  fraudScores: FraudScore[];
  fraudAlerts: FraudAlert[];
  churnScores: ChurnScore[];
  retentionActions: RetentionAction[];
  onSelectCustomer: (customerId: string) => void;
  onInspectAlert: (alertId: string) => void;
  onOpenTriggerModal: (churnId: string) => void;
  onClose?: () => void;
  isDrawer?: boolean;
}

type ProfileTab = 'accounts' | 'lending' | 'timeline';

export const Customer360Profile: React.FC<Customer360ProfileProps> = ({
  customer,
  allCustomers,
  accounts,
  devices,
  loans,
  repayments,
  transactions,
  fraudScores,
  fraudAlerts,
  churnScores,
  retentionActions,
  onSelectCustomer,
  onInspectAlert,
  onOpenTriggerModal,
  onClose,
  isDrawer = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('accounts');
  const [timelineFilter, setTimelineFilter] = useState<
    'all' | 'txn' | 'fraud' | 'retention'
  >('all');

  const customerAccounts = useMemo(
    () => accounts.filter((a) => a.customer_id === customer.customer_id),
    [accounts, customer.customer_id]
  );

  const totalBalance = useMemo(
    () => customerAccounts.reduce((s, a) => s + a.balance, 0),
    [customerAccounts]
  );

  const customerDevices = useMemo(() => {
    return devices
      .map((d) => {
        const link = d.customer_links.find(
          (l) => l.customer_id === customer.customer_id
        );
        if (!link) return null;
        return {
          device: d,
          link,
          sharedCount: d.customer_links.length,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [devices, customer.customer_id]);

  const customerLoans = useMemo(
    () => loans.filter((l) => l.customer_id === customer.customer_id),
    [loans, customer.customer_id]
  );

  const latestChurn = useMemo(
    () => churnScores.find((c) => c.customer_id === customer.customer_id),
    [churnScores, customer.customer_id]
  );

  const customerAlerts = useMemo(
    () => fraudAlerts.filter((a) => a.customer_id === customer.customer_id),
    [fraudAlerts, customer.customer_id]
  );

  // Unified Chronological Risk Timeline
  const timelineEvents = useMemo(() => {
    const events: {
      id: string;
      kind: 'txn' | 'fraud' | 'retention';
      timestamp: string;
      title: string;
      subtitle: string;
      badge?: React.ReactNode;
      meta?: string;
    }[] = [];

    const custTxns = transactions.filter(
      (t) => t.customer_id === customer.customer_id
    );

    custTxns.forEach((txn) => {
      events.push({
        id: `txn-${txn.txn_id}`,
        kind: 'txn',
        timestamp: txn.txn_time,
        title: `${txn.channel} · ${formatINR(txn.amount)} to ${txn.payee_upi_id}`,
        subtitle: `${txn.txn_id} · ${txn.merchant_category}`,
        badge: <PayeeBadge status={txn.payee_status} />,
      });

      const score = fraudScores.find((s) => s.txn_id === txn.txn_id);
      if (score) {
        const linkedAlert = fraudAlerts.find((a) => a.txn_id === txn.txn_id);
        events.push({
          id: `fraud-${score.score_id}`,
          kind: 'fraud',
          timestamp: score.scored_at,
          title: `Fraud Score Spike: ${score.risk_score} / 100 (${score.model_version})`,
          subtitle: score.reason_codes.map((r) => r.label).join(' · '),
          badge: <DecisionBadge decision={score.decision} />,
          meta: linkedAlert ? linkedAlert.alert_id : undefined,
        });
      }
    });

    if (latestChurn) {
      events.push({
        id: `churn-${latestChurn.churn_id}`,
        kind: 'retention',
        timestamp: latestChurn.scored_at,
        title: `Churn Evaluation: ${latestChurn.churn_prob.toFixed(1)}% Probability`,
        subtitle: `Drivers: ${latestChurn.top_drivers.join(' · ')}`,
        badge: <RiskBandBadge band={latestChurn.risk_band} />,
      });
    }

    retentionActions
      .filter((r) => r.customer_id === customer.customer_id)
      .forEach((act) => {
        events.push({
          id: `ret-${act.action_id}`,
          kind: 'retention',
          timestamp: act.sent_at,
          title: `Retention Action: ${act.action_type} via ${act.channel}`,
          subtitle: act.offer_detail,
          badge: <OutcomeBadge outcome={act.outcome} />,
        });
      });

    return events
      .filter((e) => timelineFilter === 'all' || e.kind === timelineFilter)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [
    transactions,
    fraudScores,
    fraudAlerts,
    latestChurn,
    retentionActions,
    customer.customer_id,
    timelineFilter,
  ]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {customer.full_name}
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                {customer.customer_id}
              </span>
              <KycBadge status={customer.kyc_status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
              <span>{customer.city}</span>
              <span aria-hidden="true">·</span>
              <span>{customer.segment}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Signed up {formatShortDate(customer.signup_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isDrawer && (
              <select
                value={customer.customer_id}
                onChange={(e) => onSelectCustomer(e.target.value)}
                aria-label="Switch Customer 360 profile"
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {allCustomers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_id} · {c.full_name}
                  </option>
                ))}
              </select>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                aria-label="Close Customer 360 drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Summary Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-md">
            <div className="text-[11px] text-slate-500">Total UPI Balance</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
              {formatINR(totalBalance)}
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-md">
            <div className="text-[11px] text-slate-500">Active Loans</div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
              {customerLoans.filter((l) => l.status !== 'Closed').length}
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-md">
            <div className="text-[11px] text-slate-500">Fraud Alerts</div>
            <div className="mt-0.5 flex items-center justify-between gap-1">
              <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                {customerAlerts.length}
              </span>
              {customerAlerts[0] && (
                <button
                  type="button"
                  onClick={() => onInspectAlert(customerAlerts[0].alert_id)}
                  className="text-[11px] font-medium text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  Inspect <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-md">
            <div className="text-[11px] text-slate-500">Churn Risk</div>
            <div className="mt-0.5 flex items-center justify-between gap-1">
              <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                {latestChurn ? `${latestChurn.churn_prob.toFixed(1)}%` : 'N/A'}
              </span>
              {latestChurn && (
                <button
                  type="button"
                  onClick={() => onOpenTriggerModal(latestChurn.churn_id)}
                  className="text-[11px] font-medium text-amber-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Send className="w-2.5 h-2.5" /> Retain
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1 border-b border-slate-200 -mb-5 pb-0">
          {(
            [
              { id: 'accounts', label: 'UPI Accounts & Devices', icon: Wallet },
              { id: 'lending', label: 'Lending & Repayment', icon: CreditCard },
              { id: 'timeline', label: 'Risk Timeline', icon: Activity },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: UPI Accounts & Devices */}
        {activeTab === 'accounts' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                UPI & Wallet Accounts ({customerAccounts.length})
              </h3>
              <div className="border border-slate-200 rounded-md overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <th className="py-2.5 px-3.5">Account ID</th>
                      <th className="py-2.5 px-3.5">UPI ID</th>
                      <th className="py-2.5 px-3.5">Account Type</th>
                      <th className="py-2.5 px-3.5 text-right">Balance</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerAccounts.map((acc) => (
                      <tr key={acc.account_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {acc.account_id}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-800 whitespace-nowrap">
                          {acc.upi_id}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                          {acc.account_type}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatINR(acc.balance)}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <AccountStatusBadge status={acc.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-500" />
                Linked Device History ({customerDevices.length})
              </h3>
              <div className="border border-slate-200 rounded-md overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <th className="py-2.5 px-3.5">device_hash</th>
                      <th className="py-2.5 px-3.5">OS & Hardware</th>
                      <th className="py-2.5 px-3.5">First Used</th>
                      <th className="py-2.5 px-3.5">Last Used</th>
                      <th className="py-2.5 px-3.5">Risk Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerDevices.map(({ device, link, sharedCount }) => (
                      <tr key={device.device_hash} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {device.device_hash}
                          {sharedCount > 1 && (
                            <span className="ml-2 text-[11px] font-sans font-medium text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              {sharedCount} accounts
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                          {device.os}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {formatDateTime(link.first_used)}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {formatDateTime(link.last_used)}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          {link.risk_flag === 'Clean' ? (
                            <span className="text-emerald-700 font-medium">Clean</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              {link.risk_flag}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show co-linked customers if device is shared */}
              {customerDevices.some((d) => d.sharedCount > 1) && (
                <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-900">
                  <div className="font-semibold">Co-Linked Accounts on Shared Device</div>
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {customerDevices
                      .flatMap((d) => d.device.customer_links)
                      .filter((l) => l.customer_id !== customer.customer_id)
                      .map((other) => (
                        <CustomerIdLink
                          key={other.customer_id}
                          customerId={other.customer_id}
                          onSelect={onSelectCustomer}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: Lending & Repayment */}
        {activeTab === 'lending' && (
          <div className="space-y-6">
            {customerLoans.length > 0 ? (
              customerLoans.map((loan) => {
                const loanRepayments = repayments
                  .filter((r) => r.loan_id === loan.loan_id)
                  .sort((a, b) => a.installment_no - b.installment_no);

                return (
                  <div
                    key={loan.loan_id}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {loan.loan_id}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            · {loan.product_name}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
                          <span>Principal: {formatINR(loan.principal)}</span>
                          <span>·</span>
                          <span>APR: {loan.interest_rate}%</span>
                          <span>·</span>
                          <span>Tenure: {loan.tenure_months}m</span>
                          <span>·</span>
                          <span>
                            Outstanding: {formatINR(loan.outstanding_principal)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          loan.status === 'Overdue'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : loan.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 text-slate-500 font-medium">
                            <th className="py-2 px-3.5">EMI #</th>
                            <th className="py-2 px-3.5">Due Date</th>
                            <th className="py-2 px-3.5">Paid Date</th>
                            <th className="py-2 px-3.5 text-right">Amount Due</th>
                            <th className="py-2 px-3.5 text-right">Amount Paid</th>
                            <th className="py-2 px-3.5 text-right">Delay Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loanRepayments.map((rep) => (
                            <tr key={rep.repayment_id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3.5 font-mono text-slate-900">
                                #{rep.installment_no}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                                {formatShortDate(rep.due_date)}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                                {rep.paid_date ? formatShortDate(rep.paid_date) : 'Unpaid'}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                                {formatINR(rep.amount_due)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                                {formatINR(rep.amount_paid)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                {rep.delay_days > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-red-50 text-red-700 border border-red-200">
                                    +{rep.delay_days}d delay
                                  </span>
                                ) : rep.paid_date ? (
                                  <span className="text-emerald-700 font-medium">
                                    On time
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Scheduled</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded-md text-center text-xs text-slate-500">
                This customer currently has no active or historical loan facilities.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Risk Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Unified Risk & Retention Timeline
              </h3>
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200">
                {(
                  [
                    { id: 'all', label: 'All Events' },
                    { id: 'txn', label: 'Transactions' },
                    { id: 'fraud', label: 'Fraud Scores' },
                    { id: 'retention', label: 'Churn & Retention' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTimelineFilter(f.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                      timelineFilter === f.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
              {timelineEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50/60"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                        ev.kind === 'fraud'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : ev.kind === 'retention'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ev.kind === 'fraud' ? (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      ) : ev.kind === 'retention' ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <Activity className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        {ev.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {ev.subtitle}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {ev.badge}
                        {ev.meta && (
                          <button
                            type="button"
                            onClick={() => onInspectAlert(ev.meta!)}
                            className="text-[11px] font-mono font-medium text-blue-700 hover:underline cursor-pointer"
                          >
                            Open {ev.meta}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                    {formatDateTime(ev.timestamp)}
                  </div>
                </div>
              ))}

              {timelineEvents.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  No timeline events recorded for this filter.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
