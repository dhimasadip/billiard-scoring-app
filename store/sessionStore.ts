import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, Player, ScheduleDepth, MatchResult, PlayerId } from '@/lib/engine/types';

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
        // Implementation will call lib/engine/schedule.ts
        console.log('Creating session with', players.length, 'players and depth', depth);
        // Skeleton for now
        const newSession: Session = {
          id: crypto.randomUUID(),
          players,
          schedule: [], // Will be generated
          results: [],
          breakCycle: {
            queue: players.map(p => p.id),
            pointer: 0,
            cycleNumber: 0,
            brokenThisCycle: [],
          },
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

        // Implementation will call lib/engine/scoring.ts
        console.log('Submitting result for', matchId, 'Scores:', scoreA, scoreB);
      },

      editLastResult: (scoreA, scoreB) => {
        const { session } = get();
        if (!session || session.results.length === 0) return;
        
        console.log('Editing last result to:', scoreA, scoreB);
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
