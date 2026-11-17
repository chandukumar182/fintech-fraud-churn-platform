import React, { useMemo, useState } from 'react';
import {
  Account,
  ChurnScore,
  Customer,
  RetentionAction,
  RetentionOutcome,
  RiskBand,
} from '../types/risk';
import { formatDateTime, formatINR } from '../utils/formatters';
import {
  CustomerIdLink,
  KycBadge,
  OutcomeBadge,
  RiskBandBadge,
} from './StatusBadge';
import {
  ArrowUpDown,
  MessageSquarePlus,
  Search,
  Send,
} from 'lucide-react';

interface ChurnRetentionHubProps {
  customers: Customer[];
  accounts: Account[];
  churnScores: ChurnScore[];
  retentionActions: RetentionAction[];
  selectedChurnId: string;
  onSelectChurnId: (churnId: string) => void;
  onOpenCustomer360: (customerId: string) => void;
  onOpenTriggerModal: (churnId: string) => void;
  onUpdateActionOutcome: (actionId: string, outcome: RetentionOutcome) => void;
}

export const ChurnRetentionHub: React.FC<ChurnRetentionHubProps> = ({
  customers,
  accounts,
  churnScores,
  retentionActions,
  selectedChurnId,
  onSelectChurnId,
  onOpenCustomer360,
  onOpenTriggerModal,
  onUpdateActionOutcome,
}) => {
  const [bandFilter, setBandFilter] = useState<'All' | RiskBand>('All');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'churn_prob' | 'balance'>('churn_prob');
  const [sortDesc, setSortDesc] = useState(true);

  const enrichedRows = useMemo(() => {
    return churnScores
      .map((score) => {
        const customer = customers.find((c) => c.customer_id === score.customer_id);
        const totalBalance = accounts
          .filter((a) => a.customer_id === score.customer_id)
          .reduce((sum, a) => sum + a.balance, 0);
        const actions = retentionActions.filter(
          (r) => r.customer_id === score.customer_id
        );
        return {
          score,
          customer,
          totalBalance,
          actions,
        };
      })
      .filter((row) => {
        if (!row.customer) return false;
        if (bandFilter !== 'All' && row.score.risk_band !== bandFilter) return false;
        if (segmentFilter !== 'ALL' && row.customer.segment !== segmentFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const match =
            row.customer.customer_id.toLowerCase().includes(q) ||
            row.customer.full_name.toLowerCase().includes(q) ||
            row.score.top_drivers.some((d) => d.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = sortBy === 'churn_prob' ? a.score.churn_prob : a.totalBalance;
        const valB = sortBy === 'churn_prob' ? b.score.churn_prob : b.totalBalance;
        return sortDesc ? valB - valA : valA - valB;
      });
  }, [
    churnScores,
    customers,
    accounts,
    retentionActions,
    bandFilter,
    segmentFilter,
    searchQuery,
    sortBy,
    sortDesc,
  ]);

  const activeChurn =
    churnScores.find((c) => c.churn_id === selectedChurnId) ??
    enrichedRows[0]?.score ??
    churnScores[0];

  const activeCustomer = customers.find(
    (c) => c.customer_id === activeChurn?.customer_id
  );

  const activeActions = useMemo(() => {
    if (!activeChurn) return [];
    return retentionActions
      .filter(
        (r) =>
          r.churn_id === activeChurn.churn_id ||
          r.customer_id === activeChurn.customer_id
      )
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  }, [retentionActions, activeChurn]);

  const toggleSort = (col: 'churn_prob' | 'balance') => {
    if (sortBy === col) {
      setSortDesc((prev) => !prev);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* Left/Main: At-Risk Customer Table */}
      <section className="xl:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                At-Risk Customer Cohort
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranked by predicted 30-day churn probability and behavioral attrition drivers
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {enrichedRows.length} customers shown
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer_id, name, or churn driver..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Risk Band Filter */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200 shrink-0">
              {(['All', 'High', 'Medium', 'Low'] as const).map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setBandFilter(band)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                    bandFilter === band
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>

            {/* Segment Filter */}
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              aria-label="Filter by customer segment"
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shrink-0"
            >
              <option value="ALL">All Segments</option>
              <option value="Salaried Prime">Salaried Prime</option>
              <option value="Micro-Merchant">Micro-Merchant</option>
              <option value="Gig Economy">Gig Economy</option>
              <option value="New-to-Credit">New-to-Credit</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4 whitespace-nowrap">Customer</th>
                <th className="py-2.5 px-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('churn_prob')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    Churn Prob
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-2.5 px-4 whitespace-nowrap">Segment</th>
                <th className="py-2.5 px-4 whitespace-nowrap">KYC Status</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('balance')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer ml-auto"
                  >
                    Balance
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-2.5 px-4 whitespace-nowrap">Top Drivers</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {enrichedRows.map(({ score, customer, totalBalance }) => {
                if (!customer) return null;
                const isSelected = activeChurn?.churn_id === score.churn_id;
                return (
                  <tr
                    key={score.churn_id}
                    onClick={() => onSelectChurnId(score.churn_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CustomerIdLink
                        customerId={customer.customer_id}
                        onSelect={onOpenCustomer360}
                      />
                      <div className="text-slate-500 mt-0.5">
                        {customer.full_name} · {customer.city}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            score.risk_band === 'High'
                              ? 'text-red-700'
                              : score.risk_band === 'Medium'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {score.churn_prob.toFixed(1)}%
                        </span>
                        <RiskBandBadge band={score.risk_band} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {customer.segment}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <KycBadge status={customer.kyc_status} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatINR(totalBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {score.top_drivers.map((driver) => (
                          <span
                            key={driver}
                            className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] whitespace-nowrap"
                          >
                            {driver}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChurnId(score.churn_id);
                          onOpenTriggerModal(score.churn_id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-3 h-3" />
                        Trigger
                      </button>
                    </td>
                  </tr>
                );
              })}

              {enrichedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-500">
                    No customers match the selected risk band or segment filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right Split Panel: Retention Campaign Tracker */}
      <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
        {activeChurn && activeCustomer ? (
          <>
            <div className="p-5 border-b border-slate-200 bg-slate-50/60">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Retention Campaign Tracker
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <CustomerIdLink
                      customerId={activeCustomer.customer_id}
                      onSelect={onOpenCustomer360}
                      sublabel={activeCustomer.full_name}
                    />
                  </div>
                </div>
                <RiskBandBadge band={activeChurn.risk_band} />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Churn ID: </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {activeChurn.churn_id}
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-900 tabular-nums">
                  {activeChurn.churn_prob.toFixed(1)}% prob
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenTriggerModal(activeChurn.churn_id)}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Dispatch New Retention Action
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-900">
                  Outreach History ({activeActions.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Linked to {activeChurn.churn_id}
                </span>
              </div>

              <div className="space-y-3">
                {activeActions.map((act) => (
                  <div
                    key={act.action_id}
                    className="p-3.5 border border-slate-200 rounded-md bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {act.action_type}
                      </span>
                      <OutcomeBadge outcome={act.outcome} />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{act.action_id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{act.channel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatDateTime(act.sent_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {act.offer_detail}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        Update outcome:
                      </span>
                      <select
                        value={act.outcome}
                        onChange={(e) =>
                          onUpdateActionOutcome(
                            act.action_id,
                            e.target.value as RetentionOutcome
                          )
                        }
                        aria-label={`Update outcome for ${act.action_id}`}
                        className="px-2 py-1 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Converted">Converted</option>
                        <option value="Ignored">Ignored</option>
                        <option value="Churned">Churned</option>
                      </select>
                    </div>
                  </div>
                ))}

                {activeActions.length === 0 && (
                  <div className="p-6 border border-dashed border-slate-200 rounded-md text-center text-xs text-slate-500">
                    No retention actions dispatched yet for {activeCustomer.customer_id}.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            Select a customer row to view linked retention campaigns.
          </div>
        )}
      </aside>
    </div>
  );
};
