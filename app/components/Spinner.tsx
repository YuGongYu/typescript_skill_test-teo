import React from "react";
import s from "../styles/layout.module.css";

export default function Spinner() {
  return (
    <div className={s.center} role="status" aria-label="loading">
      <svg className="spin" width="24" height="24" viewBox="0 0 24 24">
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          opacity=".25"
        />
        <path
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          fill="currentColor"
          opacity=".8"
        />
      </svg>
    </div>
  );
}
