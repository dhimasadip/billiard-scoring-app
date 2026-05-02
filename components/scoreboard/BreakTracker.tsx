'use client';

import { useSessionStore } from '@/store/sessionStore';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

export function BreakTracker() {
  const { session } = useSessionStore();

  if (!session) return null;

  const { queue, brokenThisCycle } = session.breakCycle;

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <h3 className="text-[10px] font-display font-bold tracking-widest text-text-secondary uppercase mb-4">BREAK ROTATION</h3>
      <div className="flex flex-wrap gap-3">
        {queue.map((pid, idx) => {
          const player = session.players.find(p => p.id === pid);
          const hasBroken = brokenThisCycle.includes(pid);
          // For now, let's assume the first person in queue who hasn't broken is next.
          // This matches the logic in assignBreakPlayer.
          const isNext = !hasBroken && brokenThisCycle.length === idx; 

          return (
            <div key={pid} className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative",
                hasBroken ? "bg-primary/20 border-primary text-primary" : 
                isNext ? "bg-surface border-primary ring-2 ring-primary/20 text-text-primary" : 
                "bg-surface border-border text-text-secondary"
              )}>
                <span className="text-xs font-bold">{player?.name.charAt(0).toUpperCase()}</span>
                {hasBroken && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
                    <Check size={8} strokeWidth={4} />
                  </div>
                )}
                {isNext && !hasBroken && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
              </div>
              <span className={cn("text-[9px] font-medium", isNext ? "text-primary" : "text-text-secondary")}>
                {player?.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
