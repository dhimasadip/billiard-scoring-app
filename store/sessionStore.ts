import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, Player, ScheduleDepth, MatchResult, PlayerId, Match, BreakCycle } from '@/lib/engine/types';
import { generateSchedule } from '@/lib/engine/schedule';
import { assignBreakPlayer } from '@/lib/engine/breakRotation';
import { validateResult, computeResult } from '@/lib/engine/scoring';

interface SessionState {
  session: Session | null;
  
  // Actions
  createSession: (title: string, players: Player[], depth: ScheduleDepth) => void;
  startMatch: (index: number) => void;
  submitResult: (matchId: string, scoreA: number, scoreB: number) => void;
  editLastResult: (scoreA: number, scoreB: number) => void;
  extendSession: () => void;
  endSessionEarly: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,

      createSession: (title, players, depth) => {
        const schedule = generateSchedule(players, depth);
        
        // Initialize break cycle
        let currentCycle: BreakCycle = {
          queue: players.map(p => p.id),
          brokenThisCycle: [],
        };

        const finalizedSchedule = schedule.map(m => {
          if (m.breakPlayerId) {
            // Respect pre-assigned break
            currentCycle = {
              ...currentCycle,
              brokenThisCycle: [...currentCycle.brokenThisCycle, m.breakPlayerId]
            };
            // If everyone broke in this cycle, reset
            if (currentCycle.brokenThisCycle.length === players.length) {
              currentCycle.brokenThisCycle = [];
            }
            return m;
          } else {
            // Fallback for matches without pre-assigned break
            const { breakPlayerId, updatedCycle } = assignBreakPlayer(m, currentCycle);
            currentCycle = updatedCycle;
            return { ...m, breakPlayerId };
          }
        });

        const newSession: Session = {
          id: crypto.randomUUID(),
          title,
          players,
          schedule: finalizedSchedule,
          results: [],
          breakCycle: currentCycle,
          currentMatchIndex: 0,
          scheduleDepth: depth,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        set({ session: newSession });
      },

      startMatch: (index) => {
        const { session } = get();
        if (!session) return;

        const newSchedule = [...session.schedule];
        if (newSchedule[index]) {
          newSchedule[index].status = 'active';
          set({ session: { ...session, schedule: newSchedule, currentMatchIndex: index } });
        }
      },

      submitResult: (matchId, scoreA, scoreB) => {
        const { session } = get();
        if (!session) return;

        const match = session.schedule.find(m => m.id === matchId);
        if (!match) return;

        if (!validateResult(scoreA, scoreB)) return;

        const { result } = computeResult(match, scoreA, scoreB);
        
        const newSchedule = session.schedule.map(m => 
          m.id === matchId ? { ...m, status: 'completed' as const } : m
        );

        const newResults = [...session.results, result];
        const nextIndex = session.currentMatchIndex + 1;
        const isFinished = nextIndex >= session.schedule.length;

        set({ 
          session: { 
            ...session, 
            schedule: newSchedule, 
            results: newResults,
            currentMatchIndex: isFinished ? session.currentMatchIndex : nextIndex,
            status: isFinished ? 'completed' : 'active'
          } 
        });
      },

      editLastResult: (scoreA, scoreB) => {
        const { session } = get();
        if (!session || session.results.length === 0) return;
        
        const lastResult = session.results[session.results.length - 1];
        const match = session.schedule.find(m => m.id === lastResult.matchId);
        if (!match || !validateResult(scoreA, scoreB)) return;

        const { result } = computeResult(match, scoreA, scoreB);
        const newResults = [...session.results.slice(0, -1), result];

        set({ session: { ...session, results: newResults } });
      },

      extendSession: () => {
        const { session } = get();
        if (!session) return;

        // Generate more matches using the same settings
        const newMatches = generateSchedule(session.players, session.scheduleDepth);
        
        // Update indices to continue from where we left off
        const startIndex = session.schedule.length;
        const offsetMatches = newMatches.map((m, i) => ({
          ...m,
          index: startIndex + i + 1,
          id: crypto.randomUUID() // Ensure unique IDs for extended matches
        }));

        set({
          session: {
            ...session,
            schedule: [...session.schedule, ...offsetMatches],
            status: 'active'
          }
        });
      },

      endSessionEarly: () => {
        const { session } = get();
        if (!session) return;
        set({ session: { ...session, status: 'completed' } });
      },

      resetSession: () => {
        set({ session: null });
      },
    }),
    {
      name: 'billiard-session',
    }
  )
);
