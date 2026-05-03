'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { Minus, Plus, AlertCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MatchPage() {
  const router = useRouter();
  const { session, submitResult } = useSessionStore();
  
  // Capture the index when the page was first loaded to prevent flickering
  // when currentMatchIndex advances in the store.
  const [initialMatchIndex] = useState(session?.currentMatchIndex ?? 0);
  
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const match = session?.schedule[initialMatchIndex];

  if (!session || !match) {
    return null;
  }

  const handleConfirm = () => {
    if (scoreA === scoreB) return;
    submitResult(match.id, scoreA, scoreB);
    router.push('/session');
  };

  const isTie = scoreA === scoreB;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <button onClick={() => router.push('/session')} className="text-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xs font-display font-bold tracking-widest text-text-secondary uppercase">MATCH #{match.index}</h1>
          <p className="text-[10px] text-text-secondary opacity-60">of {session.schedule.length}</p>
        </div>
        <div className="w-6" /> {/* Spacer */}
      </header>

      {/* Break Indicator */}
      <div className="bg-primary/10 border-y border-primary/20 py-4 px-6 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-bold tracking-wide">
            {session.players.find(p => p.id === match.breakPlayerId)?.name} BREAKS
          </span>
        </div>
        
        {match.sittingOut.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
            <span className="uppercase font-bold tracking-widest opacity-50">Sitting Out:</span>
            <span className="font-bold">
              {match.sittingOut.map(pid => session.players.find(p => p.id === pid)?.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Teams & Scores */}
      <div className="flex-1 p-6 flex flex-col gap-8 justify-center">
        {/* Team A */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-[10px] font-display font-bold text-text-secondary uppercase tracking-widest">TEAM A</h2>
          </div>
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-xl">
            <div className="flex flex-col gap-2 mb-6">
              {match.teamA.players.map(pid => (
                <div key={pid} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-lg font-medium">{session.players.find(p => p.id === pid)?.name}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button 
                onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-text-primary active:bg-border"
              >
                <Minus size={24} />
              </button>
              <div className="text-6xl font-display font-bold text-text-primary tabular-nums">
                {scoreA}
              </div>
              <button 
                onClick={() => setScoreA(Math.min(8, scoreA + 1))}
                className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-text-primary active:bg-border"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="relative h-px bg-border flex justify-center items-center">
          <span className="bg-background px-4 text-[10px] font-bold text-text-secondary">VS</span>
        </div>

        {/* Team B */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-[10px] font-display font-bold text-text-secondary uppercase tracking-widest">TEAM B</h2>
          </div>
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-xl">
            <div className="flex flex-col gap-2 mb-6">
              {match.teamB.players.map(pid => (
                <div key={pid} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-lg font-medium">{session.players.find(p => p.id === pid)?.name}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button 
                onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-text-primary active:bg-border"
              >
                <Minus size={24} />
              </button>
              <div className="text-6xl font-display font-bold text-text-primary tabular-nums">
                {scoreB}
              </div>
              <button 
                onClick={() => setScoreB(Math.min(8, scoreB + 1))}
                className="w-14 h-14 rounded-xl bg-surface border border-border flex items-center justify-center text-text-primary active:bg-border"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Section */}
      <div className="p-6 pb-10 space-y-4 bg-background">
        {isTie && (
          <div className="flex items-center gap-2 text-danger justify-center">
            <AlertCircle size={16} />
            <span className="text-xs font-medium">No ties allowed — one team must win</span>
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={isTie}
          className={cn(
            "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
            !isTie ? "bg-primary text-white shadow-lg shadow-primary/20 active:scale-[0.98]" : "bg-surface text-text-secondary cursor-not-allowed opacity-50"
          )}
        >
          <span>CONFIRM RESULT</span>
        </button>
      </div>
    </div>
  );
}
