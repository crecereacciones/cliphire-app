'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAppStore } from '@/lib/store';
import { formatNumber, timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Post } from '@/lib/types';
import { toast } from 'sonner';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const { profile } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadPosts(); }, [profile]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && profile) {
      const { data: likes } = await supabase
        .from('likes').select('post_id').eq('user_id', profile.id).not('post_id', 'is', null);
      const likedIds = new Set(likes?.map(l => l.post_id) || []);
      setPosts(data.map((p: any) => ({ ...p, liked_by_user: likedIds.has(p.id) })));
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPostImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const createPost = async () => {
    if (!profile || (!newPostText.trim() && !postImage)) return;
    setPosting(true);

    try {
      let imageUrl = null;
      if (postImage) {
        const ext = postImage.name.split('.').pop();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('images').upload(path, postImage);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('posts').insert({
        user_id: profile.id,
        content: newPostText.trim(),
        image_url: imageUrl,
      });
      if (error) throw error;

      setNewPostText('');
      setPostImage(null);
      setPostImagePreview(null);
      toast.success('¡Publicación creada!');
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || 'Error al publicar');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: Post) => {
    if (!profile) { toast.error('Inicia sesión para dar like'); return; }
    const liked = post.liked_by_user;
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, liked_by_user: !liked, likes_count: p.likes_count + (liked ? -1 : 1) } : p));

    if (liked) {
      await supabase.from('likes').delete().eq('user_id', profile.id).eq('post_id', post.id);
    } else {
      await supabase.from('likes').insert({ user_id: profile.id, post_id: post.id });
    }
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from('comments').select('*, profile:profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
    setComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const sendComment = async (postId: string) => {
    if (!profile || !newComment.trim()) return;
    await supabase.from('comments').insert({ user_id: profile.id, post_id: postId, content: newComment.trim() });
    setNewComment('');
    loadComments(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Post composer */}
      {profile && (
        <div className="p-4 border-b border-surface-border">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-lg shrink-0">
              {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : '👤'}
            </div>
            <div className="flex-1">
              <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)}
                placeholder="¿Qué quieres compartir?" rows={2}
                className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-sm resize-none outline-none text-white placeholder-zinc-500 focus:border-brand/50 transition-colors" />
              
              {postImagePreview && (
                <div className="relative mt-2">
                  <img src={postImagePreview} className="w-full h-40 object-cover rounded-xl" alt="" />
                  <button onClick={() => { setPostImage(null); setPostImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center">✕</button>
                </div>
              )}

              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-3">
                  <label className="cursor-pointer text-lg opacity-50 hover:opacity-100 transition-opacity">
                    📷 <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
                <button onClick={createPost} disabled={posting || (!newPostText.trim() && !postImage)}
                  className="brand-gradient px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-opacity">
                  {posting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500 text-sm animate-pulse">Cargando feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="text-4xl mb-3">📰</div>
          <h3 className="font-bold text-lg mb-1">Feed vacío</h3>
          <p className="text-zinc-500 text-sm">¡Sé el primero en publicar algo!</p>
        </div>
      ) : (
        posts.map(post => {
          const p = post.profile as any;
          return (
            <div key={post.id} className="p-4 border-b border-surface-border">
              <div className="flex gap-3 items-center mb-3">
                <button onClick={() => p && router.push(`/profile/${p.id}`)}
                  className="w-10 h-10 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-lg shrink-0">
                  {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : '👤'}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => p && router.push(`/profile/${p.id}`)} className="font-bold text-sm hover:underline">
                      {p?.display_name || 'Usuario'}
                    </button>
                    {p?.verified && <span className="text-green-400 text-xs">✓</span>}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      p?.user_type === 'creator' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>{p?.user_type === 'creator' ? 'Creador' : 'Clipper'}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{timeAgo(post.created_at)}</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-zinc-300 mb-3">{post.content}</p>

              {post.image_url && (
                <img src={post.image_url} className="w-full rounded-xl mb-3 max-h-80 object-cover" alt="" />
              )}

              <div className="flex gap-5">
                <button onClick={() => toggleLike(post)}
                  className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${post.liked_by_user ? 'text-brand' : 'text-zinc-500'}`}>
                  {post.liked_by_user ? '❤️' : '🤍'} {formatNumber(post.likes_count)}
                </button>
                <button onClick={() => { setShowComments(showComments === post.id ? null : post.id); if (showComments !== post.id) loadComments(post.id); }}
                  className="text-sm font-semibold text-zinc-500 flex items-center gap-1.5">
                  💬 {formatNumber(post.comments_count)}
                </button>
                <button className="text-sm font-semibold text-zinc-500">↗️ Compartir</button>
              </div>

              {/* Comments */}
              {showComments === post.id && (
                <div className="mt-3 pt-3 border-t border-surface-border">
                  {(comments[post.id] || []).map((c: any) => (
                    <div key={c.id} className="flex gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-surface-light border border-surface-border flex items-center justify-center text-xs shrink-0">
                        {c.profile?.avatar_url ? <img src={c.profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : '👤'}
                      </div>
                      <div className="bg-surface-dark rounded-xl px-3 py-2 border border-surface-border">
                        <span className="text-xs font-bold">{c.profile?.display_name}</span>
                        <p className="text-xs text-zinc-300 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {profile && (
                    <div className="flex gap-2 mt-2">
                      <input value={newComment} onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendComment(post.id)}
                        placeholder="Comenta..." className="flex-1 px-3 py-2 rounded-full bg-surface-dark border border-surface-border text-xs outline-none text-white placeholder-zinc-500" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
