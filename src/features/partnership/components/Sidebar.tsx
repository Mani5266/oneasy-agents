// ── Sidebar Component ────────────────────────────────────────────────────────

'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWizardStore } from '../hooks/useWizardStore';
import type { Deed } from '../types';
import {
  Plus,
  Pencil,
  Trash2,
  Menu,
  X,
  History,
  FileText,
  Sparkles,
} from 'lucide-react';

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
  const { email } = useAuth();
  const currentPage = useWizardStore((s) => s.currentPage);
  const currentDeedId = useWizardStore((s) => s.currentDeedId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteDeed(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gold-500 rounded-2xl flex items-center justify-center text-navy-950 font-black text-lg shadow-lg shadow-gold-500/20">
          O
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
            OnEasy
          </h1>
          <p className="text-[11px] font-semibold text-gold-400 tracking-wide leading-tight">
            Partnership Deed
          </p>
        </div>
      </div>

      {/* New Deed Button */}
      <button
        onClick={handleNewDeed}
        className="w-full flex items-center justify-center gap-2 mb-3 py-3 px-4 rounded-xl font-semibold text-sm
          text-navy-950 bg-white hover:bg-slate-100 shadow-md shadow-black/10
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:ring-offset-2 focus:ring-offset-navy-900"
      >
        <Plus className="w-4 h-4" /> New Partnership Deed
      </button>

      {/* Fill with AI Button */}
      <button
        onClick={() => {
          onToggleChat();
          setMobileOpen(false);
        }}
        className="w-full flex items-center justify-center gap-2 mb-8 py-2.5 px-4 rounded-xl font-semibold text-sm
          text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:ring-offset-2 focus:ring-offset-navy-900"
      >
        <Sparkles className="w-4 h-4" /> Fill with AI
      </button>

      {/* Draft List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Recent Drafts
          </h2>
        </div>

        <div className="space-y-1.5">
          {drafts.length === 0 ? (
            <p className="text-xs text-center text-slate-500 py-8 italic">
              No saved deeds yet. Create your first deed above.
            </p>
          ) : (
            drafts.slice(0, 10).map((d) => (
              <div
                key={d.id}
                className={`relative group w-full rounded-xl transition-all border ${
                  d.id === currentDeedId
                    ? 'bg-navy-800/60 border-gold-500/30 ring-1 ring-gold-500/20'
                    : 'bg-transparent border-transparent hover:bg-navy-800/40 hover:border-navy-700/50'
                }`}
              >
                <button
                  onClick={() => handleDraftClick(d.id)}
                  className="w-full text-left p-3 pr-16 flex items-start gap-2.5"
                >
                  <div
                    className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      d.id === currentDeedId
                        ? 'bg-gold-500/20 text-gold-400'
                        : 'bg-navy-700/50 text-slate-500 group-hover:bg-navy-700 group-hover:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                      {d.business_name || 'Untitled'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {d.updated_at ? new Date(d.updated_at).toLocaleDateString() : ''}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded leading-none bg-gold-500/20 text-gold-400">
                        DRAFT
                      </span>
                    </div>
                  </div>
                </button>

                {/* Action buttons on hover */}
                <div className="absolute right-2 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDraftClick(d.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-gold-400 transition-colors rounded-md hover:bg-navy-700/50"
                    aria-label="Edit deed"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(d.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                    aria-label="Delete deed"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-4 border-t border-navy-700/50">
        {email && (
          <p className="text-[11px] text-slate-500 truncate mb-3 px-1" title={email}>
            {email}
          </p>
        )}

        {/* Generator / History nav buttons */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => handleNav('generator')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'generator'
                ? 'text-white bg-navy-700/60'
                : 'text-slate-400 hover:text-white hover:bg-navy-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Generator
          </button>
          <button
            onClick={() => handleNav('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              currentPage === 'history'
                ? 'text-white bg-navy-700/60'
                : 'text-slate-400 hover:text-white hover:bg-navy-700/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Delete Deed</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete this deed? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-navy-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed top-4 left-4 z-40 no-print">
        <button
          onClick={() => setMobileOpen(true)}
          className={`p-2.5 bg-navy-900 border border-navy-700 rounded-xl shadow-md hover:bg-navy-800 transition-colors ${chatOpen ? 'hidden' : ''}`}
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 z-50 lg:z-auto
          h-screen lg:h-full w-72 bg-navy-900 border-r border-navy-800 p-6 flex flex-col no-print
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors"
          aria-label="Close sidebar menu"
        >
          <X className="w-5 h-5" />
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}
