import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return n.toString();
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function getVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => {
      video.currentTime = 1;
    };
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(video.src);
    };
  });
}

export function validateVideo(file: File): { valid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato no soportado. Usa MP4, MOV o WebM.' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'El video no puede superar 100MB.' };
  }
  return { valid: true };
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato no soportado. Usa JPG, PNG, WebP o GIF.' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'La imagen no puede superar 10MB.' };
  }
  return { valid: true };
}
