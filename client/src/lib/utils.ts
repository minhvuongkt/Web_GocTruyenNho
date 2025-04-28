import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getContentTypeLabel(type: 'manga' | 'novel'): string {
  return type === 'manga' ? 'Truyện tranh' : 'Truyện chữ';
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'ongoing':
      return 'Đang tiến hành';
    case 'completed':
      return 'Hoàn thành';
    case 'hiatus':
      return 'Tạm dừng';
    default:
      return status;
  }
}

export function generateQRPaymentContent(accountNumber: string, amount: number, message: string): string {
  // Simple implementation - in reality would integrate with VietQR API
  return `${accountNumber}|${amount}|${message}`;
}

// Generate random mock image URL for content covers
export function getRandomCoverImage(type: 'manga' | 'novel'): string {
  const mangaCovers = [
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1604134967494-8a9ed3adea0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1589305841689-d3347adba5f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80'
  ];
  
  const novelCovers = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1465929639680-64ee080eb3ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1601850494430-a1586a901cba?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80',
    'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80'
  ];
  
  const covers = type === 'manga' ? mangaCovers : novelCovers;
  const randomIndex = Math.floor(Math.random() * covers.length);
  return covers[randomIndex];
}

// Generate placeholder manga page images
export function getMangaPageImages(): string[] {
  return [
    'https://images.unsplash.com/photo-1534313314376-a72289b6181e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=1000&q=80',
    'https://images.unsplash.com/photo-1611457194403-d3aca4cf9d11?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=1000&q=80'
  ];
}
