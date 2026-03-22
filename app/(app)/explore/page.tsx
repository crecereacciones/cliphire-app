'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { formatNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

export default function ExplorePage() {
  const [tab, setTab] = useState<'clippers' | 'creators'>('clippers');
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadUsers(); }, [tab]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', tab === 'clippers' ? 'clipper' : 'creator')
      .order('followers_count', { ascending: false })
      .limit(50);
    setUsers(data || []);
    setLoading(false);
  };

  const filtered = users.filter(u =>
    !search || u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.bio || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Buscar creadores o clippers..."
        className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none text-white placeholder-zinc-500 mb-4 focus:border-brand/50" />

      {/* Tab toggle */}
      <div className="flex bg-surface rounded-xl p-1 border border-surface-border mb-5">
        <button onClick={() => setTab('clippers')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'clippers' ? 'brand-gradient text-white' : 'text-zinc-500'}`}>
          ✂️ Clippers
        </button>
        <button onClick={() => setTab('creators')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'creators' ? 'brand-gradient text-white' : 'text-zinc-500'}`}>
          🎬 Creadores
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500 text-sm animate-pulse">Buscando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-zinc-500 text-sm">
            {search ? 'No se encontraron resultados' : `Aún no hay ${tab === 'clippers' ? 'clippers' : 'creadores'} registrados`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <button key={user.id} onClick={() => router.push(`/profile/${user.id}`)}
              className="w-full flex items-center gap-3 p-3.5 bg-surface rounded-2xl border border-surface-border text-left hover:border-surface-border/80 transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-xl shrink-0">
                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">{user.display_name}</span>
                  {user.verified && <span className="text-green-400 text-xs">✓</span>}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{user.bio || 'Sin bio'}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500">{formatNumber(user.followers_count)} seg.</span>
                  {user.user_type === 'clipper' && user.specialty && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{user.specialty}</span>
                  )}
                  {user.user_type === 'creator' && user.platform && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">{user.platform}</span>
                  )}
                  {user.user_type === 'clipper' && user.price && (
                    <span className="text-[10px] text-zinc-500">💰 {user.price}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
