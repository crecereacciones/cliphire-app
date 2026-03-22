'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [userType, setUserType] = useState<'creator' | 'clipper' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!userType) { toast.error('Selecciona tu tipo de cuenta'); setLoading(false); return; }
        if (!username.trim()) { toast.error('Ingresa un nombre de usuario'); setLoading(false); return; }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
              display_name: displayName || username,
              user_type: userType,
            },
          },
        });
        if (error) throw error;
        toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('¡Bienvenido de vuelta!');
        router.push('/clips');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  // Type selection screen
  if (mode === 'register' && !userType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,59,92,0.07) 0%, #050505 70%)' }}>
        <div className="text-6xl mb-4">✂️</div>
        <h1 className="text-4xl font-black tracking-tight mb-1">
          <span className="brand-gradient-text">Clip</span>
          <span className="text-zinc-500">Hire</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-3 mb-10 max-w-xs leading-relaxed">
          La plataforma que conecta creadores de contenido con los mejores editores de clips
        </p>

        <div className="w-full max-w-xs space-y-3">
          <button onClick={() => setUserType('creator')}
            className="w-full py-4 rounded-2xl font-bold text-white brand-gradient text-base flex items-center justify-center gap-2">
            🎬 Soy Creador de Contenido
          </button>
          <button onClick={() => setUserType('clipper')}
            className="w-full py-4 rounded-2xl font-bold text-white border-2 border-zinc-800 text-base flex items-center justify-center gap-2 hover:border-zinc-600 transition-colors">
            ✂️ Soy Creador de Clips
          </button>
          <button onClick={() => setMode('login')}
            className="text-zinc-500 text-sm mt-4 block mx-auto hover:text-zinc-300 transition-colors">
            Ya tengo cuenta → Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,59,92,0.07) 0%, #050505 70%)' }}>
      <div className="text-5xl mb-4">✂️</div>
      <h1 className="text-3xl font-black tracking-tight mb-1">
        <span className="brand-gradient-text">Clip</span>
        <span className="text-zinc-500">Hire</span>
      </h1>
      <p className="text-zinc-500 text-sm mb-8">
        {mode === 'register' ? `Registro como ${userType === 'creator' ? '🎬 Creador' : '✂️ Clipper'}` : 'Inicia sesión'}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        {mode === 'register' && (
          <>
            <input type="text" placeholder="Nombre de usuario" value={username}
              onChange={e => setUsername(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder-zinc-500 outline-none focus:border-brand transition-colors" />
            <input type="text" placeholder="Nombre para mostrar" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder-zinc-500 outline-none focus:border-brand transition-colors" />
          </>
        )}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
          className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder-zinc-500 outline-none focus:border-brand transition-colors" />
        <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder-zinc-500 outline-none focus:border-brand transition-colors" />

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white brand-gradient text-sm disabled:opacity-50 transition-opacity">
          {loading ? 'Cargando...' : mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>

        <div className="flex gap-2 justify-center pt-2">
          {mode === 'register' ? (
            <>
              <button type="button" onClick={() => { setUserType(null); }} className="text-zinc-500 text-xs hover:text-zinc-300">← Cambiar tipo</button>
              <span className="text-zinc-700">|</span>
              <button type="button" onClick={() => setMode('login')} className="text-brand text-xs hover:text-brand-light">Ya tengo cuenta</button>
            </>
          ) : (
            <button type="button" onClick={() => { setMode('register'); setUserType(null); }} className="text-brand text-xs hover:text-brand-light">Crear cuenta nueva</button>
          )}
        </div>
      </form>
    </div>
  );
}
