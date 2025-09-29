import React from "react";
export default function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid #d1d5db",
        borderRadius: 9999,
        overflow: "hidden",
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 12px",
              border: "none",
              background: active ? "#111" : "#fff",
              color: active ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
