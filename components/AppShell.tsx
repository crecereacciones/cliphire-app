'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import type { Profile } from '@/lib/types';

const NAV_ITEMS = [
  { id: 'clips', icon: '▶', label: 'Clips', href: '/clips' },
  { id: 'feed', icon: '📰', label: 'Feed', href: '/feed' },
  { id: 'upload', icon: '+', label: 'Subir', href: '/upload' },
  { id: 'explore', icon: '🔍', label: 'Explorar', href: '/explore' },
  { id: 'profile', icon: '👤', label: 'Perfil', href: '/profile' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, setProfile, setIsLoading } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) setProfile(data as Profile);
      setIsLoading(false);
    };

    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        router.push('/auth');
      }
      if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) setProfile(data as Profile);
        router.push('/clips');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const activeTab = NAV_ITEMS.find(item => pathname.startsWith(item.href))?.id || 'clips';

  return (
    <div className="max-w-lg mx-auto h-screen flex flex-col bg-surface-dark border-x border-surface-border relative">
      {/* Header - hidden on clips page for full immersion */}
      {pathname !== '/clips' && (
        <header className="flex items-center justify-between px-5 py-3 border-b border-surface-border shrink-0">
          <h1 className="text-xl font-black tracking-tight">
            <span className="brand-gradient-text">Clip</span>
            <span className="text-zinc-500">Hire</span>
          </h1>
          {profile && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
              profile.user_type === 'creator'
                ? 'bg-orange-500/10 text-orange-400'
                : 'bg-purple-500/10 text-purple-400'
            }`}>
              {profile.user_type === 'creator' ? '🎬 Creador' : '✂️ Clipper'}
            </span>
          )}
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="flex justify-around py-2 pb-4 border-t border-surface-border shrink-0 bg-surface-dark">
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            onClick={() => router.push(item.href)}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
              activeTab === item.id ? 'text-brand' : 'text-zinc-600'
            }`}>
            {item.id === 'upload' ? (
              <div className="w-10 h-7 rounded-lg brand-gradient flex items-center justify-center text-white font-bold text-lg">
                +
              </div>
            ) : (
              <span className="text-xl">{item.icon}</span>
            )}
            <span className={`text-[10px] ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
