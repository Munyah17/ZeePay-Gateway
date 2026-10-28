'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BRAND = '#465fff';
const BRAND_SOFT = 'rgba(70, 95, 255, 0.08)';
const INK = '#1a1f36';
const MUTED = '#6b7c93';
const BORDER = '#e6ebf1';

interface DashboardStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
}

function Sparkline({ points, height = 56 }: { points: number[]; height?: number }) {
  const w = 600;
  const h = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(h - 8 - ((p - min) / range) * (h - 16)).toFixed(1)}`);
  const path = `M${coords.join(' L')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden>
      <path d={`${path} L${w},${h} L0,${h} Z`} fill={BRAND_SOFT} stroke="none" />
      <path d={path} fill="none" stroke={BRAND} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill={MUTED} style={{ marginLeft: 4, verticalAlign: 'baseline' }}>
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
      <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
    </svg>
  );
}

function DropdownLabel({ children }: { children: string }) {
  return (
    <span style={{ color: MUTED, fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
      {children}
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 6 }}>
        <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
      </svg>
    </span>
  );
}

function FilterChip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      style={{
        border: `1px solid ${BORDER}`,
        background: '#fff',
        color: muted ? MUTED : INK,
        fontWeight: 500,
        fontSize: 13,
        borderRadius: 6,
        padding: '4px 10px',
      }}
    >
      {label}
      <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 6 }}>
        <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
      </svg>
    </button>
  );
}

const OVERVIEW_CARDS = [
  { title: 'Payments', value: '142', spark: [3, 5, 4, 8, 6, 9, 7, 11, 9, 12] },
  { title: 'Gross volume', value: '$15,250.00', spark: [4, 6, 5, 9, 7, 10, 8, 12, 10, 14] },
  { title: 'Net volume', value: '$14,912.40', spark: [4, 5, 5, 8, 7, 9, 8, 11, 9, 13] },
  { title: 'New customers', value: '18', spark: [1, 2, 1, 3, 2, 4, 3, 4, 5, 6] },
  { title: 'Failed payments', value: '3', spark: [6, 4, 5, 3, 4, 2, 3, 2, 1, 1] },
  { title: 'Refunds', value: '$120.00', spark: [2, 3, 2, 4, 2, 3, 1, 2, 1, 1] },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('zeepay_authed');
      if (!authed) {
        router.push('/auth/login');
        return;
      }
    }

    setStats({
      totalPayments: 150,
      successfulPayments: 142,
      pendingPayments: 5,
      failedPayments: 3,
      totalAmount: 15250.0,
    });
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: BRAND }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const todaySpark = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <div style={{ color: INK, maxWidth: 1180 }}>
      {/* ===== Today ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0" style={{ fontSize: 24, fontWeight: 700, color: INK }}>
          Today
        </h2>
        <button
          type="button"
          className="btn btn-sm"
          style={{
            border: `1px solid ${BORDER}`,
            background: '#fff',
            color: INK,
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 6,
            padding: '6px 14px',
            boxShadow: '0 1px 2px rgba(26,31,54,0.06)',
          }}
        >
          Pay out funds
        </button>
      </div>

      <div className="row g-4 mb-2">
        <div className="col-md-4">
          <DropdownLabel>Gross volume</DropdownLabel>
          <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>$0.00</div>
          <div style={{ fontSize: 13, color: MUTED }}>6:48 AM</div>
        </div>
        <div className="col-md-4">
          <DropdownLabel>Yesterday</DropdownLabel>
          <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>
            ${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="col-md-4">
          <div className="d-flex justify-content-between align-items-baseline">
            <span style={{ color: MUTED, fontSize: 14 }}>Balances</span>
            <a href="/dashboard/payouts" style={{ color: BRAND, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              View more
            </a>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>$0.00</div>
          <div className="d-flex justify-content-between align-items-baseline">
            <span style={{ color: MUTED, fontSize: 14 }}>Payouts</span>
            <a href="/dashboard/payouts" style={{ color: BRAND, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              View
            </a>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: MUTED }}>—</div>
        </div>
      </div>

      {/* Intraday sparkline strip */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 4, marginBottom: 32 }}>
        <Sparkline points={todaySpark} height={48} />
        <div className="d-flex justify-content-between" style={{ fontSize: 12, color: MUTED }}>
          <span>12:00 AM</span>
          <span>12:00 AM</span>
        </div>
      </div>

      {/* ===== Your overview ===== */}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, marginBottom: 12 }}>Your overview</h2>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <FilterChip label="Date range" muted />
        <FilterChip label="Last 7 days" />
        <FilterChip label="Daily" />
        <span style={{ color: BORDER }}>|</span>
        <FilterChip label="⚙ Compare" muted />
        <FilterChip label="Previous period" muted />
        <div className="ms-auto d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm"
            style={{ border: `1px solid ${BORDER}`, background: '#fff', color: INK, fontWeight: 600, fontSize: 13, borderRadius: 6 }}
          >
            + Add
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ border: `1px solid ${BORDER}`, background: '#fff', color: INK, fontWeight: 600, fontSize: 13, borderRadius: 6 }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 5 }}>
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Metric card grid */}
      <div className="row g-3">
        {OVERVIEW_CARDS.map((card) => (
          <div className="col-md-6 col-lg-4" key={card.title}>
            <div
              style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '16px 18px',
                height: '100%',
                boxShadow: '0 1px 3px rgba(26,31,54,0.04)',
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>
                  {card.title}
                  <InfoIcon />
                </span>
                <svg width="15" height="15" viewBox="0 0 16 16" fill={MUTED}>
                  <path d="M3.5 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-9zM4 4v8.5h8V4H4z" />
                  <path d="M5 11.5 7 8l2 2 2-4.5" fill="none" stroke={MUTED} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: INK, margin: '6px 0 4px' }}>{card.value}</div>
              <Sparkline points={card.spark} height={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
