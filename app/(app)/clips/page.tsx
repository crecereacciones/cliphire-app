'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAppStore } from '@/lib/store';
import { formatNumber, timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Clip } from '@/lib/types';
import { toast } from 'sonner';

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartRef = useRef<number | null>(null);
  const { profile } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Load clips
  useEffect(() => {
    const loadClips = async () => {
      const { data, error } = await supabase
        .from('clips')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        // Check which clips user has liked
        if (profile) {
          const { data: likes } = await supabase
            .from('likes')
            .select('clip_id')
            .eq('user_id', profile.id)
            .not('clip_id', 'is', null);
          
          const likedIds = new Set(likes?.map(l => l.clip_id) || []);
          setClips(data.map((c: any) => ({ ...c, liked_by_user: likedIds.has(c.id) })));
        } else {
          setClips(data);
        }
      }
      setLoading(false);
    };
    loadClips();
  }, [profile]);

  // Auto-play current video
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === currentIdx) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });

    // Increment view count
    if (clips[currentIdx]) {
      supabase.from('clips').update({ views_count: clips[currentIdx].views_count + 1 }).eq('id', clips[currentIdx].id).then(() => {});
    }
  }, [currentIdx, clips.length]);

  const navigate = useCallback((dir: 'up' | 'down') => {
    if (dir === 'up' && currentIdx < clips.length - 1) setCurrentIdx(i => i + 1);
    if (dir === 'down' && currentIdx > 0) setCurrentIdx(i => i - 1);
  }, [currentIdx, clips.length]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 30) navigate(e.deltaY > 0 ? 'up' : 'down');
  }, [navigate]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) navigate(diff > 0 ? 'up' : 'down');
    touchStartRef.current = null;
  };

  // Like/unlike
  const toggleLike = async (clip: Clip) => {
    if (!profile) { toast.error('Inicia sesión para dar like'); return; }

    const liked = clip.liked_by_user;
    // Optimistic update
    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, liked_by_user: !liked, likes_count: c.likes_count + (liked ? -1 : 1) } : c));

    if (liked) {
      await supabase.from('likes').delete().eq('user_id', profile.id).eq('clip_id', clip.id);
    } else {
      await supabase.from('likes').insert({ user_id: profile.id, clip_id: clip.id });
    }
  };

  // Load comments
  const loadComments = async (clipId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('clip_id', clipId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const sendComment = async () => {
    if (!profile || !newComment.trim()) return;
    const clip = clips[currentIdx];
    await supabase.from('comments').insert({ user_id: profile.id, clip_id: clip.id, content: newComment.trim() });
    setNewComment('');
    loadComments(clip.id);
    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, comments_count: c.comments_count + 1 } : c));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">✂️</div>
          <p className="text-zinc-500 text-sm">Cargando clips...</p>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black px-8 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h2 className="text-xl font-bold mb-2">Aún no hay clips</h2>
        <p className="text-zinc-500 text-sm mb-6">¡Sé el primero en subir un clip!</p>
        <button onClick={() => router.push('/upload')} className="brand-gradient px-6 py-3 rounded-xl font-bold text-sm">
          Subir mi primer clip
        </button>
      </div>
    );
  }

  const clip = clips[currentIdx];
  const clipProfile = clip.profile;

  return (
    <div ref={containerRef} className="h-full relative bg-black overflow-hidden"
      onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 gradient-top px-5 py-4 flex items-center justify-center">
        <h1 className="text-lg font-black tracking-tight">
          <span className="brand-gradient-text">Clip</span>
          <span className="text-white/40">Hire</span>
        </h1>
      </div>

      {/* Video */}
      <div className="absolute inset-0">
        {clips.map((c, i) => (
          <div key={c.id} className="absolute inset-0 transition-opacity duration-300"
            style={{ opacity: i === currentIdx ? 1 : 0, pointerEvents: i === currentIdx ? 'auto' : 'none' }}>
            <video
              ref={el => { videoRefs.current[i] = el; }}
              src={c.video_url}
              className="clip-video"
              loop muted playsInline
              poster={c.thumbnail_url || undefined}
            />
          </div>
        ))}
      </div>

      {/* Gradient bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 gradient-bottom pointer-events-none" />

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col gap-5 items-center z-10">
        {/* Avatar */}
        <button onClick={() => clipProfile && router.push(`/profile/${clipProfile.id}`)}
          className="w-11 h-11 rounded-full bg-surface border-2 border-brand flex items-center justify-center text-xl">
          {clipProfile?.avatar_url ? (
            <img src={clipProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
          ) : '👤'}
        </button>

        {/* Like */}
        <button onClick={() => toggleLike(clip)} className="flex flex-col items-center gap-1">
          <span className={`text-[28px] transition-transform ${clip.liked_by_user ? 'animate-heart-pop' : 'grayscale brightness-200'}`}>
            {clip.liked_by_user ? '❤️' : '🤍'}
          </span>
          <span className="text-white text-xs font-bold">{formatNumber(clip.likes_count)}</span>
        </button>

        {/* Comments */}
        <button onClick={() => { setShowComments(true); loadComments(clip.id); }}
          className="flex flex-col items-center gap-1">
          <span className="text-[26px]">💬</span>
          <span className="text-white text-xs font-bold">{formatNumber(clip.comments_count)}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <span className="text-[26px]">↗️</span>
          <span className="text-white text-xs font-bold">{formatNumber(clip.shares_count)}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 right-16 z-10">
        <button onClick={() => clipProfile && router.push(`/profile/${clipProfile.id}`)}
          className="flex items-center gap-2 mb-2">
          <span className="font-bold text-[15px]">{clipProfile?.display_name || 'Usuario'}</span>
          {clipProfile?.verified && <span className="text-green-400 text-xs">✓</span>}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            clipProfile?.user_type === 'creator' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {clipProfile?.user_type === 'creator' ? '🎬' : '✂️'}
          </span>
        </button>
        <p className="text-sm leading-relaxed mb-2" style={{ textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>
          {clip.title}
        </p>
        {clip.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {clip.tags.map(tag => (
              <span key={tag} className="text-xs text-blue-400 font-semibold">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
        {clips.slice(0, 15).map((_, i) => (
          <div key={i} className={`rounded-full transition-all ${i === currentIdx ? 'w-1 h-4 bg-brand' : 'w-1 h-1 bg-white/30'}`} />
        ))}
      </div>

      {/* Comments panel */}
      {showComments && (
        <>
          <div className="absolute inset-0 bg-black/60 z-30" onClick={() => setShowComments(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl z-40 animate-slide-up"
            style={{ maxHeight: '60vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <span className="font-bold text-sm">{clip.comments_count} comentarios</span>
              <button onClick={() => setShowComments(false)} className="text-zinc-500 text-lg">✕</button>
            </div>
            <div className="overflow-y-auto px-5 py-3" style={{ maxHeight: 'calc(60vh - 120px)' }}>
              {comments.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-8">Sin comentarios aún. ¡Sé el primero!</p>
              )}
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-sm shrink-0">
                    {c.profile?.avatar_url ? <img src={c.profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : '👤'}
                  </div>
                  <div>
                    <span className="text-xs font-bold">{c.profile?.display_name || 'Usuario'}</span>
                    <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
                    <span className="text-[10px] text-zinc-600 mt-1 block">{timeAgo(c.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            {profile && (
              <div className="flex gap-2 px-5 py-3 border-t border-surface-border">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-surface-dark border border-surface-border text-sm outline-none text-white placeholder-zinc-500" />
                <button onClick={sendComment}
                  className="brand-gradient w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  ↑
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Swipe hint */}
      {currentIdx === 0 && clips.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/30 text-xs text-center z-10 animate-pulse">
          ↑ Desliza para más clips
        </div>
      )}
    </div>
  );
}
