'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { Plus, Trash2, Users, Target, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Player, ScheduleDepth } from '@/lib/engine/types';
import { Modal } from '@/components/ui/Modal';

export default function SetupPage() {
  const router = useRouter();
  const { session, createSession } = useSessionStore();
  const [title, setTitle] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '' },
    { id: '2', name: '' },
    { id: '3', name: '' },
    { id: '4', name: '' },
  ]);
  const [depth, setDepth] = useState<ScheduleDepth>('one-pass');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const addPlayer = () => {
    setPlayers([...players, { id: crypto.randomUUID(), name: '' }]);
  };

  const removePlayer = (id: string) => {
    if (players.length > 4) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayer = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const handleCreate = () => {
    const validPlayers = players.filter(p => p.name.trim() !== '');
    if (validPlayers.length < 4) return;
    
    if (session) {
      setIsConfirmModalOpen(true);
    } else {
      createSession(title || 'New Session', validPlayers, depth);
      router.push('/session');
    }
  };

  const confirmCreate = () => {
    const validPlayers = players.filter(p => p.name.trim() !== '');
    createSession(title || 'New Session', validPlayers, depth);
    router.push('/session');
  };

  const isValid = players.filter(p => p.name.trim() !== '').length >= 4;

  return (
    <div className="p-6 max-w-lg mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-tight">SETUP SESSION</h1>
        <p className="text-sm text-text-secondary">Configure your pool session</p>
      </header>

      <div className="space-y-8">
        {/* Session Name */}
        <section>
          <label className="text-[10px] font-display font-bold tracking-widest text-text-secondary uppercase mb-3 block">SESSION NAME</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Pool"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary outline-none transition-colors"
          />
        </section>

        {/* Players Section */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <label className="text-[10px] font-display font-bold tracking-widest text-text-secondary uppercase">PLAYERS</label>
            <span className="text-[10px] font-bold text-text-secondary opacity-60">Min 4 Players</span>
          </div>
          
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {players.map((player, idx) => (
              <div key={player.id} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, e.target.value)}
                    placeholder={`Player ${idx + 1} Name`}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary outline-none transition-colors pl-10"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40">
                    <Users size={14} />
                  </div>
                </div>
                {players.length > 4 && (
                  <button 
                    onClick={() => removePlayer(player.id)}
                    className="w-12 h-12 flex items-center justify-center bg-surface border border-border rounded-xl text-text-secondary hover:text-danger hover:border-danger/30 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addPlayer}
            className="w-full mt-4 py-3 border border-dashed border-border rounded-xl text-text-secondary text-xs font-bold hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            ADD PLAYER
          </button>
        </section>

        {/* Schedule Depth */}
        <section>
          <label className="text-[10px] font-display font-bold tracking-widest text-text-secondary uppercase mb-3 block">MATCH DENSITY</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDepth('one-pass')}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all",
                depth === 'one-pass' ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "bg-surface border-border"
              )}
            >
              <div className={cn("text-xs font-bold mb-1", depth === 'one-pass' ? "text-primary" : "text-text-primary")}>QUICK SESSION</div>
              <div className="text-[10px] text-text-secondary leading-tight">Rotation-focused, fewer matches.</div>
            </button>
            <button
              onClick={() => setDepth('full')}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all",
                depth === 'full' ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "bg-surface border-border"
              )}
            >
              <div className={cn("text-xs font-bold mb-1", depth === 'full' ? "text-primary" : "text-text-primary")}>FULL ROTATION</div>
              <div className="text-[10px] text-text-secondary leading-tight">Every possible team combination.</div>
            </button>
          </div>
        </section>

        {/* Start Button */}
        <button
          onClick={handleCreate}
          disabled={!isValid}
          className={cn(
            "w-full py-5 rounded-2xl font-display font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3",
            isValid 
              ? "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]" 
              : "bg-surface-dim text-text-secondary border border-border opacity-50 cursor-not-allowed"
          )}
        >
          <Play size={18} fill="currentColor" />
          START SESSION
        </button>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Overwrite Session?"
        variant="danger"
        footer={
          <>
            <button 
              onClick={() => setIsConfirmModalOpen(false)}
              className="flex-1 py-3 bg-surface border border-border rounded-xl font-bold text-xs"
            >
              CANCEL
            </button>
            <button 
              onClick={() => {
                setIsConfirmModalOpen(false);
                confirmCreate();
              }}
              className="flex-1 py-3 bg-danger text-white rounded-xl font-bold text-xs shadow-lg shadow-danger/20"
            >
              OVERWRITE
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            You already have an active session. Starting a new one will clear all current stats and schedule.
          </p>
        </div>
      </Modal>
    </div>
  );
}
