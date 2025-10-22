import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * InlineToast — lightweight notification component.
 *
 * Props:
 *  - type: "success" | "error" | "info"
 *  - message: string
 *  - onClose: function (optional)
 *  - duration: number (ms) — auto-close after time, default 4000
 *  - sticky: boolean — if true, toast appears fixed at top center
 */

const typeStyles = {
  success: {
    base: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-600'
  },
  error: {
    base: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-600'
  },
  info: {
    base: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-600'
  }
};

export default function InlineToast({
  type = 'info',
  message = '',
  onClose,
  duration = 4000,
  sticky = false
}) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (duration && !sticky) {
      const t = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(t);
    }
  }, [duration, sticky]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 200);
  });

  if (!visible) return null;

  const color = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`${
        sticky
          ? 'fixed top-5 left-1/2 transform -translate-x-1/2 z-50'
          : ''
      } flex items-center justify-between max-w-md w-full border rounded-lg px-4 py-2 shadow-md transition-all duration-300
        ${color.base}
        ${closing ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
      `}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={handleClose}
        className={`ml-3 ${color.icon} hover:opacity-75 transition-opacity`}
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
