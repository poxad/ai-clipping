"use client";

import { useEffect } from "react";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ onClose, children, title }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid #e4e1da",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #e4e1da" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#1c1917" }}>{title}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-base leading-none transition-colors"
              style={{ color: "#9e9b94", background: "#f7f6f3" }}
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
