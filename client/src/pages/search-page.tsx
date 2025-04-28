import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ContentCard } from '@/components/content/content-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { parseQueryString, buildQueryString, debounce } from '@/lib/utils';
import { Search, Filter, X } from 'lucide-react';

type Content = {
  id: number;
  title: string;
  type: 'manga' | 'novel';
  status: 'ongoing' | 'completed' | 'hiatus';
  createdAt: string;
  thumbnail?: string;
  views: number;
};

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const queryParams = parseQueryString(location.split('?')[1] || '');
  
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced'>(
    queryParams.advanced === 'true' ? 'advanced' : 'basic'
  );
  
  // Basic search state
  const [basicQuery, setBasicQuery] = useState(queryParams.query || '');
  
  // Advanced search state
  const [advancedParams, setAdvancedParams] = useState({
    title: queryParams.title || '',
    type: queryParams.type || '',
    status: queryParams.status || '',
    sort: queryParams.sort || 'newest',
    genres: queryParams.genres || ''
  });
  
  const [page, setPage] = useState(parseInt(queryParams.page || '1'));
  const limit = 20;
  
  // Debounced search to avoid too many requests
  const debouncedSearch = useCallback(
    debounce((newParams: Record<string, any>) => {
      const queryString = buildQueryString(newParams);
      setLocation(`/search?${queryString}`);
    }, 500),
    [setLocation]
  );
  
  // Basic search query
  const basicSearchQuery = useQuery({
    queryKey: ['search', basicQuery, page, limit],
    queryFn: async () => {
      if (!basicQuery) return { content: [], total: 0 };
      
      const res = await fetch(`/api/content/search?query=${encodeURIComponent(basicQuery)}&page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: searchMode === 'basic' && !!basicQuery
  });
  
  // Advanced search query
  const advancedSearchQuery = useQuery({
    queryKey: ['advancedSearch', advancedParams, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (advancedParams.title) params.append('title', advancedParams.title);
      if (advancedParams.type) params.append('type', advancedParams.type);
      if (advancedParams.status) params.append('status', advancedParams.status);
      if (advancedParams.sort) params.append('sort', advancedParams.sort);
      if (advancedParams.genres) params.append('genres', advancedParams.genres);
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const res = await fetch(`/api/content/search/advanced?${params.toString()}`);
      if (!res.ok) throw new Error('Advanced search failed');
      return res.json();
    },
    enabled: searchMode === 'advanced' && (
      !!advancedParams.title || 
      !!advancedParams.type || 
      !!advancedParams.status || 
      !!advancedParams.genres
    )
  });
  
  // Update URL on parameter changes
  useEffect(() => {
    if (searchMode === 'basic' && basicQuery) {
      debouncedSearch({
        query: basicQuery,
        page,
        advanced: 'false'
      });
    } else if (searchMode === 'advanced') {
      debouncedSearch({
        ...advancedParams,
        page,
        advanced: 'true'
      });
    }
  }, [basicQuery, advancedParams, page, searchMode, debouncedSearch]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchMode(value as 'basic' | 'advanced');
    setPage(1); // Reset page when switching tabs
  };
  
  // Handle basic search input
  const handleBasicSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBasicQuery(e.target.value);
    setPage(1); // Reset page on new search
  };
  
  // Handle advanced search input
  const handleAdvancedInputChange = (field: keyof typeof advancedParams, value: string) => {
    setAdvancedParams(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset page on parameter change
  };
  
  // Handle search clear
  const handleClearSearch = () => {
    if (searchMode === 'basic') {
      setBasicQuery('');
    } else {
      setAdvancedParams({
        title: '',
        type: '',
        status: '',
        sort: 'newest',
        genres: ''
      });
    }
    setPage(1);
  };
  
  // Calculate pagination
  const currentQuery = searchMode === 'basic' ? basicSearchQuery : advancedSearchQuery;
  const totalPages = currentQuery.data ? Math.ceil(currentQuery.data.total / limit) : 0;
  
  const content = currentQuery.data?.content || [];
  const isLoading = currentQuery.isLoading;
  const isError = currentQuery.isError;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Tìm Kiếm</h1>
      
      <Tabs value={searchMode} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="basic">Tìm Kiếm Cơ Bản</TabsTrigger>
          <TabsTrigger value="advanced">Tìm Kiếm Nâng Cao</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Nhập tên truyện cần tìm kiếm..."
              value={basicQuery}
              onChange={handleBasicSearchInput}
              className="pr-16"
            />
            {basicQuery && (
              <button 
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={handleClearSearch}
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Tên Truyện</Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Nhập tên truyện..."
                  value={advancedParams.title}
                  onChange={(e) => handleAdvancedInputChange('title', e.target.value)}
                />
                {advancedParams.title && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => handleAdvancedInputChange('title', '')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Loại Truyện</Label>
              <Select 
                value={advancedParams.type} 
                onValueChange={(value) => handleAdvancedInputChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Tất cả loại truyện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="manga">Truyện Tranh</SelectItem>
                  <SelectItem value="novel">Tiểu Thuyết</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Trạng Thái</Label>
              <Select 
                value={advancedParams.status} 
                onValueChange={(value) => handleAdvancedInputChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="ongoing">Đang Ra</SelectItem>
                  <SelectItem value="completed">Hoàn Thành</SelectItem>
                  <SelectItem value="hiatus">Tạm Ngừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sort">Sắp Xếp</Label>
              <Select 
                value={advancedParams.sort} 
                onValueChange={(value) => handleAdvancedInputChange('sort', value)}
              >
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới Nhất</SelectItem>
                  <SelectItem value="oldest">Cũ Nhất</SelectItem>
                  <SelectItem value="az">A-Z</SelectItem>
                  <SelectItem value="za">Z-A</SelectItem>
                  <SelectItem value="popularity">Lượt Xem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClearSearch}>
              <X className="mr-2 h-4 w-4" /> Xóa Bộ Lọc
            </Button>
            <Button>
              <Filter className="mr-2 h-4 w-4" /> Áp Dụng Bộ Lọc
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Results section */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">
            <p>Có lỗi xảy ra. Vui lòng thử lại.</p>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Không tìm thấy kết quả nào phù hợp.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-500">
                {currentQuery.data?.total || 0} kết quả được tìm thấy
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {content.map((item: Content) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum: number;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={i}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}