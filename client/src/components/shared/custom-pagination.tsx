import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CustomPagination({ currentPage, totalPages, onPageChange }: CustomPaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Create an array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Maximum number of page links to show
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Determine the start and end of the middle section
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end to ensure we always show maxPagesToShow - 2 pages in the middle
      // (minus 2 because we always show first and last page)
      const pagesToShow = maxPagesToShow - 2;
      if (end - start + 1 < pagesToShow) {
        if (currentPage <= (totalPages / 2)) {
          // We're closer to the start, expand end
          end = Math.min(totalPages - 1, start + pagesToShow - 1);
        } else {
          // We're closer to the end, expand start
          start = Math.max(2, end - pagesToShow + 1);
        }
      }
      
      // Add ellipsis before middle section if needed
      if (start > 2) {
        pageNumbers.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis after middle section if needed
      if (end < totalPages - 1) {
        pageNumbers.push('ellipsis-end');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevious} 
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
        </PaginationItem>
        
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          return (
            <PaginationItem key={page}>
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            </PaginationItem>
          );
        })}
        
        <PaginationItem>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNext} 
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}