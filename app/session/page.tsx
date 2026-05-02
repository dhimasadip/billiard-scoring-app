'use client';

import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { Play, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SchedulePage() {
  const router = useRouter();
  const { session, startMatch } = useSessionStore();

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary mb-4">No active session found.</p>
        <button 
          onClick={() => router.push('/setup')}
          className="text-primary font-bold"
        >
          Go to Setup
        </button>
      </div>
    );
  }

  const handlePlay = (index: number) => {
    startMatch(index);
    router.push('/session/match');
  };

  const progress = (session.results.length / session.schedule.length) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h1 className="font-display font-bold text-sm tracking-widest text-text-secondary uppercase">SESSION</h1>
          <span className="text-xs font-medium text-text-secondary">
            Match {session.currentMatchIndex + 1} of {session.schedule.length}
          </span>
        </div>
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Match List */}
      <div className="p-4 space-y-4">
        {session.schedule.map((match, idx) => {
          const isActive = idx === session.currentMatchIndex;
          const isCompleted = match.status === 'completed';
          const result = session.results.find(r => r.matchId === match.id);

          return (
            <div 
              key={match.id}
              className={cn(
                "rounded-xl border p-4 transition-all",
                isActive ? "bg-surface border-primary ring-1 ring-primary shadow-lg shadow-primary/5" : "bg-surface/40 border-border"
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-text-secondary">#{match.index}</span>
                <div className="flex items-center gap-1.5">
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                      <CheckCircle2 size={10} /> DONE
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> ACTIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary uppercase">
                      <Clock size={10} /> UPCOMING
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mb-3">
                {/* Team A */}
                <div className="flex-1 text-center">
                  <div className="flex flex-col gap-1">
                    {match.teamA.players.map(pid => (
                      <div key={pid} className="text-xs font-medium truncate">
                        {session.players.find(p => p.id === pid)?.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] font-bold text-text-secondary shrink-0">VS</div>

                {/* Team B */}
                <div className="flex-1 text-center">
                  <div className="flex flex-col gap-1">
                    {match.teamB.players.map(pid => (
                      <div key={pid} className="text-xs font-medium truncate">
                        {session.players.find(p => p.id === pid)?.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isCompleted && result ? (
                <div className="pt-3 border-t border-border flex justify-center items-center gap-3">
                  <span className={cn("text-lg font-display font-bold", result.winningSide === 'A' ? "text-gold" : "text-text-primary")}>
                    {result.teamAScore}
                  </span>
                  <span className="text-text-secondary text-xs">—</span>
                  <span className={cn("text-lg font-display font-bold", result.winningSide === 'B' ? "text-gold" : "text-text-primary")}>
                    {result.teamBScore}
                  </span>
                </div>
              ) : isActive ? (
                <button
                  onClick={() => handlePlay(idx)}
                  className="w-full mt-2 py-2.5 bg-primary text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Play size={14} fill="currentColor" />
                  PLAY NOW
                </button>
              ) : null}

              <div className="mt-3 flex justify-between items-center text-[10px] text-text-secondary italic">
                <span>Break: {session.players.find(p => p.id === match.breakPlayerId)?.name}</span>
                {match.sittingOut.length > 0 && (
                  <span>Out: {match.sittingOut.map(pid => session.players.find(p => p.id === pid)?.name).join(', ')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {session.status === 'completed' && (
        <div className="p-4">
          <button
            onClick={() => router.push('/session/summary')}
            className="w-full py-4 bg-gold text-black rounded-xl font-bold shadow-lg shadow-gold/20"
          >
            VIEW FINAL RESULTS
          </button>
        </div>
      )}
    </div>
  );
}
