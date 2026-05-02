'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ArrowRight, Circle } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import { cn } from '@/lib/utils';
import { ScheduleDepth, Player } from '@/lib/engine/types';

const PLAYER_COLORS = [
  'bg-green-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
];

export default function SetupPage() {
  const router = useRouter();
  const { session, createSession, resetSession } = useSessionStore();
  const [players, setPlayers] = useState<string[]>(['', '', '', '']);
  const [depth, setDepth] = useState<ScheduleDepth>('one-pass');

  useEffect(() => {
    // If a session already exists and is active, maybe we should ask to resume.
    // For simplicity in Phase 3, we'll just allow creating a new one or resuming.
  }, [session]);

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 4) {
      const newPlayers = [...players];
      newPlayers.splice(index, 1);
      setPlayers(newPlayers);
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const handleGenerate = () => {
    if (session && !confirm('Are you sure you want to start a new session? Current progress will be lost.')) {
      return;
    }

    const validPlayers: Player[] = players
      .filter(name => name.trim() !== '')
      .map(name => ({
        id: crypto.randomUUID(),
        name: name.trim(),
      }));

    if (validPlayers.length < 4) return;

    createSession(validPlayers, depth);
    router.push('/session');
  };

  const isValid = players.filter(n => n.trim() !== '').length >= 4;

  return (
    <div className="min-h-screen bg-background text-text-primary px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight text-primary">RACK UP</h1>
        <p className="text-text-secondary text-sm">Set up your session</p>
      </div>

      {/* Players Section */}
      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xs font-display font-semibold tracking-widest text-text-secondary uppercase">PLAYERS</h2>
          <span className="text-xs text-text-secondary">{players.filter(n => n.trim() !== '').length} / 8 players</span>
        </div>

        <div className="space-y-3">
          {players.map((name, index) => (
            <div key={index} className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-border shadow-sm">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm", PLAYER_COLORS[index % PLAYER_COLORS.length])}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => updatePlayer(index, e.target.value)}
                placeholder={`Player ${index + 1} name`}
                className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
              />
              {players.length > 4 && (
                <button onClick={() => removePlayer(index)} className="text-text-secondary hover:text-danger p-1">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}

          {players.length < 8 && (
            <button
              onClick={addPlayer}
              className="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-secondary flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
            >
              <Plus size={18} />
              <span>Add Player</span>
            </button>
          )}
        </div>
      </section>

      {/* Schedule Section */}
      <section className="mb-10">
        <h2 className="text-xs font-display font-semibold tracking-widest text-text-secondary uppercase mb-4">SCHEDULE</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDepth('one-pass')}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              depth === 'one-pass' ? "bg-surface border-primary ring-1 ring-primary" : "bg-surface/50 border-border opacity-60"
            )}
          >
            <div className="font-bold mb-1">One Pass</div>
            <div className="text-xs text-text-secondary">Balanced & Quick</div>
          </button>
          <button
            onClick={() => setDepth('full')}
            className={cn(
              "p-4 rounded-lg border text-left transition-all",
              depth === 'full' ? "bg-surface border-primary ring-1 ring-primary" : "bg-surface/50 border-border opacity-60"
            )}
          >
            <div className="font-bold mb-1">Full Rotation</div>
            <div className="text-xs text-text-secondary">All Combinations</div>
          </button>
        </div>
      </section>

      {/* CTA */}
      <button
        onClick={handleGenerate}
        disabled={!isValid}
        className={cn(
          "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
          isValid ? "bg-primary text-white shadow-lg shadow-primary/20 active:scale-[0.98]" : "bg-surface text-text-secondary cursor-not-allowed"
        )}
      >
        <span>GENERATE SCHEDULE</span>
        <ArrowRight size={20} />
      </button>

      {session && (
        <button
          onClick={() => router.push('/session')}
          className="w-full mt-4 text-primary text-sm font-medium hover:underline"
        >
          Resume current session
        </button>
      )}
    </div>
  );
}
