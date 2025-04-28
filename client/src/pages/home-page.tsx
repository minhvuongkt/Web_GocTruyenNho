import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Content, Genre } from "@shared/schema";
import { MainLayout } from "@/components/layouts/main-layout";
import { MangaCarousel } from "@/components/shared/manga-carousel";
import { MangaCard } from "@/components/shared/manga-card";
import { NovelCard } from "@/components/shared/novel-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

interface ContentWithDetails extends Content {
  genres?: Genre[];
}

export function HomePage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const currentType = searchParams.get('type') || 'all';
  
  const [activeTab, setActiveTab] = useState<string>("featured");
  
  // Parse search parameters
  const keyword = searchParams.get('keyword') || '';
  const year = searchParams.get('year') || '';
  const genresParam = searchParams.get('genres') || '';
  const searchType = searchParams.get('searchType') || 'and';
  const genres = genresParam ? genresParam.split(',').map(id => parseInt(id)) : [];
  
  // Determine if we're on a search page
  const isSearchPage = keyword || year || genres.length > 0;
  
  // Function to change content type
  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(search);
    if (type === 'all') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    setLocation(`/?${params.toString()}`);
  };
  
  // Fetch featured content
  const { data: featuredContent, isLoading: loadingFeatured } = useQuery<ContentWithDetails[]>({
    queryKey: ['/api/content/featured', currentType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentType !== 'all') params.set('type', currentType);
      params.set('limit', '10');
      
      const res = await apiRequest('GET', `/api/content?${params.toString()}`);
      const data = await res.json();
      return data.content;
    }
  });
  
  // Fetch recently updated content
  const { data: recentContent, isLoading: loadingRecent } = useQuery<ContentWithDetails[]>({
    queryKey: ['/api/content/recent', currentType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentType !== 'all') params.set('type', currentType);
      params.set('limit', '12');
      params.set('sort', 'latest');
      
      const res = await apiRequest('GET', `/api/content?${params.toString()}`);
      const data = await res.json();
      return data.content;
    }
  });
  
  // Fetch popular novels
  const { data: popularNovels, isLoading: loadingNovels } = useQuery<ContentWithDetails[]>({
    queryKey: ['/api/content/novels/popular'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('type', 'novel');
      params.set('limit', '3');
      params.set('sort', 'popular');
      
      const res = await apiRequest('GET', `/api/content?${params.toString()}`);
      const data = await res.json();
      return data.content;
    },
    enabled: currentType === 'all' || currentType === 'novel'
  });
  
  // Fetch content for search results
  const { data: searchResults, isLoading: loadingSearch } = useQuery<{
    content: ContentWithDetails[];
    total: number;
  }>({
    queryKey: ['/api/content/search', keyword, year, genresParam, searchType, currentType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (year) params.set('year', year);
      if (genresParam) params.set('genres', genresParam);
      if (searchType) params.set('searchType', searchType);
      if (currentType !== 'all') params.set('type', currentType);
      params.set('limit', '24');
      
      const res = await apiRequest('GET', `/api/content?${params.toString()}`);
      return res.json();
    },
    enabled: isSearchPage
  });
  
  // Effect to handle tab changes based on URL parameters
  useEffect(() => {
    if (isSearchPage) {
      setActiveTab("all");
    }
  }, [isSearchPage]);
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Banner Advertisement */}
        <div className="mb-6 rounded-lg overflow-hidden shadow-md">
          <img 
            src="https://images.unsplash.com/photo-1588497859490-85d1c17db96d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=300&q=80" 
            alt="Quảng cáo" 
            className="w-full h-40 object-cover" 
          />
        </div>
        
        {/* Content Type Tabs */}
        <div className="mb-6 flex overflow-x-auto border-b border-border">
          <Button
            variant={currentType === 'all' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-state={currentType === 'all' ? 'active' : 'inactive'}
            onClick={() => handleTypeChange('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={currentType === 'manga' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-state={currentType === 'manga' ? 'active' : 'inactive'}
            onClick={() => handleTypeChange('manga')}
          >
            Truyện tranh
          </Button>
          <Button
            variant={currentType === 'novel' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-state={currentType === 'novel' ? 'active' : 'inactive'}
            onClick={() => handleTypeChange('novel')}
          >
            Truyện chữ
          </Button>
        </div>
        
        {isSearchPage ? (
          /* Search Results */
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">
              Kết quả tìm kiếm {searchResults?.total ? `(${searchResults.total})` : ''}
            </h2>
            
            {loadingSearch ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="bg-muted animate-pulse h-48 rounded-lg"></div>
                ))}
              </div>
            ) : searchResults?.content && searchResults.content.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.content.map(item => 
                  item.type === 'manga' ? (
                    <MangaCard key={item.id} manga={item} genres={item.genres} />
                  ) : (
                    <NovelCard key={item.id} novel={item} genres={item.genres} />
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm.
              </div>
            )}
          </div>
        ) : (
          /* Normal Home Page Content */
          <>
            {/* Content Section Tabs */}
            <Tabs defaultValue="featured" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="featured">Đề xuất</TabsTrigger>
                <TabsTrigger value="popular">Đọc nhiều</TabsTrigger>
                <TabsTrigger value="recent">Mới cập nhật</TabsTrigger>
              </TabsList>
              
              <TabsContent value="featured">
                <MangaCarousel
                  title="Truyện đề xuất"
                  queryKey="featured-content"
                  data={featuredContent}
                  viewAllLink={`/?tab=featured${currentType !== 'all' ? `&type=${currentType}` : ''}`}
                  featured={true}
                />
              </TabsContent>
              
              <TabsContent value="popular">
                <MangaCarousel
                  title="Truyện phổ biến"
                  queryKey="popular-content"
                  viewAllLink={`/?tab=popular${currentType !== 'all' ? `&type=${currentType}` : ''}`}
                  featured={true}
                />
              </TabsContent>
              
              <TabsContent value="recent">
                <MangaCarousel
                  title="Truyện mới cập nhật"
                  queryKey="recent-content"
                  data={recentContent}
                  viewAllLink={`/?tab=recent${currentType !== 'all' ? `&type=${currentType}` : ''}`}
                  featured={true}
                />
              </TabsContent>
            </Tabs>
            
            {/* Recently Updated Grid */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Mới cập nhật</h2>
                <a href={`/?tab=recent${currentType !== 'all' ? `&type=${currentType}` : ''}`} className="text-primary font-medium text-sm hover:underline">
                  Xem tất cả
                </a>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loadingRecent ? (
                  Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="bg-muted animate-pulse h-48 rounded-lg"></div>
                  ))
                ) : recentContent && recentContent.length > 0 ? (
                  recentContent
                    .slice(0, 12)
                    .map(item => 
                      item.type === 'manga' ? (
                        <MangaCard key={item.id} manga={item} />
                      ) : (
                        <NovelCard key={item.id} novel={item} />
                      )
                    )
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Không có dữ liệu để hiển thị
                  </div>
                )}
              </div>
            </div>
            
            {/* Novels Section */}
            {(currentType === 'all' || currentType === 'novel') && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Truyện chữ hay</h2>
                  <a href="/?type=novel" className="text-primary font-medium text-sm hover:underline">
                    Xem tất cả
                  </a>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loadingNovels ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="bg-muted animate-pulse h-40 rounded-lg"></div>
                    ))
                  ) : popularNovels && popularNovels.length > 0 ? (
                    popularNovels.map(novel => (
                      <NovelCard key={novel.id} novel={novel} genres={novel.genres} horizontal={true} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Không có dữ liệu để hiển thị
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default HomePage;
