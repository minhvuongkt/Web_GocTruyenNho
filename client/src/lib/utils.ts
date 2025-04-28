import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number | null | undefined, formatString: string = 'PP'): string {
  if (!date) return 'N/A';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export function formatCurrency(amount: number, locale: string = 'vi-VN', currency: string = 'VND'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function calculateDiscount(amount: number, discountTiers: { minAmount: number, discountPercent: number }[]): number {
  const applicableTier = [...discountTiers]
    .sort((a, b) => b.minAmount - a.minAmount)
    .find(tier => amount >= tier.minAmount);
  
  if (!applicableTier) return 0;
  
  return applicableTier.discountPercent;
}

export function getPaymentStatusColor(status: 'pending' | 'completed' | 'failed'): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function getStatusLabel(status: 'pending' | 'completed' | 'failed'): string {
  switch (status) {
    case 'pending':
      return 'Đang xử lý';
    case 'completed':
      return 'Hoàn thành';
    case 'failed':
      return 'Thất bại';
    default:
      return 'Không xác định';
  }
}

export function parseQueryString(query: string): Record<string, string> {
  const params = new URLSearchParams(query);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

export function buildQueryString(params: Record<string, any>): string {
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, String(value));
    }
  });
  
  return urlParams.toString();
}

export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export function getRandomCoverImage(): string {
  // Default placeholder images for content without actual cover images
  const placeholders = [
    '/images/placeholder/cover1.jpg',
    '/images/placeholder/cover2.jpg',
    '/images/placeholder/cover3.jpg',
    '/images/placeholder/cover4.jpg',
    '/images/placeholder/cover5.jpg',
  ];
  
  // Return a random placeholder image
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

export function getMangaPageImages(chapterId: number): string[] {
  // This is a placeholder function that should be replaced with actual API call
  // For now, we'll return some placeholder manga page images
  const placeholderPages = [
    '/images/placeholder/manga-page1.jpg',
    '/images/placeholder/manga-page2.jpg',
    '/images/placeholder/manga-page3.jpg',
    '/images/placeholder/manga-page4.jpg',
    '/images/placeholder/manga-page5.jpg',
  ];
  
  // Generate 10-20 random pages for testing
  const pageCount = 10 + Math.floor(Math.random() * 10);
  const pages: string[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    pages.push(placeholderPages[i % placeholderPages.length]);
  }
  
  return pages;
}