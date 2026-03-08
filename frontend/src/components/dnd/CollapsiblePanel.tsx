/**
 * CollapsiblePanel — Reusable glassmorphism overlay panel with collapse toggle.
 *
 * Used to make sidebar sections (CharacterSheet, Scoreboard, VoiceControls)
 * and the chat area collapsible so the 3D world is visible behind them.
 */

import React, { useState } from 'react';

interface CollapsiblePanelProps {
  /** Section title shown in the header */
  title: string;
  /** Optional icon/emoji for the header */
  icon?: string;
  /** Whether the panel starts expanded */
  defaultExpanded?: boolean;
  /** Content to render when expanded */
  children: React.ReactNode;
  /** Additional style for the outer container */
  style?: React.CSSProperties;
  /** Extra class name */
  className?: string;
  /** Show a badge count */
  badge?: string | number;
}

export default function CollapsiblePanel({
  title,
  icon,
  defaultExpanded = true,
  children,
  style,
  className,
  badge,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={className}
      style={{
        borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        ...style,
      }}
    >
      {/* Header (always visible, acts as toggle) */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: expanded
            ? 'rgba(139, 92, 246, 0.08)'
            : 'rgba(255, 255, 255, 0.02)',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all 0.2s',
        }}
      >
        {icon && <span style={{ fontSize: '12px' }}>{icon}</span>}
        <span>{title}</span>
        {badge !== undefined && (
          <span
            style={{
              padding: '1px 6px',
              background: 'rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              fontSize: '9px',
              color: 'rgba(192, 132, 252, 0.9)',
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '9px',
            color: 'rgba(139, 92, 246, 0.6)',
            transition: 'transform 0.3s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Content (collapsible) */}
      <div
        style={{
          maxHeight: expanded ? '2000px' : '0px',
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
