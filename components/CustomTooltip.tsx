import React from "react";
import { BUY_COLOR, SELL_COLOR, ZERO_COLOR } from "../constants/colors"; // we'll need to create constants file or export colors from main

interface TooltipProps {
  active: boolean;
  payload: any;
  label: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const bar = (payload as any[]).find((p: any) => p.dataKey === "value");
  const line = (payload as any[]).find((p: any) => p.dataKey === "running");
  const img = payload[0]?.payload?.image;
  const game = payload[0]?.payload?.game;
  return (
    <div
      style={{
        background: "#1a1208",
        border: "1px solid #6b4c1e",
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "'Crimson Text', Georgia, serif",
        color: "#f0e6d0",
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#d4a843" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {img && (
            <img src={img} alt={game} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />
          )}
          <div>{game}</div>
        </div>
        <div style={{ fontSize: 12, color: "#8b6b3a", marginTop: 4 }}>
          {new Date(label).toLocaleDateString()}
        </div>
      </div>
      {bar && (
        <div style={{ fontSize: 13, color: bar.value >= 0 ? SELL_COLOR : BUY_COLOR }}>
          {bar.value >= 0 ? "▲ Sale" : "▼ Purchase"}: ${Math.abs(bar.value)}
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
          Running: {line.value >= 0 ? "+" : ""}${line.value}
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;
