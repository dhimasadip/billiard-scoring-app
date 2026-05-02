'use client';

import { useSessionStore } from '@/store/sessionStore';
import { useRouter } from 'next/navigation';
import { Trophy, RefreshCw, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerStats } from '@/lib/engine/types';

export default function SummaryPage() {
  const router = useRouter();
  const { session, resetSession } = useSessionStore();

  if (!session) return null;

  // Calculate stats (repeated logic from scoreboard, could be refactored later)
  const stats: PlayerStats[] = session.players.map(player => {
    let gamesPlayed = 0;
    let wins = 0;
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
      } else if (isTeamB) {
        gamesPlayed++;
        totalPoints += res.teamBScore;
        if (res.winningSide === 'B') wins++;
      }
    });
    return { playerId: player.id, gamesPlayed, wins, losses: gamesPlayed - wins, totalPoints, winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0 };
  });

  const sortedStats = [...stats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  const mvp = sortedStats[0];
  const mvpPlayer = session.players.find(p => p.id === mvp?.playerId);

  const handleNewSession = () => {
    if (confirm('Start a new session? Current session data will be cleared.')) {
      resetSession();
      router.push('/setup');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Match #', 'Team A', 'Score A', 'Score B', 'Team B', 'Winner', 'Break Player'];
    const rows = session.results.map(res => {
      const match = session.schedule.find(m => m.id === res.matchId);
      const teamA = match?.teamA.players.map(pid => session.players.find(p => p.id === pid)?.name).join(' & ');
      const teamB = match?.teamB.players.map(pid => session.players.find(p => p.id === pid)?.name).join(' & ');
      const breakPlayer = session.players.find(p => p.id === match?.breakPlayerId)?.name;
      return [
        match?.index,
        teamA,
        res.teamAScore,
        res.teamBScore,
        teamB,
        res.winningSide === 'A' ? 'Team A' : 'Team B',
        breakPlayer
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billiard-session-${session.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col max-w-lg mx-auto pb-24">
      <header className="text-center mb-8">
        <p className="text-[10px] font-display font-bold tracking-[0.2em] text-text-secondary uppercase mb-2">SESSION COMPLETE</p>
        <div className="relative inline-block">
          <Trophy size={64} className="text-gold mx-auto mb-4" />
          <div className="absolute inset-0 bg-gold/20 blur-2xl -z-10 rounded-full" />
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">FINAL RESULTS</h1>
        <p className="text-xs text-text-secondary mt-1">{session.schedule.length} Matches Played</p>
      </header>

      {/* MVP Section */}
      <section className="mb-10">
        <div className="bg-gradient-to-br from-gold/20 to-primary/5 rounded-2xl p-6 border border-gold/30 text-center relative overflow-hidden">
          <div className="absolute top-2 right-4 text-[10px] font-bold text-gold tracking-widest uppercase">MVP</div>
          <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold mx-auto mb-4 flex items-center justify-center">
             <span className="text-3xl font-bold text-gold">{mvpPlayer?.name.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-1">{mvpPlayer?.name}</h2>
          <p className="text-sm text-gold font-medium">{mvp?.wins} Wins · {mvp?.totalPoints} Total Points</p>
        </div>
      </section>

      {/* Standings */}
      <section className="flex-1 mb-10">
        <h3 className="text-[10px] font-display font-bold tracking-widest text-text-secondary uppercase mb-4">FINAL STANDINGS</h3>
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-border/50">
              {sortedStats.map((stat, idx) => {
                const player = session.players.find(p => p.id === stat.playerId);
                return (
                  <tr key={stat.playerId} className={cn(idx < 3 && "bg-primary/5")}>
                    <td className="px-4 py-4 w-10">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]",
                        idx === 0 ? "bg-gold text-black" : 
                        idx === 1 ? "bg-text-secondary/40 text-text-primary" :
                        idx === 2 ? "bg-orange-800/40 text-text-primary" : "text-text-secondary"
                      )}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-text-primary">{player?.name}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-text-primary">{stat.wins}W</div>
                      <div className="text-[9px] text-text-secondary">{stat.totalPoints} pts</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleExportCSV}
          className="w-full py-3 bg-surface text-text-primary rounded-xl font-bold border border-border text-xs mb-4"
        >
          EXPORT CSV
        </button>
        <button
          onClick={handleNewSession}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <RefreshCw size={18} />
          <span>NEW SESSION</span>
        </button>
        <button
          onClick={() => router.push('/session')}
          className="w-full py-4 bg-surface text-text-primary rounded-xl font-bold border border-border"
        >
          BACK TO SCHEDULE
        </button>
      </div>
    </div>
  );
}
