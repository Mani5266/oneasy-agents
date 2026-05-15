'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Save status indicator component.
 * Shows "Saving..." while saving, "Saved ✓" briefly after save completes.
 * 
 * @param saving - whether a save is currently in progress
 * @param className - optional wrapper className override
 */
export function SaveIndicator({ saving, className }: { saving: boolean; className?: string }) {
  const [showSaved, setShowSaved] = useState(false);
  const wasRef = useRef(false);

  useEffect(() => {
    if (wasRef.current && !saving) {
      // Save just completed
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2500);
      return () => clearTimeout(t);
    }
    wasRef.current = saving;
  }, [saving]);

  if (!saving && !showSaved) return null;

  return (
    <div className={className || "h-5 flex justify-end no-print mb-1"}>
      {saving ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#d4a017', animation: 'pulse 1.5s infinite' }}>
          Saving...
        </span>
      ) : showSaved ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', opacity: 0.9 }}>
          Saved ✓
        </span>
      ) : null}
    </div>
  );
}
