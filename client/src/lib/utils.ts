import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return 'fas fa-file-pdf';
  if (fileType.includes('image')) return 'fas fa-image';
  if (fileType.includes('video')) return 'fas fa-video';
  if (fileType.includes('audio')) return 'fas fa-music';
  if (fileType.includes('zip') || fileType.includes('archive')) return 'fas fa-file-archive';
  if (fileType.includes('code') || fileType.includes('text')) return 'fas fa-file-code';
  return 'fas fa-file';
}

export function getFileIconColor(fileType: string): string {
  if (fileType.includes('pdf')) return 'text-red-600';
  if (fileType.includes('image')) return 'text-purple-600';
  if (fileType.includes('video')) return 'text-blue-600';
  if (fileType.includes('audio')) return 'text-green-600';
  if (fileType.includes('zip') || fileType.includes('archive')) return 'text-yellow-600';
  if (fileType.includes('code') || fileType.includes('text')) return 'text-green-600';
  return 'text-gray-600';
}

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
