import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, Player, ScheduleDepth, MatchResult, PlayerId, Match } from '@/lib/engine/types';
import { generateSchedule } from '@/lib/engine/schedule';
import { assignBreakPlayer } from '@/lib/engine/breakRotation';
import { validateResult, computeResult } from '@/lib/engine/scoring';

interface SessionState {
  session: Session | null;
  
  // Actions
  createSession: (players: Player[], depth: ScheduleDepth) => void;
  startMatch: (index: number) => void;
  submitResult: (matchId: string, scoreA: number, scoreB: number) => void;
  editLastResult: (scoreA: number, scoreB: number) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,

      createSession: (players, depth) => {
        const schedule = generateSchedule(players, depth);
        
        // Initialize break cycle
        let currentCycle = {
          queue: players.map(p => p.id),
          pointer: 0,
          cycleNumber: 0,
          brokenThisCycle: [] as PlayerId[],
        };

        // Assign break players for all matches (pre-calculated or dynamically?)
        // The plan says "For each match: find the player...", let's pre-assign them.
        const finalizedSchedule: Match[] = [];
        for (const m of schedule) {
          const { breakPlayerId, updatedCycle } = assignBreakPlayer(m, currentCycle);
          finalizedSchedule.push({ ...m, breakPlayerId });
          currentCycle = updatedCycle;
        }

        const newSession: Session = {
          id: crypto.randomUUID(),
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

      resetSession: () => {
        set({ session: null });
      },
    }),
    {
      name: 'billiard-session',
    }
  )
);
