"use client";

import styles from "./tracker-shell.module.css";

export function PrintButton() {
  return (
    <button className={styles.btnExport} onClick={() => window.print()} type="button">
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14" height="14">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export PDF
    </button>
  );
}
