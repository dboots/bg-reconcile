"use client";

import React, { useMemo } from 'react';
import { ReconcileRow, TransactionAction } from '../services/reconcile';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LedgerViewProps {
  transactions: ReconcileRow[];
  username?: string; // optional subtitle
  onRemove?: (id: number) => void; // if provided, show delete buttons
}

const BUY_COLOR = '#c0392b';
const SELL_COLOR = '#27ae60';
const LINE_COLOR = '#e67e22';
const ZERO_COLOR = '#3d9970';

const CustomTooltip: React.FC<any> = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const bar = (payload as any[]).find((p: any) => p.dataKey === 'value');
  const line = (payload as any[]).find((p: any) => p.dataKey === 'running');
  const img = payload[0]?.payload?.image;
  const game = payload[0]?.payload?.game;
  return (
    <div
      style={{
        background: '#1a1208',
        border: '1px solid #6b4c1e',
        borderRadius: 6,
        padding: '10px 14px',
        fontFamily: "'Crimson Text', Georgia, serif",
        color: '#f0e6d0',
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#d4a843' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {img && (
            <img
              src={img}
              alt={game}
              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
            />
          )}
          <div>{game}</div>
        </div>
        <div style={{ fontSize: 12, color: '#8b6b3a', marginTop: 4 }}>
          {new Date(label).toLocaleDateString()}
        </div>
      </div>
      {bar && (
        <div style={{ fontSize: 13, color: bar.value >= 0 ? SELL_COLOR : BUY_COLOR }}>
          {bar.value >= 0 ? '▲ Sale' : '▼ Purchase'}: ${Math.abs(bar.value)}
        </div>
      )}
      {line && (
        <div
          style={{
            fontSize: 13,
            color: line.value === 0 ? ZERO_COLOR : line.value > 0 ? SELL_COLOR : BUY_COLOR,
            marginTop: 4,
          }}
        >
          Running: {line.value >= 0 ? '+' : ''}${line.value}
        </div>
      )}
    </div>
  );
};

const ImageDot: React.FC<any> = (props: any) => {
  const { cx, cy, payload } = props as any;
  if (cx == null || cy == null || !payload?.image) return null;
  const size = 36;
  return (
    <image
      href={payload.image}
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid slice"
    />
  );
};

export default function LedgerView({ transactions, username, onRemove }: LedgerViewProps) {
  const chartData = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(a.date || a.created_at || '').getTime() - new Date(b.date || b.created_at || '').getTime()
    );
    let running = 0;
    return sortedTransactions.map((t) => {
      const value = t.action === TransactionAction.SELL ? t.amount : -t.amount;
      running += value;
      return { date: t.date || t.created_at, game: t.game, value, running, type: t.action, image: t.image };
    });
  }, [transactions]);

  const deviation = chartData.length ? chartData[chartData.length - 1].running : 0;
  const deviationColor = deviation === 0 ? ZERO_COLOR : deviation > 0 ? SELL_COLOR : BUY_COLOR;
  const totalBought = transactions
    .filter((t) => t.action === TransactionAction.BUY)
    .reduce((s, t) => s + t.amount, 0);
  const totalSold = transactions
    .filter((t) => t.action === TransactionAction.SELL)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      {/* header matching root page */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.3em',
            color: '#8b6b3a',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Board Game Collection
        </div>
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(24px, 4vw, 38px)',
            fontWeight: 900,
            margin: 0,
            color: '#d4a843',
            letterSpacing: '0.05em',
            textShadow: '0 2px 20px rgba(212,168,67,0.3)',
          }}
        >
          Trade Ledger
        </h1>
        {username && (
          <div style={{ fontSize: 14, color: '#8b6b3a', marginTop: 4 }}>
            for {username}
          </div>
        )}
        <div
          style={{
            width: 120,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #6b4c1e, #d4a843, #6b4c1e, transparent)',
            margin: '12px auto 0',
          }}
        />
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          maxWidth: 700,
          margin: '0 auto 32px',
        }}
      >
        {[
          { label: 'Total Spent', value: `$${totalBought}`, color: BUY_COLOR },
          { label: 'Total Earned', value: `$${totalSold}`, color: SELL_COLOR },
          {
            label: 'Deviation',
            value: `${deviation >= 0 ? '+' : ''}$${deviation}`,
            color: deviationColor,
            big: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.big
                ? 'linear-gradient(135deg, #1e1408, #2a1e0a)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.big ? s.color + '55' : '#3a2d1a'}`,
              borderRadius: 8,
              padding: '14px 16px',
              textAlign: 'center',
              boxShadow: s.big ? `0 0 20px ${s.color}22` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#8b6b3a',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: s.big ? 28 : 22,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            {s.big && (
              <div
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  color: deviation === 0 ? ZERO_COLOR : '#8b6b3a',
                  fontStyle: 'italic',
                }}
              >
                {deviation === 0
                  ? '✓ perfectly balanced'
                  : deviation > 0
                  ? 'selling more than buying'
                  : 'buying more than selling'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart section */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #3a2d1a',
          borderRadius: 12,
          padding: '24px 8px 16px',
          maxWidth: 900,
          margin: '0 auto 32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 12,
            color: '#8b6b3a',
            flexWrap: 'wrap',
          }}
        >
          <span>
            <span style={{ color: BUY_COLOR, fontWeight: 700 }}>■</span> Purchase
          </span>
          <span>
            <span style={{ color: SELL_COLOR, fontWeight: 700 }}>■</span> Sale
          </span>
          <span>
            <span style={{ color: LINE_COLOR, fontWeight: 700 }}>—</span> Running Deviation
          </span>
          <span>
            <span style={{ color: ZERO_COLOR, fontWeight: 700 }}>- -</span> Zero Target
          </span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2010" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8b6b3a', fontSize: 11, fontFamily: 'Crimson Text, Georgia, serif' }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={70}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              tick={{ fill: '#8b6b3a', fontSize: 11 }}
              tickFormatter={(v) => `$${Math.abs(v)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={0}
              stroke={ZERO_COLOR}
              strokeDasharray="6 3"
              strokeWidth={2}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.value >= 0 ? SELL_COLOR : BUY_COLOR}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="running"
              stroke={LINE_COLOR}
              strokeWidth={2.5}
              dot={<ImageDot />}
              activeDot={<ImageDot />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* transaction list */}
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #3a2d1a',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #3a2d1a',
            fontFamily: "'Cinzel', serif",
            fontSize: 14,
            color: '#d4a843',
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Transactions</span>
          <span
            style={{
              fontFamily: 'Crimson Text',
              fontSize: 13,
              color: '#8b6b3a',
              fontWeight: 400,
            }}
          >
            {transactions.length} entries
          </span>
        </div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {transactions.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#5a4a30',
                fontStyle: 'italic',
              }}
            >
              No transactions yet
            </div>
          ) : (
            transactions.map((t, i) => {
              const running = chartData[i]?.running ?? 0;
              return (
                <div
                  key={t.id ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    borderBottom: '1px solid #1e1810',
                    gap: 12,
                    transition: 'background 0.1s',
                  }}
                >
                  {t.image && (
                    <img
                      src={t.image}
                      alt={t.game}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: t.action === TransactionAction.BUY ? BUY_COLOR : SELL_COLOR,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, fontSize: 14 }}>{t.game}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#8b6b3a',
                      width: 100,
                    }}
                  >
                    {new Date(t.date || t.created_at || '').toLocaleDateString()}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: t.action === TransactionAction.BUY ? BUY_COLOR : SELL_COLOR,
                      fontWeight: 600,
                      width: 80,
                      textAlign: 'right',
                    }}
                  >
                    {t.action === TransactionAction.BUY ? '−' : '+'}${t.amount}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: running === 0 ? ZERO_COLOR : running > 0 ? SELL_COLOR : '#8b6b3a',
                      width: 64,
                      textAlign: 'right',
                    }}
                  >
                    {running >= 0 ? '+' : ''}${running}
                  </div>
                  {onRemove && t.id && (
                    <button
                      onClick={() => onRemove(t.id!)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4a3820',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: '0 4px',
                        lineHeight: 1,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = BUY_COLOR)}
                      onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = '#4a3820')}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
