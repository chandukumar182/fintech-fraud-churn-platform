import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  AccountStatus,
  AlertStatus,
  FraudDecision,
  KycStatus,
  PayeeFlagStatus,
  RetentionOutcome,
  RiskBand,
} from '../types/risk';

interface CustomerIdLinkProps {
  customerId: string;
  onSelect: (customerId: string) => void;
  sublabel?: string;
}

export const CustomerIdLink: React.FC<CustomerIdLinkProps> = ({
  customerId,
  onSelect,
  sublabel,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(customerId);
      }}
      className="group inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-900 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded px-1 -mx-1 transition-colors cursor-pointer whitespace-nowrap"
      title={`Open Customer 360° profile for ${customerId}`}
    >
      <span className="underline decoration-slate-300 group-hover:decoration-blue-600 underline-offset-2">
        {customerId}
      </span>
      <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      {sublabel && (
        <span className="font-sans font-normal text-slate-500 ml-1 no-underline">
          {sublabel}
        </span>
      )}
    </button>
  );
};

export const AlertStatusBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  if (status === 'Open') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shrink-0">
        <ShieldAlert className="w-3 h-3 shrink-0" />
        Open
      </span>
    );
  }
  if (status === 'In Review') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shrink-0">
        <Clock className="w-3 h-3 shrink-0" />
        In Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
      <CheckCircle2 className="w-3 h-3 shrink-0" />
      Resolved
    </span>
  );
};

export const DecisionBadge: React.FC<{ decision: FraudDecision }> = ({ decision }) => {
  switch (decision) {
    case 'BLOCK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
          <XCircle className="w-3 h-3" />
          BLOCK
        </span>
      );
    case 'REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3" />
          REVIEW
        </span>
      );
    case 'STEP_UP_OTP':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 whitespace-nowrap">
          STEP_UP_OTP
        </span>
      );
    case 'ALLOW':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <ShieldCheck className="w-3 h-3" />
          ALLOW
        </span>
      );
  }
};

export const PayeeBadge: React.FC<{ status: PayeeFlagStatus }> = ({ status }) => {
  if (status === 'flagged') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        <ShieldAlert className="w-3 h-3" />
        Flagged Payee
      </span>
    );
  }
  if (status === 'first_seen') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        <AlertTriangle className="w-3 h-3" />
        First-Seen Payee
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
      <ShieldCheck className="w-3 h-3" />
      Verified Merchant
    </span>
  );
};

export const RiskBandBadge: React.FC<{ band: RiskBand }> = ({ band }) => {
  if (band === 'High') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        High Risk
      </span>
    );
  }
  if (band === 'Medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        Medium Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
      Low Risk
    </span>
  );
};

export const KycBadge: React.FC<{ status: KycStatus }> = ({ status }) => {
  if (status === 'Full KYC') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />
        Full KYC
      </span>
    );
  }
  if (status === 'Re-KYC Required') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        <AlertTriangle className="w-3 h-3" />
        Re-KYC Required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
      Min KYC
    </span>
  );
};

export const AccountStatusBadge: React.FC<{ status: AccountStatus }> = ({ status }) => {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        Active
      </span>
    );
  }
  if (status === 'Debit Blocked') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
        Debit Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
      Frozen
    </span>
  );
};

export const OutcomeBadge: React.FC<{ outcome: RetentionOutcome }> = ({ outcome }) => {
  switch (outcome) {
    case 'Converted':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3" />
          Converted
        </span>
      );
    case 'Ignored':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          Ignored
        </span>
      );
    case 'Churned':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
          <XCircle className="w-3 h-3" />
          Churned
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
  }
};
