"use client";

import { IconTerminal } from "./icons";

export function ExportJsonButton({ data, filename }: { data: unknown; filename: string }) {
  return (
    <button
      className="btn btn-sm"
      onClick={() => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <IconTerminal size={11} />
      Export JSON
    </button>
  );
}
