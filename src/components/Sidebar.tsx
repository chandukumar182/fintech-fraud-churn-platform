import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  TrendingDown,
  UserCheck,
  Landmark,
} from 'lucide-react';
import { Analyst, NavView } from '../types/risk';

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  openAlertsCount: number;
  highChurnCount: number;
  analysts: Analyst[];
  activeAnalystId: string;
  onChangeAnalyst: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  openAlertsCount,
  highChurnCount,
  analysts,
  activeAnalystId,
  onChangeAnalyst,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems: {
    id: NavView;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    countTone?: 'red' | 'amber';
  }[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'fraud',
      label: 'Fraud Investigation',
      icon: ShieldAlert,
      count: openAlertsCount,
      countTone: 'red',
    },
    {
      id: 'churn',
      label: 'Churn & Retention',
      icon: TrendingDown,
      count: highChurnCount,
      countTone: 'amber',
    },
    {
      id: 'customer360',
      label: 'Customer 360°',
      icon: UserCheck,
    },
  ];

  const activeAnalyst = analysts.find((a) => a.analyst_id === activeAnalystId) ?? analysts[0];

  const content = (
    <div className="flex flex-col h-full w-64 bg-white border-r border-slate-200 select-none">
      {/* Brand Lockup */}
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-slate-200 shrink-0">
        <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shrink-0">
          <Landmark className="w-4 h-4" />
        </div>
        <span className="font-display font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
          KayaPay Ops
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
        <div className="px-2.5 pb-1.5 text-xs font-medium text-slate-400">
          Operations Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`font-mono tabular-nums text-xs px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : item.countTone === 'red'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Analyst Context */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <label
          htmlFor="active-analyst-select"
          className="block text-xs font-medium text-slate-500 mb-1.5"
        >
          Signed-in Analyst
        </label>
        <select
          id="active-analyst-select"
          value={activeAnalystId}
          onChange={(e) => onChangeAnalyst(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
        >
          {analysts.map((analyst) => (
            <option key={analyst.analyst_id} value={analyst.analyst_id}>
              {analyst.name} ({analyst.analyst_id})
            </option>
          ))}
        </select>
        <div className="mt-1.5 text-xs text-slate-500 truncate">
          {activeAnalyst.role}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">{content}</aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
};
