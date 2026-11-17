import React, { useState } from 'react';
import {
  ChurnScore,
  Customer,
  RetentionActionType,
  RetentionChannel,
} from '../types/risk';
import { X, Send } from 'lucide-react';
import { RiskBandBadge } from './StatusBadge';

interface TriggerRetentionModalProps {
  churnScore: ChurnScore;
  customer: Customer;
  onClose: () => void;
  onDispatch: (payload: {
    churn_id: string;
    customer_id: string;
    action_type: RetentionActionType;
    channel: RetentionChannel;
    offer_detail: string;
  }) => void;
}

const DEFAULT_OFFER_BY_TYPE: Record<RetentionActionType, string> = {
  'Cashback Offer': '₹250 instant UPI cashback on next 2 merchant transactions.',
  'Fee Waiver': 'Waive 100% settlement & convenience fees for the next 30 days.',
  'Support Call': 'Priority callback within 15 mins from Senior Resolution Desk.',
  'EMI Grace Window': '48-hour interest-free EMI grace window with zero bounce fee.',
  'KYC Concierge': 'Guided 2-minute video Re-KYC concierge to lift debit restrictions.',
};

export const TriggerRetentionModal: React.FC<TriggerRetentionModalProps> = ({
  churnScore,
  customer,
  onClose,
  onDispatch,
}) => {
  const [actionType, setActionType] = useState<RetentionActionType>('Cashback Offer');
  const [channel, setChannel] = useState<RetentionChannel>('WhatsApp');
  const [offerDetail, setOfferDetail] = useState<string>(
    DEFAULT_OFFER_BY_TYPE['Cashback Offer']
  );

  const handleTypeChange = (nextType: RetentionActionType) => {
    setActionType(nextType);
    setOfferDetail(DEFAULT_OFFER_BY_TYPE[nextType]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerDetail.trim()) return;
    onDispatch({
      churn_id: churnScore.churn_id,
      customer_id: customer.customer_id,
      action_type: actionType,
      channel,
      offer_detail: offerDetail.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trigger-retention-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3
              id="trigger-retention-title"
              className="text-base font-semibold text-slate-900"
            >
              Trigger Retention Action
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {churnScore.churn_id} · {customer.customer_id} ({customer.full_name})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Context Strip */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500">Churn Probability: </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {churnScore.churn_prob.toFixed(1)}%
              </span>
            </div>
            <RiskBandBadge band={churnScore.risk_band} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="retention-action-type"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Action Type
              </label>
              <select
                id="retention-action-type"
                value={actionType}
                onChange={(e) =>
                  handleTypeChange(e.target.value as RetentionActionType)
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="Cashback Offer">Cashback Offer</option>
                <option value="Fee Waiver">Fee Waiver</option>
                <option value="Support Call">Support Call</option>
                <option value="EMI Grace Window">EMI Grace Window</option>
                <option value="KYC Concierge">KYC Concierge</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="retention-channel"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Delivery Channel
              </label>
              <select
                id="retention-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as RetentionChannel)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Push">Push Notification</option>
                <option value="SMS">SMS</option>
                <option value="Outbound Voice">Outbound Voice</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="retention-offer-detail"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Offer / Outreach Script
            </label>
            <textarea
              id="retention-offer-detail"
              rows={3}
              value={offerDetail}
              onChange={(e) => setOfferDetail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Describe the retention incentive or outreach action..."
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
