'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAppStore } from '@/lib/store';
import { formatNumber, timeAgo } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import type { Profile, Clip, Contract } from '@/lib/types';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<Profile | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [hiredClippers, setHiredClippers] = useState<Profile[]>([]);
  const [worksFor, setWorksFor] = useState<Profile[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireMsg, setHireMsg] = useState('');
  const [hireSent, setHireSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (profile && userId === profile.id) { router.push('/profile'); return; }
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);

    // Get user profile
    const { data: userData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!userData) { setLoading(false); return; }
    setUser(userData as Profile);

    // Get user's clips
    const { data: clipsData } = await supabase.from('clips').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    setClips(clipsData || []);

    // Check follow status
    if (profile) {
      const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', profile.id).eq('following_id', userId).single();
      setIsFollowing(!!followData);

      // Check if already sent contract
      const { data: contractData } = await supabase.from('contracts')
        .select('id')
        .or(`creator_id.eq.${profile.id},clipper_id.eq.${profile.id}`)
        .or(`creator_id.eq.${userId},clipper_id.eq.${userId}`)
        .limit(1);
      setHireSent((contractData || []).length > 0);
    }

    // If creator, get hired clippers
    if (userData.user_type === 'creator') {
      const { data: contracts } = await supabase.from('contracts')
        .select('clipper:profiles!contracts_clipper_id_fkey(*)')
        .eq('creator_id', userId)
        .eq('status', 'accepted');
      setHiredClippers(contracts?.map((c: any) => c.clipper).filter(Boolean) || []);
    }

    // If clipper, get who they work for
    if (userData.user_type === 'clipper') {
      const { data: contracts } = await supabase.from('contracts')
        .select('creator:profiles!contracts_creator_id_fkey(*)')
        .eq('clipper_id', userId)
        .eq('status', 'accepted');
      setWorksFor(contracts?.map((c: any) => c.creator).filter(Boolean) || []);
    }

    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!profile) { toast.error('Inicia sesión para seguir'); return; }
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', profile.id).eq('following_id', userId);
      setIsFollowing(false);
      if (user) setUser({ ...user, followers_count: user.followers_count - 1 });
    } else {
      await supabase.from('follows').insert({ follower_id: profile.id, following_id: userId });
      setIsFollowing(true);
      if (user) setUser({ ...user, followers_count: user.followers_count + 1 });
    }
  };

  const sendContract = async () => {
    if (!profile || !user) return;
    const isHiring = user.user_type === 'clipper' && profile.user_type === 'creator';

    try {
      const { error } = await supabase.from('contracts').insert({
        creator_id: isHiring ? profile.id : user.id,
        clipper_id: isHiring ? user.id : profile.id,
        message: hireMsg.trim() || null,
      });
      if (error) throw error;

      setHireSent(true);
      setShowHireModal(false);
      toast.success(isHiring ? '¡Propuesta enviada!' : '¡Postulación enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar');
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><p className="text-zinc-500 text-sm animate-pulse">Cargando perfil...</p></div>;
  }

  if (!user) {
    return <div className="h-full flex items-center justify-center"><p className="text-zinc-500">Usuario no encontrado</p></div>;
  }

  const isCr = user.user_type === 'creator';
  const canHire = profile && user.user_type === 'clipper' && profile.user_type === 'creator';
  const canApply = profile && user.user_type === 'creator' && profile.user_type === 'clipper';

  return (
    <div className="h-full overflow-y-auto">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-3 text-brand text-sm font-semibold border-b border-surface-border w-full">
        ← Volver
      </button>

      {/* Banner */}
      <div className={`h-28 relative ${isCr ? 'brand-gradient' : ''}`}
        style={!isCr ? { background: 'linear-gradient(135deg, #a78bfa, #6d28d9)' } : {}}>
        <div className="absolute -bottom-9 left-5 w-[76px] h-[76px] rounded-full bg-surface-dark border-4 border-surface-dark flex items-center justify-center text-3xl overflow-hidden">
          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : '👤'}
        </div>
      </div>

      <div className="pt-12 px-5 pb-24">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{user.display_name}</h2>
              {user.verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">✓ Verificado</span>}
            </div>
            <p className="text-xs text-zinc-500">@{user.username}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isCr ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
            {isCr ? '🎬 Creador' : '✂️ Clipper'}
          </span>
        </div>

        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{user.bio || 'Sin bio'}</p>

        <div className="flex gap-6 mt-4 text-sm">
          <span><strong>{formatNumber(user.followers_count)}</strong> <span className="text-zinc-500">seguidores</span></span>
          <span><strong>{formatNumber(user.following_count)}</strong> <span className="text-zinc-500">siguiendo</span></span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <button onClick={toggleFollow}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isFollowing ? 'border border-surface-border text-zinc-400' : 'brand-gradient text-white'
            }`}>
            {isFollowing ? 'Siguiendo ✓' : 'Seguir'}
          </button>
          {(canHire || canApply) && (
            <button onClick={() => setShowHireModal(true)} disabled={hireSent}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm ${hireSent ? 'border border-green-500/30 text-green-400' : 'border border-brand text-brand'}`}>
              {hireSent ? '✓ Enviado' : canHire ? '✂️ Contratar' : '📩 Postularme'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          {isCr ? (
            <>
              <StatCard label="📺 Plataforma" value={user.platform || '—'} />
              <StatCard label="💰 Presupuesto" value={user.budget || '—'} />
            </>
          ) : (
            <>
              <StatCard label="💰 Precio" value={user.price || '—'} />
              <StatCard label="⚡ Entrega" value={user.turnaround || '—'} />
              <StatCard label="🎞️ Portfolio" value={`${user.portfolio_count} clips`} />
              <StatCard label="🛠️ Herramientas" value={user.tools || '—'} />
            </>
          )}
        </div>

        {/* Hired clippers */}
        {isCr && hiredClippers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">✂️ Clippers Contratados</h3>
            {hiredClippers.map(cl => (
              <button key={cl.id} onClick={() => router.push(`/profile/${cl.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-surface-border mb-2 text-left">
                <div className="w-9 h-9 rounded-full bg-surface-light border-2 border-green-500 flex items-center justify-center text-sm overflow-hidden">
                  {cl.avatar_url ? <img src={cl.avatar_url} className="w-full h-full object-cover" alt="" /> : '👤'}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm">{cl.display_name}</span>
                  <p className="text-xs text-zinc-500">{cl.specialty}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">Verificado ✓</span>
              </button>
            ))}
          </div>
        )}

        {/* Works for */}
        {!isCr && worksFor.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">🎬 Trabaja con</h3>
            {worksFor.map(cr => (
              <button key={cr.id} onClick={() => router.push(`/profile/${cr.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-surface-border mb-2 text-left">
                <div className="w-9 h-9 rounded-full bg-surface-light border-2 border-brand flex items-center justify-center text-sm overflow-hidden">
                  {cr.avatar_url ? <img src={cr.avatar_url} className="w-full h-full object-cover" alt="" /> : '👤'}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm">{cr.display_name}</span>
                  <p className="text-xs text-zinc-500">{cr.platform} • {cr.category}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand">Verificado ✓</span>
              </button>
            ))}
          </div>
        )}

        {/* User's clips */}
        {clips.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">🎬 Clips</h3>
            <div className="grid grid-cols-2 gap-2">
              {clips.map(clip => (
                <div key={clip.id} className="rounded-xl overflow-hidden bg-surface border border-surface-border aspect-[9/12] relative">
                  {clip.thumbnail_url ? (
                    <img src={clip.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <video src={clip.video_url} className="w-full h-full object-cover" muted />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 gradient-bottom p-2 pt-6">
                    <p className="text-[11px] font-semibold leading-tight line-clamp-2">{clip.title}</p>
                    <div className="text-[10px] text-zinc-400 mt-1">❤️ {formatNumber(clip.likes_count)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hire modal */}
      {showHireModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowHireModal(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-surface rounded-t-3xl z-50 p-6 border-t border-surface-border animate-slide-up">
            <div className="w-10 h-1 bg-surface-border rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-xl overflow-hidden">
                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : '👤'}
              </div>
              <div>
                <p className="font-bold">{canHire ? `Contratar a ${user.display_name}` : `Postularte con ${user.display_name}`}</p>
                <p className="text-xs text-zinc-500">{canHire ? user.price : user.budget}</p>
              </div>
            </div>
            <textarea value={hireMsg} onChange={e => setHireMsg(e.target.value)}
              placeholder={canHire ? 'Describe qué tipo de clips necesitas...' : '¿Por qué eres el clipper ideal?'}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-dark border border-surface-border text-sm outline-none resize-none text-white placeholder-zinc-500 mb-4" />
            <button onClick={sendContract}
              className="w-full py-3.5 rounded-xl font-bold text-white brand-gradient text-sm">
              {canHire ? '✂️ Enviar propuesta' : '📩 Enviar postulación'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl p-3.5 border border-surface-border">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-sm font-semibold mt-1 truncate">{value}</div>
    </div>
  );
}
