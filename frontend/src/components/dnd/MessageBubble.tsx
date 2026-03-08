/**
 * MessageBubble - Renders a single chat message (DM narration, player action, or system event).
 *
 * - DM messages render with a parchment-style background, dragon icon, and word-by-word animation.
 * - Player messages show in a colored bubble with the speaker name.
 * - System messages are centered with a subtle divider.
 * - All messages properly render newlines and paragraphs.
 */

import React, { useState, useEffect } from 'react';
import { DnDMessage } from '../../services/dndService';

// ─── AnimatedNarration ───────────────────────────────────────────────────────

function AnimatedNarration({
  text,
  renderContent,
}: {
  text: string;
  renderContent: (text: string) => React.ReactNode;
}) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const [displayedWords, setDisplayedWords] = useState(0);

  useEffect(() => { setDisplayedWords(0); }, [text]);

  useEffect(() => {
    if (displayedWords >= words.length) return;
    const baseDelay = 120;
    const speedFactor = Math.max(0.5, Math.min(1.2, 100 / words.length));
    const delay = baseDelay / speedFactor;
    const timer = setTimeout(() => {
      setDisplayedWords(prev => Math.min(prev + 1, words.length));
    }, delay);
    return () => clearTimeout(timer);
  }, [displayedWords, words.length]);

  const displayText = words.slice(0, displayedWords).join(' ');
  const isComplete = displayedWords >= words.length;

  return (
    <div>
      <div>{renderContent(displayText)}</div>
      {!isComplete && (
        <span className="dm-cursor" />
      )}
    </div>
  );
}

// ─── Render Markdown + Newlines ──────────────────────────────────────────────

/** Render markdown: **bold**, *italic*, and preserve newlines/paragraphs */
function renderContent(text: string): React.ReactNode {
  // Split into paragraphs (double newline) first
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs.map((para, pIdx) => {
    // Within each paragraph, split by single newlines
    const lines = para.split(/\n/);

    return (
      <div
        key={pIdx}
        style={{
          marginBottom: pIdx < paragraphs.length - 1 ? '8px' : 0,
        }}
      >
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        ))}
      </div>
    );
  });
}

/** Render inline markdown: **bold**, *italic*, `code` */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={i} style={{ color: 'rgba(212, 175, 255, 0.9)', fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          background: 'rgba(139, 92, 246, 0.15)',
          padding: '1px 5px',
          borderRadius: '3px',
          fontSize: '0.9em',
          color: 'rgba(192, 132, 252, 0.9)',
          fontFamily: 'monospace',
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: DnDMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isDM = message.role === 'dm';
  const isSystem = message.role === 'system';
  const [isAnimating, setIsAnimating] = useState(isDM);

  // ─── System Messages ────────────────────────────────────────────────────

  if (isSystem) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 24px', margin: '8px 16px',
      }}>
        <div style={{
          flex: 1, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
        }} />
        <span style={{
          color: 'rgba(139, 92, 246, 0.6)', fontSize: '11px', fontStyle: 'italic',
          whiteSpace: 'nowrap', letterSpacing: '0.5px',
        }}>
          ✦ {message.content} ✦
        </span>
        <div style={{
          flex: 1, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
        }} />
      </div>
    );
  }

  // ─── DM Messages ────────────────────────────────────────────────────────

  if (isDM) {
    return (
      <div className="msg-appear" style={{
        display: 'flex', justifyContent: 'flex-start',
        marginBottom: '16px', padding: '0 16px',
      }}>
        {/* DM Avatar */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0, marginRight: '8px', marginTop: '4px',
          boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
        }}>
          🐉
        </div>

        <div style={{
          maxWidth: '78%', padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(30, 20, 45, 0.9), rgba(20, 15, 35, 0.95))',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '4px 16px 16px 16px',
          fontSize: '12.5px', lineHeight: 1.6, color: 'rgba(230, 220, 255, 0.9)',
          position: 'relative',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(139, 92, 246, 0.1)',
        }}>
          {/* DM Label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '8px', paddingBottom: '6px',
            borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
              background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
            }}>
              Dungeon Master
            </span>
            <div style={{ flex: 1 }} />
            {/* Animation toggle */}
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              title={isAnimating ? 'Show all' : 'Animate'}
              style={{
                background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '4px', color: 'rgba(192, 132, 252, 0.7)',
                fontSize: '10px', padding: '1px 6px', cursor: 'pointer',
                opacity: 0.5, transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
            >
              {isAnimating ? '⏸' : '▶'}
            </button>
          </div>

          {/* Content */}
          {isAnimating ? (
            <AnimatedNarration text={message.content} renderContent={renderContent} />
          ) : (
            <div>{renderContent(message.content)}</div>
          )}

          {/* Decorative corner glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '40px', height: '40px',
            background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.15), transparent)',
            borderRadius: '4px 0 0 0', pointerEvents: 'none',
          }} />
        </div>
      </div>
    );
  }

  // ─── Player Messages ────────────────────────────────────────────────────

  return (
    <div className="msg-appear" style={{
      display: 'flex', justifyContent: 'flex-end',
      marginBottom: '12px', padding: '0 16px',
    }}>
      <div style={{
        maxWidth: '75%', padding: '9px 14px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 60, 200, 0.15))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px 4px 16px 16px',
        fontSize: '12.5px', lineHeight: 1.55, color: 'rgba(255, 255, 255, 0.9)',
        position: 'relative',
        boxShadow: '0 2px 12px rgba(139, 92, 246, 0.1)',
      }}>
        {/* Speaker */}
        {message.speakerName && (
          <div style={{
            fontSize: '11px', color: 'rgba(192, 132, 252, 0.9)',
            marginBottom: '4px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
              background: 'rgba(192, 132, 252, 0.8)',
            }} />
            {message.speakerName}
          </div>
        )}

        {/* Content with newlines rendered */}
        <div>{renderContent(message.content)}</div>
      </div>
    </div>
  );
}
