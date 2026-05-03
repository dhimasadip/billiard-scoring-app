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

  // Sorting: highest points first, then wins, then winRate
  const sortedStats = [...stats].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });

  return (
    <div className="max-w-lg mx-auto p-4">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-[10px] font-display font-bold tracking-[0.2em] text-text-secondary uppercase mb-1">Leaderboard</h2>
          <h1 className="text-xl font-display font-bold text-text-primary leading-tight">{session.title}</h1>
          <p className="text-[10px] text-text-secondary mt-1 opacity-60">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-xs text-text-secondary bg-surface px-2 py-1 rounded border border-border">
          {session.results.length} / {session.schedule.length} Matches
        </div>
      </header>

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
              const isFirst = idx === 0;

              return (
                <tr 
                  key={stat.playerId} 
                  className={cn(
                    "transition-colors",
                    isFirst ? "bg-primary/10" : "hover:bg-primary/5"
                  )}
                >
                  <td className="px-4 py-4 text-text-secondary font-medium">
                    {isFirst ? (
                      <Trophy size={14} className="text-gold" />
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="py-4">
                    <div className={cn("font-bold", isFirst ? "text-primary" : "text-text-primary")}>
                      {player?.name}
                    </div>
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
