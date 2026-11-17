import React, { useState } from 'react';
import { JointRiskTrendPoint } from '../types/risk';
import { AlertCircle } from 'lucide-react';

interface JointRiskChartProps {
  data: JointRiskTrendPoint[];
}

export const JointRiskChart: React.FC<JointRiskChartProps> = ({ data }) => {
  const [range, setRange] = useState<'14d' | '30d'>('30d');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visibleData = range === '14d' ? data.slice(-14) : data;
  const width = 820;
  const height = 270;
  const padLeft = 46;
  const padRight = 50;
  const padTop = 24;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxFlagged = Math.max(...visibleData.map((d) => d.flagged_txns), 65);
  const maxChurn = 65; // % right axis

  const getX = (idx: number) =>
    visibleData.length <= 1
      ? padLeft
      : padLeft + (idx / (visibleData.length - 1)) * plotW;

  const getYFlagged = (val: number) =>
    padTop + plotH - (val / maxFlagged) * plotH;

  const getYChurn = (val: number) =>
    padTop + plotH - (val / maxChurn) * plotH;

  const flaggedPath = visibleData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getYFlagged(d.flagged_txns).toFixed(1)}`)
    .join(' ');

  const churnPath = visibleData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getYChurn(d.churn_prob_avg).toFixed(1)}`)
    .join(' ');

  const flaggedAreaPath =
    flaggedPath +
    ` L ${getX(visibleData.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const yTicksLeft = [0, 20, 40, 60];
  const yTicksRight = [0, 20, 40, 60];

  const activeIndex = hoveredIdx !== null && hoveredIdx < visibleData.length ? hoveredIdx : null;
  const activePoint = activeIndex !== null ? visibleData[activeIndex] : null;

  const correlationPoints = visibleData
    .map((d, idx) => ({ d, idx }))
    .filter((item) => Boolean(item.d.correlation_note));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Joint Risk Trend: Daily Flagged Transactions vs. Churn Probability
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracks 24–48h customer churn spikes triggered by transaction blocks and step-up friction
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-0.5 bg-red-600 inline-block" />
              Flagged Txns (Left)
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-0.5 bg-amber-600 inline-block" />
              Churn Prob % (Right)
            </span>
          </div>
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setRange('14d')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                range === '14d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Days
            </button>
            <button
              type="button"
              onClick={() => setRange('30d')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                range === '30d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Responsive SVG Dual-Axis Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[280px] overflow-visible"
          role="img"
          aria-label="Dual axis chart showing daily flagged transactions and churn probability"
        >
          <defs>
            <linearGradient id="flaggedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Dual Y-Axis Labels */}
          {yTicksLeft.map((tick, i) => {
            const y = getYFlagged(tick);
            const rightTick = yTicksRight[i];
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  {tick}
                </text>
                <text
                  x={width - padRight + 8}
                  y={getYChurn(rightTick) + 3.5}
                  textAnchor="start"
                  className="fill-amber-700 font-mono text-[10px]"
                >
                  {rightTick}%
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={padLeft}
            y={12}
            className="fill-red-600 font-sans text-[10px] font-medium"
          >
            Flagged Txns / Day
          </text>
          <text
            x={width - padRight}
            y={12}
            textAnchor="end"
            className="fill-amber-700 font-sans text-[10px] font-medium"
          >
            Avg Churn Prob (%)
          </text>

          {/* Correlation Vertical Bands */}
          {correlationPoints.map(({ d, idx }) => {
            const cx = getX(idx);
            return (
              <g key={d.date}>
                <line
                  x1={cx}
                  y1={padTop}
                  x2={cx}
                  y2={padTop + plotH}
                  stroke="#FDE68A"
                  strokeWidth="10"
                  strokeOpacity="0.45"
                />
              </g>
            );
          })}

          {/* Flagged Area & Line */}
          <path d={flaggedAreaPath} fill="url(#flaggedGradient)" />
          <path
            d={flaggedPath}
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Churn Line */}
          <path
            d={churnPath}
            fill="none"
            stroke="#D97706"
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Correlation Spike Markers */}
          {correlationPoints.map(({ d, idx }) => {
            const cx = getX(idx);
            const cy = getYChurn(d.churn_prob_avg);
            return (
              <g key={`marker-${d.date}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#FFFBEB"
                  stroke="#D97706"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Hover Vertical Guide & Points */}
          {activeIndex !== null && activePoint && (
            <g>
              <line
                x1={getX(activeIndex)}
                y1={padTop}
                x2={getX(activeIndex)}
                y2={padTop + plotH}
                stroke="#0F172A"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(activeIndex)}
                cy={getYFlagged(activePoint.flagged_txns)}
                r="4"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(activeIndex)}
                cy={getYChurn(activePoint.churn_prob_avg)}
                r="4"
                fill="#D97706"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X-Axis Labels */}
          {visibleData.map((d, idx) => {
            const step = visibleData.length > 16 ? 4 : 2;
            const showLabel = idx % step === 0 || idx === visibleData.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={d.date}
                x={getX(idx)}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[10px]"
              >
                {d.label}
              </text>
            );
          })}

          {/* Interactive Hit Targets */}
          {visibleData.map((d, idx) => {
            const stepW = plotW / Math.max(1, visibleData.length - 1);
            return (
              <rect
                key={`hit-${d.date}`}
                x={getX(idx) - stepW / 2}
                y={padTop}
                width={stepW}
                height={plotH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Interactive Readout Strip */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {activePoint ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono font-semibold text-slate-900">
                {activePoint.label}, 2026
              </span>
              <span className="font-mono tabular-nums text-red-700">
                Flagged Txns: <strong>{activePoint.flagged_txns}</strong>
              </span>
              <span className="font-mono tabular-nums text-amber-800">
                Avg Churn Prob: <strong>{activePoint.churn_prob_avg.toFixed(1)}%</strong>
              </span>
              {activePoint.correlation_note && (
                <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  {activePoint.correlation_note}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-slate-600">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Highlighted amber bands mark <strong>post-flag churn correlations</strong> — hover chart points to inspect daily spike drivers.
              </span>
            </div>
          )}
          <span className="font-mono text-slate-400 shrink-0 tabular-nums">
            r = +0.78 lag-24h correlation
          </span>
        </div>
      </div>
    </div>
  );
};
