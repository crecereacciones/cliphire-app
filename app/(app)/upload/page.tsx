'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAppStore } from '@/lib/store';
import { validateVideo, validateImage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UploadPage() {
  const [mode, setMode] = useState<'clip' | 'post'>('clip');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideo(file);
    if (!validation.valid) { toast.error(validation.error); return; }

    // Check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      if (video.duration > 60) {
        toast.error('El video no puede durar más de 60 segundos');
        URL.revokeObjectURL(video.src);
        return;
      }
      setVideoDuration(Math.round(video.duration));
      setVideoFile(file);
      setVideoPreview(video.src);
    };
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) { toast.error(validation.error); return; }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadClip = async () => {
    if (!profile || !videoFile || !title.trim()) {
      toast.error('Agrega un video y un título');
      return;
    }
    setUploading(true);
    setProgress(10);

    try {
      // Upload video
      const ext = videoFile.name.split('.').pop();
      const videoPath = `${profile.id}/${Date.now()}.${ext}`;
      setProgress(30);

      const { error: upErr } = await supabase.storage.from('clips').upload(videoPath, videoFile);
      if (upErr) throw upErr;
      setProgress(70);

      const { data: urlData } = supabase.storage.from('clips').getPublicUrl(videoPath);

      // Parse tags
      const parsedTags = tags.split(/[,#\s]+/).filter(t => t.trim()).map(t => t.trim().toLowerCase());

      // Insert clip record
      const { error } = await supabase.from('clips').insert({
        user_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        video_url: urlData.publicUrl,
        duration: videoDuration,
        tags: parsedTags,
      });
      if (error) throw error;

      setProgress(100);
      toast.success('¡Clip subido con éxito! 🎬');
      router.push('/clips');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el clip');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadPost = async () => {
    if (!profile || (!postText.trim() && !imageFile)) {
      toast.error('Escribe algo o agrega una imagen');
      return;
    }
    setUploading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${profile.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('images').upload(path, imageFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('posts').insert({
        user_id: profile.id,
        content: postText.trim(),
        image_url: imageUrl,
      });
      if (error) throw error;

      toast.success('¡Publicación creada! 📰');
      router.push('/feed');
    } catch (err: any) {
      toast.error(err.message || 'Error al publicar');
    } finally {
      setUploading(false);
    }
  };

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-bold text-lg mb-2">Inicia sesión para subir contenido</h2>
        <button onClick={() => router.push('/auth')} className="brand-gradient px-6 py-3 rounded-xl font-bold text-sm mt-4">
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-6 pb-8">
      <h2 className="text-xl font-black mb-5">Subir contenido</h2>

      {/* Mode toggle */}
      <div className="flex bg-surface rounded-xl p-1 border border-surface-border mb-6">
        <button onClick={() => setMode('clip')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'clip' ? 'brand-gradient text-white' : 'text-zinc-500'}`}>
          🎬 Clip (video)
        </button>
        <button onClick={() => setMode('post')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'post' ? 'brand-gradient text-white' : 'text-zinc-500'}`}>
          📝 Publicación
        </button>
      </div>

      {mode === 'clip' ? (
        <div className="space-y-4">
          {/* Video upload area */}
          <div onClick={() => videoInputRef.current?.click()}
            className="drop-area rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer">
            {videoPreview ? (
              <div className="relative w-full h-full">
                <video src={videoPreview} className="w-full h-full object-cover rounded-2xl" />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-bold">
                  {videoDuration}s / 60s
                </div>
                <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); setVideoPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center">✕</button>
              </div>
            ) : (
              <>
                <span className="text-4xl mb-2">📹</span>
                <span className="text-sm text-zinc-500">Toca para seleccionar video</span>
                <span className="text-xs text-zinc-600 mt-1">Máximo 60 segundos • MP4, MOV, WebM</span>
              </>
            )}
          </div>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoSelect} className="hidden" />

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del clip *"
            className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none text-white placeholder-zinc-500 focus:border-brand/50" />
          
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" rows={2}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none resize-none text-white placeholder-zinc-500 focus:border-brand/50" />

          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags: gaming, viral, highlights"
            className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none text-white placeholder-zinc-500 focus:border-brand/50" />

          {/* Progress bar */}
          {uploading && (
            <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full brand-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}

          <button onClick={uploadClip} disabled={uploading || !videoFile || !title.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-white brand-gradient text-sm disabled:opacity-40 transition-opacity">
            {uploading ? `Subiendo... ${progress}%` : '🚀 Subir Clip'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea value={postText} onChange={e => setPostText(e.target.value)}
            placeholder="¿Qué quieres compartir?" rows={4}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none resize-none text-white placeholder-zinc-500 focus:border-brand/50" />

          <div onClick={() => imageInputRef.current?.click()}
            className="drop-area rounded-2xl h-28 flex flex-col items-center justify-center cursor-pointer">
            {imagePreview ? (
              <div className="relative w-full h-full">
                <img src={imagePreview} className="w-full h-full object-cover rounded-2xl" alt="" />
                <button onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-sm flex items-center justify-center">✕</button>
              </div>
            ) : (
              <>
                <span className="text-3xl mb-1">📷</span>
                <span className="text-xs text-zinc-500">Agregar imagen (opcional)</span>
              </>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          <button onClick={uploadPost} disabled={uploading || (!postText.trim() && !imageFile)}
            className="w-full py-3.5 rounded-xl font-bold text-white brand-gradient text-sm disabled:opacity-40 transition-opacity">
            {uploading ? 'Publicando...' : '📤 Publicar'}
          </button>
        </div>
      )}
    </div>
  );
}
