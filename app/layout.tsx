import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050505',
};

export const metadata: Metadata = {
  title: 'ClipHire - Conecta Creadores con Clippers',
  description: 'La plataforma que conecta creadores de contenido con los mejores editores de clips',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-surface-dark">
          {children}
        </div>
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: '#111113',
              border: '1px solid #27272a',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  );
}