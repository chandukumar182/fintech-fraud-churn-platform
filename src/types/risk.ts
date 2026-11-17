export type NavView = 'overview' | 'fraud' | 'churn' | 'customer360';

export type KycStatus = 'Full KYC' | 'Min KYC' | 'Re-KYC Required';
export type CustomerSegment =
  | 'Salaried Prime'
  | 'Gig Economy'
  | 'Micro-Merchant'
  | 'New-to-Credit';

export type AccountStatus = 'Active' | 'Frozen' | 'Debit Blocked';
export type AccountType = 'Primary Savings' | 'UPI Lite Wallet' | 'Merchant Settlement';

export type AlertStatus = 'Open' | 'In Review' | 'Resolved';
export type PayeeFlagStatus = 'flagged' | 'first_seen' | 'verified';
export type FraudDecision = 'BLOCK' | 'STEP_UP_OTP' | 'REVIEW' | 'ALLOW';
export type RiskBand = 'High' | 'Medium' | 'Low';

export type RetentionActionType =
  | 'Cashback Offer'
  | 'Fee Waiver'
  | 'Support Call'
  | 'EMI Grace Window'
  | 'KYC Concierge';

export type RetentionChannel = 'Push' | 'SMS' | 'WhatsApp' | 'Outbound Voice';
export type RetentionOutcome = 'Converted' | 'Ignored' | 'Churned' | 'Pending';

export interface Customer {
  customer_id: string;
  full_name: string; // pseudonymized
  city: string;
  kyc_status: KycStatus;
  segment: CustomerSegment;
  signup_date: string;
}

export interface Account {
  account_id: string;
  customer_id: string;
  upi_id: string;
  account_type: AccountType;
  balance: number;
  status: AccountStatus;
}

export interface CustomerDeviceLink {
  customer_id: string;
  first_used: string;
  last_used: string;
  risk_flag: 'Clean' | 'Shared Mule Risk' | 'SIM Swap' | 'Emulator';
}

export interface DeviceRecord {
  device_hash: string;
  os: string;
  sim_hash: string;
  customer_links: CustomerDeviceLink[];
}

export interface Transaction {
  txn_id: string;
  customer_id: string;
  account_id: string;
  amount: number;
  txn_time: string;
  channel: 'UPI P2P' | 'UPI Intent' | 'IMPS Payout' | 'QR Collect';
  merchant_category: string;
  payee_upi_id: string;
  payee_status: PayeeFlagStatus;
  device_hash: string;
}

export interface ReasonCodeDetail {
  code: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
}

export interface FraudScoreVersion {
  model_version: string;
  scored_at: string;
  risk_score: number;
  decision: FraudDecision;
  reason_codes: ReasonCodeDetail[];
}

export interface FraudScore {
  score_id: string;
  txn_id: string;
  risk_score: number;
  decision: FraudDecision;
  model_version: string;
  scored_at: string;
  reason_codes: ReasonCodeDetail[];
  history: FraudScoreVersion[];
}

export interface FraudAlert {
  alert_id: string;
  txn_id: string;
  customer_id: string;
  status: AlertStatus;
  analyst_id: string | null;
  opened_at: string;
  resolved_at: string | null;
  confirmed_fraud: boolean | null;
  notes: string;
}

export interface ChurnScore {
  churn_id: string;
  customer_id: string;
  churn_prob: number; // 0 to 100
  risk_band: RiskBand;
  top_drivers: string[];
  scored_at: string;
  linked_fraud_txn_id?: string;
}

export interface RetentionAction {
  action_id: string;
  churn_id: string;
  customer_id: string;
  action_type: RetentionActionType;
  channel: RetentionChannel;
  sent_at: string;
  outcome: RetentionOutcome;
  offer_detail: string;
}

export interface Loan {
  loan_id: string;
  customer_id: string;
  product_name: string;
  principal: number;
  outstanding_principal: number;
  interest_rate: number;
  tenure_months: number;
  status: 'Active' | 'Overdue' | 'Closed';
  disbursed_at: string;
}

export interface Repayment {
  repayment_id: string;
  loan_id: string;
  installment_no: number;
  due_date: string;
  paid_date: string | null;
  amount_due: number;
  amount_paid: number;
  delay_days: number;
}

export interface JointRiskTrendPoint {
  date: string;
  label: string;
  flagged_txns: number;
  churn_prob_avg: number;
  correlation_note?: string;
}

export interface Analyst {
  analyst_id: string;
  name: string;
  role: string;
}
