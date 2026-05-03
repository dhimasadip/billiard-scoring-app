'use client';

import { useSessionStore } from '@/store/sessionStore';
import { History as HistoryIcon, ChevronRight, Edit2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';

export default function HistoryPage() {
  const { session, editLastResult } = useSessionStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editScoreA, setEditScoreA] = useState('');
  const [editScoreB, setEditScoreB] = useState('');

  if (!session) return null;

  const completedMatches = [...session.results].reverse();

  if (completedMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary mb-4 opacity-40">
          <HistoryIcon size={32} />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">No History Yet</h2>
        <p className="text-sm text-text-secondary">Completed matches will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-xl font-display font-bold text-text-primary">Match History</h1>
        <p className="text-xs text-text-secondary">{completedMatches.length} matches completed</p>
      </header>

      <div className="space-y-4">
        {completedMatches.map((res, idx) => {
          const match = session.schedule.find(m => m.id === res.matchId);
          if (!match) return null;

          const isLastMatch = idx === 0;

          return (
            <div key={res.matchId} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Match #{match.index}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="text-[9px] font-bold text-primary uppercase">Team {res.winningSide} WIN</span>
                  </div>
                  {isLastMatch && (
                    <button 
                      onClick={() => {
                        setEditScoreA(res.teamAScore.toString());
                        setEditScoreB(res.teamBScore.toString());
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 bg-surface-dim hover:bg-border rounded text-text-secondary flex items-center gap-1 transition-colors"
                    >
                      <Edit2 size={10} />
                      <span className="text-[9px] font-bold uppercase">Edit</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div className="text-xs font-bold mb-1 truncate">
                    {match.teamA.players.map(pid => session.players.find(p => p.id === pid)?.name).join(' & ')}
                  </div>
                  <div className={cn("text-2xl font-display font-bold", res.winningSide === 'A' ? "text-primary" : "text-text-secondary")}>
                    {res.teamAScore}
                  </div>
                </div>

                <div className="text-text-secondary text-xs font-bold opacity-30">—</div>

                <div className="flex-1 text-center">
                  <div className="text-xs font-bold mb-1 truncate">
                    {match.teamB.players.map(pid => session.players.find(p => p.id === pid)?.name).join(' & ')}
                  </div>
                  <div className={cn("text-2xl font-display font-bold", res.winningSide === 'B' ? "text-primary" : "text-text-secondary")}>
                    {res.teamBScore}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center text-[9px] text-text-secondary italic">
                <span>Break: {session.players.find(p => p.id === match.breakPlayerId)?.name}</span>
                {match.sittingOut.length > 0 && (
                  <span>Out: {match.sittingOut.map(pid => session.players.find(p => p.id === pid)?.name).join(', ')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Last Match Result"
        footer={
          <>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 py-3 bg-surface border border-border rounded-xl font-bold text-xs"
            >
              CANCEL
            </button>
            <button 
              onClick={() => {
                const a = parseInt(editScoreA);
                const b = parseInt(editScoreB);
                if (!isNaN(a) && !isNaN(b) && a !== b) {
                  editLastResult(a, b);
                  setIsEditModalOpen(false);
                }
              }}
              disabled={editScoreA === editScoreB || !editScoreA || !editScoreB}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              SAVE CHANGES
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Team A Score</label>
              <input 
                type="number"
                value={editScoreA}
                onChange={(e) => setEditScoreA(e.target.value)}
                className="w-full bg-surface-dim border border-border rounded-xl p-3 text-center text-xl font-bold font-display"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Team B Score</label>
              <input 
                type="number"
                value={editScoreB}
                onChange={(e) => setEditScoreB(e.target.value)}
                className="w-full bg-surface-dim border border-border rounded-xl p-3 text-center text-xl font-bold font-display"
              />
            </div>
          </div>
          {editScoreA === editScoreB && editScoreA !== '' && (
            <p className="text-[10px] text-danger text-center font-medium">Scores cannot be equal. No ties allowed.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
