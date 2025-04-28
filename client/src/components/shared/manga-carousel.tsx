import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Content, Genre } from '@shared/schema';
import { MangaCard } from '@/components/shared/manga-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MangaCarouselProps {
  title: string;
  queryKey: string;
  queryFn?: () => Promise<any>;
  data?: (Content & { genres?: Genre[] })[];
  viewAllLink?: string;
  featured?: boolean;
}

export function MangaCarousel({
  title,
  queryKey,
  queryFn,
  data: propData,
  viewAllLink,
  featured = false
}: MangaCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Fetch data if not provided as props
  const { data: queryData, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn,
    enabled: Boolean(!propData)
  });
  
  // Use provided data or query data
  const items = propData || (queryData?.content || queryData || []);
  
  // Function to handle scrolling left
  const scrollLeft = () => {
    const container = document.getElementById(`manga-carousel-${title.replace(/\s+/g, '-').toLowerCase()}`);
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      setScrollPosition(Math.max(0, scrollPosition - scrollAmount));
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Function to handle scrolling right
  const scrollRight = () => {
    const container = document.getElementById(`manga-carousel-${title.replace(/\s+/g, '-').toLowerCase()}`);
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      setScrollPosition(scrollPosition + scrollAmount);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Calculate if we can scroll right
  const canScrollRight = items.length > 0; // Simplification - actual implementation would check overflow
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {viewAllLink && (
          <a href={viewAllLink} className="text-primary font-medium text-sm hover:underline">
            Xem tất cả
          </a>
        )}
      </div>
      
      <div className="relative">
        {/* Carousel controls */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          disabled={scrollPosition <= 0}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md opacity-80 hover:opacity-100",
            scrollPosition <= 0 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md opacity-80 hover:opacity-100",
            !canScrollRight && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        {/* Carousel items */}
        <div
          id={`manga-carousel-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={index} 
                className={cn(
                  "min-w-[260px] max-w-[260px] snap-start bg-muted animate-pulse rounded-lg",
                  featured ? "h-[300px]" : "h-[220px]"
                )}
              />
            ))
          ) : items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="min-w-[260px] max-w-[260px] snap-start">
                <MangaCard 
                  manga={item} 
                  genres={item.genres}
                  featured={featured}
                />
              </div>
            ))
          ) : (
            <div className="min-w-full flex justify-center items-center py-8 text-muted-foreground">
              Không có dữ liệu để hiển thị
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MangaCarousel;
