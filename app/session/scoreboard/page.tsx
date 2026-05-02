'use client';

import { useSessionStore } from '@/store/sessionStore';
import { useRouter } from 'next/navigation';
import { Trophy, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerStats } from '@/lib/engine/types';

export default function ScoreboardPage() {
  const router = useRouter();
  const { session } = useSessionStore();

  if (!session) return null;

  // Calculate stats
  const stats: PlayerStats[] = session.players.map(player => {
    let gamesPlayed = 0;
    let wins = 0;
    let losses = 0;
    let totalPoints = 0;

    session.results.forEach(res => {
      const match = session.schedule.find(m => m.id === res.matchId);
      if (!match) return;

      const isTeamA = match.teamA.players.includes(player.id);
      const isTeamB = match.teamB.players.includes(player.id);

      if (isTeamA) {
        gamesPlayed++;
        totalPoints += res.teamAScore;
        if (res.winningSide === 'A') wins++;
        else losses++;
      } else if (isTeamB) {
        gamesPlayed++;
        totalPoints += res.teamBScore;
        if (res.winningSide === 'B') wins++;
        else losses++;
      }
    });

    return {
      playerId: player.id,
      gamesPlayed,
      wins,
      losses,
      totalPoints,
      winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    };
  });

  // Sort by wins, then total points
  const sortedStats = [...stats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-display font-bold text-text-primary">Standings</h1>
          <p className="text-xs text-text-secondary">Session Leaderboard</p>
        </div>
        <div className="text-xs text-text-secondary bg-surface px-2 py-1 rounded border border-border">
          {session.results.length} / {session.schedule.length} Matches
        </div>
      </header>

      {/* Podium / Top 3 (Simplified for Phase 3) */}
      <div className="space-y-3 mb-8">
        {sortedStats.slice(0, 3).map((stat, idx) => {
          const player = session.players.find(p => p.id === stat.playerId);
          return (
            <div 
              key={stat.playerId} 
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border",
                idx === 0 ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" : "bg-surface border-border"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                idx === 0 ? "bg-gold text-black" : "bg-surface-dim border border-border text-text-secondary"
              )}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{player?.name}</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">{stat.wins} Wins · {stat.totalPoints} Pts</div>
              </div>
              {idx === 0 && <Trophy size={20} className="text-gold" />}
            </div>
          );
        })}
      </div>

      {/* Full Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-surface-dim text-text-secondary uppercase tracking-widest text-[9px]">
              <th className="px-4 py-3 font-bold">#</th>
              <th className="py-3 font-bold">Player</th>
              <th className="py-3 font-bold text-right">GP</th>
              <th className="py-3 font-bold text-right">W</th>
              <th className="py-3 font-bold text-right">L</th>
              <th className="px-4 py-3 font-bold text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStats.map((stat, idx) => {
              const player = session.players.find(p => p.id === stat.playerId);
              return (
                <tr key={stat.playerId} className="hover:bg-primary/5">
                  <td className="px-4 py-4 text-text-secondary font-medium">{idx + 1}</td>
                  <td className="py-4">
                    <div className="font-bold text-text-primary">{player?.name}</div>
                    <div className="text-[9px] text-text-secondary">{(stat.winRate * 100).toFixed(0)}% Win Rate</div>
                  </td>
                  <td className="py-4 text-right font-medium tabular-nums">{stat.gamesPlayed}</td>
                  <td className="py-4 text-right font-bold text-primary tabular-nums">{stat.wins}</td>
                  <td className="py-4 text-right text-danger tabular-nums">{stat.losses}</td>
                  <td className="px-4 py-4 text-right font-bold text-gold tabular-nums">{stat.totalPoints}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
