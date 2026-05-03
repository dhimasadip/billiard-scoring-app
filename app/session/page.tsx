'use client';

import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { Play, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';

export default function SchedulePage() {
  const router = useRouter();
  const { session, startMatch, extendSession, endSessionEarly } = useSessionStore();
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-surface-dim rounded-full flex items-center justify-center mb-4 text-text-secondary">
          <Clock size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">NO ACTIVE SESSION</h2>
        <p className="text-sm text-text-secondary mb-6">Start a new session to see your schedule here.</p>
        <button 
          onClick={() => router.push('/setup')}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          START SETUP
        </button>
      </div>
    );
  }

  // Sort schedule: active first, then upcoming, then completed
  const sortedSchedule = [...session.schedule].sort((a, b) => {
    const statusOrder = { active: 0, upcoming: 1, completed: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const isAllCompleted = session.schedule.every(m => m.status === 'completed');

  return (
    <div className="pb-24">
      {/* Session Actions (Summary / Extend) at the Top */}
      {isAllCompleted ? (
        <div className="p-4 bg-surface-dim border-b border-border sticky top-0 z-10 space-y-3 shadow-xl">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={() => router.push('/session/summary')}
              className="flex-1 py-3 bg-gold text-black rounded-xl font-bold shadow-lg shadow-gold/20 text-xs"
            >
              VIEW FINAL RESULTS
            </button>
            {session.results.length === session.schedule.length && (
              <button
                onClick={() => extendSession()}
                className="flex-1 py-3 bg-surface text-text-primary rounded-xl font-bold border border-border text-xs hover:border-primary/50 transition-all"
              >
                EXTEND SESSION
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Status Header */
        <div className="p-4 bg-surface-dim border-b border-border mb-4">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <div>
              <h2 className="text-[10px] font-display font-bold tracking-[0.2em] text-text-secondary uppercase">Session: {session.title}</h2>
              <p className="text-sm font-bold text-text-primary">
                {session.results.length} / {session.schedule.length} Matches Done
              </p>
            </div>
            <button
              onClick={() => setIsEndModalOpen(true)}
              className="px-3 py-2 bg-danger/5 border border-danger/20 rounded-lg text-[9px] font-bold text-danger/80 hover:bg-danger hover:text-white hover:border-danger transition-all uppercase tracking-widest shadow-sm"
            >
              End Early
            </button>
          </div>
        </div>
      )}

      {/* Match List */}
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {sortedSchedule.map((match) => {
          const isCompleted = match.status === 'completed';
          const isActive = match.status === 'active';
          const breakPlayer = session.players.find(p => p.id === match.breakPlayerId);
          const originalIdx = session.schedule.findIndex(m => m.id === match.id);

          return (
            <div 
              key={match.id}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-300",
                isActive ? "bg-primary/10 border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5" : 
                isCompleted ? "bg-surface-dim border-border opacity-40 grayscale" : 
                "bg-surface border-border"
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    isActive ? "bg-primary text-white" : "bg-surface-dim text-text-secondary border border-border"
                  )}>
                    {match.index}
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    {isActive ? "LIVE NOW" : isCompleted ? "FINISHED" : "UPCOMING"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex flex-col items-center gap-1">
                    {match.teamA.players.map(pid => (
                      <div key={pid} className="text-[11px] font-bold text-text-primary leading-tight text-center">
                        {session.players.find(p => p.id === pid)?.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-text-secondary font-display font-bold text-lg opacity-20 shrink-0">VS</div>
                <div className="flex-1">
                  <div className="flex flex-col items-center gap-1">
                    {match.teamB.players.map(pid => (
                      <div key={pid} className="text-[11px] font-bold text-text-primary leading-tight text-center">
                        {session.players.find(p => p.id === pid)?.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/50">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-text-secondary uppercase tracking-tight">Break Player</span>
                    <span className="text-[10px] font-bold text-primary leading-tight">{breakPlayer?.name}</span>
                  </div>
                  {match.sittingOut.length > 0 && (
                    <div className="flex flex-col border-l border-border/30 pl-4">
                      <span className="text-[8px] font-bold text-text-secondary uppercase tracking-tight">Sitting Out</span>
                      <div className="flex flex-wrap gap-x-1.5">
                        {match.sittingOut.map(pid => (
                          <span key={pid} className="text-[10px] font-bold text-text-secondary leading-tight">
                            {session.players.find(p => p.id === pid)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => {
                      startMatch(originalIdx);
                      router.push('/session/match');
                    }}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs transition-all",
                      isActive 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105" 
                        : "bg-surface-dim text-text-primary border border-border hover:bg-border"
                    )}
                  >
                    {isActive ? "RESUME" : "PLAY"}
                    <Play size={12} fill="currentColor" />
                  </button>
                )}
                {isCompleted && (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-primary font-bold text-[10px]">
                      <CheckCircle2 size={12} />
                      DONE
                    </div>
                    {session.results.find(r => r.matchId === match.id) && (
                      <div className="text-[14px] font-display font-bold text-text-primary tabular-nums tracking-tighter">
                        {session.results.find(r => r.matchId === match.id)?.teamAScore} - {session.results.find(r => r.matchId === match.id)?.teamBScore}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Session Early?"
        variant="danger"
        footer={
          <>
            <button 
              onClick={() => setIsEndModalOpen(false)}
              className="flex-1 py-3 bg-surface border border-border rounded-xl font-bold text-xs"
            >
              CANCEL
            </button>
            <button 
              onClick={() => {
                endSessionEarly();
                router.push('/session/summary');
              }}
              className="flex-1 py-3 bg-danger text-white rounded-xl font-bold text-xs shadow-lg shadow-danger/20"
            >
              END SESSION
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to end the session early? All upcoming matches will be cancelled and statistics will be finalized.
          </p>
        </div>
      </Modal>
    </div>
  );
}
