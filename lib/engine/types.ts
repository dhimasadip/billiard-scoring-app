export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

export interface Team {
  players: [PlayerId, PlayerId]; // always exactly 2
}

export interface Match {
  id: string;
  index: number;          // 1-based position in schedule
  teamA: Team;
  teamB: Team;
  breakPlayerId: PlayerId;
  sittingOut: PlayerId[]; // players not in this match
  status: 'upcoming' | 'active' | 'completed';
}

export interface MatchResult {
  matchId: string;
  teamAScore: number;
  teamBScore: number;
  winningSide: 'A' | 'B';  // no ties allowed
}

export interface PlayerStats {
  playerId: PlayerId;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalPoints: number;
  winRate: number;        // computed: wins / gamesPlayed
}

export interface BreakCycle {
  queue: PlayerId[];      // full ordered list of all players
  pointer: number;        // index of next-to-break
  cycleNumber: number;    // how many full cycles have completed
  brokenThisCycle: PlayerId[];
}

export type ScheduleDepth = 'one-pass' | 'full';

export interface Session {
  id: string;
  players: Player[];
  schedule: Match[];
  results: MatchResult[];
  breakCycle: BreakCycle;
  currentMatchIndex: number;  // 0-based index into schedule[]
  scheduleDepth: ScheduleDepth;
  status: 'setup' | 'active' | 'completed';
  createdAt: string;
}
