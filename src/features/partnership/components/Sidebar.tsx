// ── Sidebar Component ────────────────────────────────────────────────────────

'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWizardStore } from '../hooks/useWizardStore';
import type { Deed } from '../types';

interface SidebarProps {
  drafts: Deed[];
  onNewDeed: () => void;
  onEditDeed: (id: string) => void;
  onDeleteDeed: (id: string) => void;
  onNavigate: (page: 'generator' | 'history') => void;
  onToggleChat: () => void;
  chatOpen?: boolean;
}

export function Sidebar({
  drafts,
  onNewDeed,
  onEditDeed,
  onDeleteDeed,
  onNavigate,
  onToggleChat,
  chatOpen,
}: SidebarProps) {
  const { email, signOut } = useAuth();
  const currentPage = useWizardStore((s) => s.currentPage);
  const currentDeedId = useWizardStore((s) => s.currentDeedId);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = useCallback(
    (page: 'generator' | 'history') => {
      onNavigate(page);
      setMobileOpen(false);
    },
    [onNavigate]
  );

  const handleDraftClick = useCallback(
    (id: string) => {
      onEditDeed(id);
      setMobileOpen(false);
    },
    [onEditDeed]
  );

  const handleNewDeed = useCallback(() => {
    onNewDeed();
    setMobileOpen(false);
  }, [onNewDeed]);

  const handleLogout = useCallback(async () => {
    await signOut();
    window.location.href = '/login';
  }, [signOut]);

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`hamburger ${chatOpen ? 'hidden' : ''}`}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="mobile-backdrop visible"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* ── Top Section ── */}
        <div className="sidebar-top">
          {/* Logo */}
          <div className="sidebar-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#1e293b" />
              <text
                x="50%"
                y="54%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f0b929"
                fontSize="22"
                fontWeight="bold"
                fontFamily="DM Serif Display, serif"
              >
                O
              </text>
            </svg>
            <div className="sidebar-logo-text">
              <span className="sidebar-brand">OnEasy</span>
              <span className="sidebar-subtitle">Partnership Deed</span>
            </div>
          </div>

          {/* New Deed Button */}
          <div className="sidebar-new-btn">
            <button onClick={handleNewDeed} className="btn btn-accent btn-full">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="2" x2="8" y2="14" />
                <line x1="2" y1="8" x2="14" y2="8" />
              </svg>
              New Partnership Deed
            </button>
          </div>

          {/* Fill with AI Button */}
          <div className="sidebar-new-btn">
            <button
              onClick={() => {
                onToggleChat();
                setMobileOpen(false);
              }}
              className="btn btn-full"
              style={{ color: 'var(--accent)', background: 'rgba(240,185,41,0.1)', border: '1px solid rgba(240,185,41,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              AI Chat Assistant
            </button>
          </div>

          {/* Recent Drafts */}
          <div className="sidebar-section-label">Recent Drafts</div>

          <div className="draft-list">
            {drafts.length === 0 ? (
              <p className="draft-empty">No saved deeds yet...</p>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  className={`draft-item ${d.id === currentDeedId ? 'active' : ''}`}
                >
                  <span
                    className="draft-item-text"
                    onClick={() => handleDraftClick(d.id)}
                  >
                    {d.business_name || 'Untitled'}
                  </span>
                  <div className="draft-item-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDraftClick(d.id);
                      }}
                      className="draft-action-btn"
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDeed(d.id);
                      }}
                      className="draft-action-btn draft-delete-btn"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Footer Section ── */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />

          {/* Email */}
          <div className="sidebar-email">{email}</div>

          {/* Nav Buttons */}
          <div className="sidebar-nav">
            <button
              onClick={() => handleNav('generator')}
              className={`sidebar-nav-btn ${currentPage === 'generator' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Generator
            </button>
            <button
              onClick={() => handleNav('history')}
              className={`sidebar-nav-btn ${currentPage === 'history' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              History
            </button>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
