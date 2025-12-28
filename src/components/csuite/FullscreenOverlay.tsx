import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FullscreenOverlayProps {
  open: boolean;
  children: ReactNode;
}

export function FullscreenOverlay({ open, children }: FullscreenOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background animate-in fade-in-0 zoom-in-95 duration-200">
      {children}
    </div>,
    document.body
  );
}
