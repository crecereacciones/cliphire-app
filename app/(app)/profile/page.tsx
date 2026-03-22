'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAppStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function MyProfilePage() {
  const { profile, setProfile } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: '', bio: '', platform: '', category: '', budget: '',
    specialty: '', tools: '', price: '', turnaround: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const startEdit = () => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      platform: profile.platform || '',
      category: profile.category || '',
      budget: profile.budget || '',
      specialty: profile.specialty || '',
      tools: profile.tools || '',
      price: profile.price || '',
      turnaround: profile.turnaround || '',
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${profile.id}/avatar.${ext}`;
        await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = data.publicUrl + '?t=' + Date.now();
      }

      const updates: any = {
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        avatar_url: avatarUrl,
      };

      if (profile.user_type === 'creator') {
        updates.platform = form.platform;
        updates.category = form.category;
        updates.budget = form.budget;
      } else {
        updates.specialty = form.specialty;
        updates.tools = form.tools;
        updates.price = form.price;
        updates.turnaround = form.turnaround;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;

      setProfile({ ...profile, ...updates });
      setEditing(false);
      setAvatarFile(null);
      toast.success('¡Perfil actualizado!');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push('/auth');
  };

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-zinc-500 text-sm animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  const isCr = profile.user_type === 'creator';

  return (
    <div className="h-full overflow-y-auto">
      {/* Banner */}
      <div className={`h-28 relative ${isCr ? 'brand-gradient' : ''}`}
        style={!isCr ? { background: 'linear-gradient(135deg, #a78bfa, #6d28d9)' } : {}}>
        <div className="absolute -bottom-9 left-5 w-[76px] h-[76px] rounded-full bg-surface-dark border-4 border-surface-dark flex items-center justify-center text-3xl overflow-hidden">
          {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : '👤'}
        </div>
      </div>

      <div className="pt-12 px-5 pb-24">
        {!editing ? (
          <>
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">{profile.display_name}</h2>
                  {profile.verified && <span className="text-green-400 text-sm">✓</span>}
                </div>
                <p className="text-xs text-zinc-500">@{profile.username}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                isCr ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'
              }`}>{isCr ? '🎬 Creador' : '✂️ Clipper'}</span>
            </div>

            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{profile.bio || 'Sin bio aún'}</p>

            <div className="flex gap-6 mt-4 text-sm">
              <span><strong>{formatNumber(profile.followers_count)}</strong> <span className="text-zinc-500">seguidores</span></span>
              <span><strong>{formatNumber(profile.following_count)}</strong> <span className="text-zinc-500">siguiendo</span></span>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              {isCr ? (
                <>
                  <InfoCard label="📺 Plataforma" value={profile.platform || 'No definida'} />
                  <InfoCard label="🏷️ Categoría" value={profile.category || 'No definida'} />
                  <InfoCard label="💰 Presupuesto" value={profile.budget || 'No definido'} />
                </>
              ) : (
                <>
                  <InfoCard label="🎯 Especialidad" value={profile.specialty || 'No definida'} />
                  <InfoCard label="🛠️ Herramientas" value={profile.tools || 'No definidas'} />
                  <InfoCard label="💰 Precio" value={profile.price || 'No definido'} />
                  <InfoCard label="⚡ Entrega" value={profile.turnaround || 'No definido'} />
                </>
              )}
            </div>

            <button onClick={startEdit}
              className="w-full mt-5 py-3 rounded-xl font-bold text-sm border border-surface-border text-white hover:bg-surface transition-colors">
              ✏️ Editar perfil
            </button>

            <button onClick={logout}
              className="w-full mt-3 py-3 rounded-xl font-bold text-sm border border-red-500/30 text-red-400 hover:bg-red-500/5 transition-colors">
              Cerrar sesión
            </button>
          </>
        ) : (
          /* Edit form */
          <div className="space-y-3">
            <h3 className="font-bold text-lg mb-2">Editar perfil</h3>

            <label className="block">
              <span className="text-xs text-zinc-500 mb-1 block">Foto de perfil</span>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                className="text-xs text-zinc-400" />
            </label>

            <Input label="Nombre" value={form.display_name} onChange={v => setForm({...form, display_name: v})} />
            <label className="block">
              <span className="text-xs text-zinc-500 mb-1 block">Bio</span>
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none resize-none text-white placeholder-zinc-500 focus:border-brand/50" />
            </label>

            {isCr ? (
              <>
                <Input label="Plataforma (Twitch, YouTube, etc.)" value={form.platform} onChange={v => setForm({...form, platform: v})} />
                <Input label="Categoría (Gaming, Podcast, etc.)" value={form.category} onChange={v => setForm({...form, category: v})} />
                <Input label="Presupuesto mensual ($)" value={form.budget} onChange={v => setForm({...form, budget: v})} />
              </>
            ) : (
              <>
                <Input label="Especialidad" value={form.specialty} onChange={v => setForm({...form, specialty: v})} />
                <Input label="Herramientas (Premiere, CapCut, etc.)" value={form.tools} onChange={v => setForm({...form, tools: v})} />
                <Input label="Precio por clip" value={form.price} onChange={v => setForm({...form, price: v})} />
                <Input label="Tiempo de entrega" value={form.turnaround} onChange={v => setForm({...form, turnaround: v})} />
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-surface-border text-zinc-400">Cancelar</button>
              <button onClick={saveProfile} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm brand-gradient text-white disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl p-3.5 border border-surface-border">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-sm font-semibold mt-1 truncate">{value}</div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500 mb-1 block">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-sm outline-none text-white placeholder-zinc-500 focus:border-brand/50" />
    </label>
  );
}
