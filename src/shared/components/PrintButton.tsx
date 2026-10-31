'use client';

import { Printer } from 'lucide-react';

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({
  label = 'สั่งพิมพ์เอกสาร (Print)',
  className = 'inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer',
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      <Printer className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
