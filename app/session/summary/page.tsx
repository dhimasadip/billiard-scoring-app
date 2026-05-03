'use client';

import { useSessionStore } from '@/store/sessionStore';
import { useRouter } from 'next/navigation';
import { Trophy, RefreshCw, ChevronLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerStats } from '@/lib/engine/types';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';

export default function SummaryPage() {
  const router = useRouter();
  const { session, resetSession } = useSessionStore();
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

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
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });

  const mvp = sortedStats[0];
  const mvpPlayer = session.players.find(p => p.id === mvp?.playerId);

  const handleNewSession = () => {
    setIsNewSessionModalOpen(true);
  };

  const confirmNewSession = () => {
    resetSession();
    router.push('/setup');
  };



  return (
    <div className="min-h-screen bg-background p-6 flex flex-col max-w-lg mx-auto pb-24">
      <header className="text-center mb-8">
        <p className="text-[10px] font-display font-bold tracking-[0.2em] text-text-secondary uppercase mb-2">SESSION LEADERBOARD</p>
        <div className="relative inline-block">
          <Trophy size={64} className="text-gold mx-auto mb-4" />
          <div className="absolute inset-0 bg-gold/20 blur-2xl -z-10 rounded-full" />
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">{session.title}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="text-[10px] text-text-secondary opacity-60 mt-2 uppercase tracking-widest">{session.results.length} Matches Played</p>
      </header>

      {/* Standings */}
      <section className="flex-1 mb-10">
        <h3 className="text-[10px] font-display font-bold tracking-widest text-text-secondary uppercase mb-4">FINAL STANDINGS</h3>
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
            <tbody className="divide-y divide-border/50">
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
                    <td className="px-4 py-4 w-10">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]",
                        isFirst ? "bg-gold text-black" : 
                        idx === 1 ? "bg-text-secondary/40 text-text-primary" :
                        idx === 2 ? "bg-orange-800/40 text-text-primary" : "text-text-secondary"
                      )}>
                        {isFirst ? <Trophy size={12} /> : idx + 1}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={cn("font-bold", isFirst ? "text-primary" : "text-text-primary")}>{player?.name}</div>
                      <div className="text-[9px] text-text-secondary opacity-60">{(stat.winRate * 100).toFixed(0)}% WR</div>
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
      </section>

      {/* Actions */}
      <div className="space-y-3">

        <button
          onClick={handleNewSession}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <RefreshCw size={18} />
          <span>NEW SESSION</span>
        </button>
        {session.results.length === session.schedule.length ? (
          <button
            onClick={() => router.push('/session/history')}
            className="w-full py-4 bg-surface text-text-primary rounded-xl font-bold border border-border"
          >
            VIEW HISTORY
          </button>
        ) : (
          <button
            onClick={() => router.push('/session')}
            className="w-full py-4 bg-surface text-text-primary rounded-xl font-bold border border-border"
          >
            RESUME SESSION
          </button>
        )}
      </div>

      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        title="Start New Session?"
        footer={
          <>
            <button 
              onClick={() => setIsNewSessionModalOpen(false)}
              className="flex-1 py-3 bg-surface border border-border rounded-xl font-bold text-xs"
            >
              CANCEL
            </button>
            <button 
              onClick={() => {
                setIsNewSessionModalOpen(false);
                confirmNewSession();
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20"
            >
              START NEW
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <RefreshCw size={24} />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to start a new session? All current standings and match history will be cleared.
          </p>
        </div>
      </Modal>
    </div>
  );
}
