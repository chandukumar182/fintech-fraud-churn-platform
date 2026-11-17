import React, { useMemo } from 'react';
import {
  Account,
  ChurnScore,
  Customer,
  FraudAlert,
  FraudScore,
  JointRiskTrendPoint,
  Loan,
  Transaction,
} from '../types/risk';
import { formatINR, formatTimeElapsed } from '../utils/formatters';
import { JointRiskChart } from './JointRiskChart';
import {
  AlertStatusBadge,
  CustomerIdLink,
  RiskBandBadge,
} from './StatusBadge';
import { ArrowRight, ShieldAlert, TrendingDown } from 'lucide-react';

interface ExecutiveOverviewProps {
  customers: Customer[];
  accounts: Account[];
  alerts: FraudAlert[];
  transactions: Transaction[];
  fraudScores: FraudScore[];
  churnScores: ChurnScore[];
  loans: Loan[];
  trendData: JointRiskTrendPoint[];
  onOpenCustomer360: (customerId: string) => void;
  onInspectAlert: (alertId: string) => void;
  onOpenChurnHub: (churnId: string) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  customers,
  accounts,
  alerts,
  transactions,
  fraudScores,
  churnScores,
  loans,
  trendData,
  onOpenCustomer360,
  onInspectAlert,
  onOpenChurnHub,
}) => {
  const openFraudAlerts = useMemo(
    () => alerts.filter((a) => a.status === 'Open' || a.status === 'In Review'),
    [alerts]
  );

  const openOnlyCount = useMemo(
    () => alerts.filter((a) => a.status === 'Open').length,
    [alerts]
  );

  const openExposureAmount = useMemo(() => {
    return openFraudAlerts.reduce((acc, alert) => {
      const txn = transactions.find((t) => t.txn_id === alert.txn_id);
      return acc + (txn?.amount ?? 0);
    }, 0);
  }, [openFraudAlerts, transactions]);

  const highRiskChurnList = useMemo(
    () => churnScores.filter((c) => c.risk_band === 'High'),
    [churnScores]
  );

  const activeLoanPortfolio = useMemo(() => {
    // Baseline portfolio + live sample loans
    const sampleOutstanding = loans
      .filter((l) => l.status !== 'Closed')
      .reduce((sum, l) => sum + l.outstanding_principal, 0);
    return 428_000_000 + sampleOutstanding;
  }, [loans]);

  const activeUpiAccountsTotal = useMemo(() => {
    const activeSample = accounts.filter((a) => a.status === 'Active').length;
    return 148_910 + activeSample;
  }, [accounts]);

  // Combined Live High-Priority Queue (unreviewed fraud alerts + high-risk churn triggers)
  const priorityQueue = useMemo(() => {
    const fraudRows = openFraudAlerts.map((alert) => {
      const txn = transactions.find((t) => t.txn_id === alert.txn_id);
      const score = fraudScores.find((s) => s.txn_id === alert.txn_id);
      const customer = customers.find((c) => c.customer_id === alert.customer_id);
      return {
        id: alert.alert_id,
        kind: 'fraud' as const,
        customer_id: alert.customer_id,
        customer_name: customer?.full_name ?? '',
        scoreLabel: `${score?.risk_score ?? 0} / 100`,
        scoreNumeric: score?.risk_score ?? 0,
        amountOrBalance: txn?.amount ?? 0,
        primarySignal: score?.reason_codes[0]?.label ?? 'Transaction Anomaly',
        ageIso: alert.opened_at,
        statusElement: <AlertStatusBadge status={alert.status} />,
      };
    });

    const churnRows = highRiskChurnList.map((churn) => {
      const customer = customers.find((c) => c.customer_id === churn.customer_id);
      const totalBal = accounts
        .filter((a) => a.customer_id === churn.customer_id)
        .reduce((s, a) => s + a.balance, 0);
      return {
        id: churn.churn_id,
        kind: 'churn' as const,
        customer_id: churn.customer_id,
        customer_name: customer?.full_name ?? '',
        scoreLabel: `${churn.churn_prob.toFixed(1)}%`,
        scoreNumeric: churn.churn_prob,
        amountOrBalance: totalBal,
        primarySignal: churn.top_drivers[0] ?? 'Churn Risk Elevated',
        ageIso: churn.scored_at,
        statusElement: <RiskBandBadge band={churn.risk_band} />,
      };
    });

    return [...fraudRows, ...churnRows].sort((a, b) => b.scoreNumeric - a.scoreNumeric);
  }, [openFraudAlerts, highRiskChurnList, transactions, fraudScores, customers, accounts]);

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <section aria-label="Key Risk & Portfolio Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Active UPI Accounts
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {activeUpiAccountsTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded tabular-nums">
              +3.4% 7d
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            98.6% KYC verified · UPI Lite enabled
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Flagged Fraud Alerts (Open)
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-red-700 tabular-nums">
              {openOnlyCount}
            </span>
            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded tabular-nums">
              {openFraudAlerts.length} active queue
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            {formatINR(openExposureAmount)} exposed across unreviewed txns
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            High-Risk Churn Customers
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-amber-700 tabular-nums">
              {(1243 + highRiskChurnList.length).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded tabular-nums">
              6.8% of borrowers
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {highRiskChurnList.length} priority accounts in active cohort
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">
            Active Loan Portfolio Value
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {formatINR(activeLoanPortfolio, true)}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded tabular-nums">
              97.2% current
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            2.8% DPD 1–30 · Micro-Merchant & Salary lines
          </div>
        </div>
      </section>

      {/* Dual-Axis Joint Risk Trend Chart */}
      <JointRiskChart data={trendData} />

      {/* Live High-Priority Queue */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Live High-Priority Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Most urgent unreviewed fraud alerts and post-friction churn triggers sorted by severity
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {priorityQueue.length} items requiring action
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4 whitespace-nowrap">Queue ID</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Signal Type</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Customer</th>
                <th className="py-2.5 px-4 whitespace-nowrap">State</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Risk / Prob</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Exposure / Bal</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Primary Driver</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Elapsed</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {priorityQueue.map((row) => (
                <tr
                  key={`${row.kind}-${row.id}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                    {row.id}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {row.kind === 'fraud' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        Fraud Alert
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                        Churn Trigger
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <CustomerIdLink
                      customerId={row.customer_id}
                      onSelect={onOpenCustomer360}
                      sublabel={row.customer_name}
                    />
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">{row.statusElement}</td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${
                      row.kind === 'fraud' ? 'text-red-700' : 'text-amber-800'
                    }`}
                  >
                    {row.scoreLabel}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                    {formatINR(row.amountOrBalance)}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600 max-w-[260px] truncate">
                    {row.primarySignal}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {formatTimeElapsed(row.ageIso)}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    {row.kind === 'fraud' ? (
                      <button
                        type="button"
                        onClick={() => onInspectAlert(row.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-900 bg-white border border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Investigate
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenChurnHub(row.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Retain
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {priorityQueue.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-slate-500">
                    All high-priority fraud alerts and churn triggers have been cleared.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
