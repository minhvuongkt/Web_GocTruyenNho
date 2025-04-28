import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layouts/main-layout";
import { ContentCard } from "@/components/content/content-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  BookOpen,
  Filter,
  Loader2,
  Search,
  X
} from "lucide-react";

export function SearchPage() {
  // Lấy tham số tìm kiếm từ URL (nếu có)
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get("q") || "";
  const typeParam = urlParams.get("type") || "";
  const statusParam = urlParams.get("status") || "";
  const genreParam = urlParams.get("genre") || "";

  // State cho tìm kiếm cơ bản
  const [searchQuery, setSearchQuery] = useState(queryParam);

  // State cho tìm kiếm nâng cao
  const [advancedSearch, setAdvancedSearch] = useState({
    title: queryParam,
    type: typeParam,
    status: statusParam,
    genres: genreParam ? genreParam.split(",") : [],
    sort: "newest",
  });

  // State để theo dõi tab đang active
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Fetch thể loại
  const { data: genres, isLoading: loadingGenres } = useQuery({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/genres");
      return response.json();
    },
  });

  // Fetch kết quả tìm kiếm
  const { data: searchResults, isLoading: loadingResults } = useQuery({
    queryKey: [
      "/api/content/search", 
      activeTab === "basic" ? { query: searchQuery } : advancedSearch
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (activeTab === "basic") {
        if (!searchQuery.trim()) return { content: [], total: 0 };
        params.append("query", searchQuery);
      } else {
        if (advancedSearch.title) params.append("title", advancedSearch.title);
        if (advancedSearch.type) params.append("type", advancedSearch.type);
        if (advancedSearch.status) params.append("status", advancedSearch.status);
        if (advancedSearch.genres.length > 0) params.append("genres", advancedSearch.genres.join(","));
        params.append("sort", advancedSearch.sort);
      }

      const response = await apiRequest("GET", `/api/content/search?${params.toString()}`);
      return response.json();
    },
    enabled: activeTab === "basic" 
      ? !!searchQuery.trim() 
      : !!(advancedSearch.title || advancedSearch.type || advancedSearch.status || advancedSearch.genres.length > 0),
  });

  // Xử lý tìm kiếm cơ bản
  const handleBasicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.append("q", searchQuery);
      setLocation(`/search?${params.toString()}`);
    }
  };

  // Xử lý tìm kiếm nâng cao
  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (advancedSearch.title) params.append("q", advancedSearch.title);
    if (advancedSearch.type) params.append("type", advancedSearch.type);
    if (advancedSearch.status) params.append("status", advancedSearch.status);
    if (advancedSearch.genres.length > 0) params.append("genre", advancedSearch.genres.join(","));
    
    setLocation(`/search?${params.toString()}`);
  };

  // Xử lý toggle thể loại
  const handleGenreToggle = (genreId: string) => {
    setAdvancedSearch(prev => {
      const genres = prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId];
      
      return { ...prev, genres };
    });
  };

  // Reset form tìm kiếm nâng cao
  const resetAdvancedForm = () => {
    setAdvancedSearch({
      title: "",
      type: "",
      status: "",
      genres: [],
      sort: "newest",
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tìm kiếm</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Tìm kiếm cơ bản</TabsTrigger>
            <TabsTrigger value="advanced">Tìm kiếm nâng cao</TabsTrigger>
          </TabsList>
          
          {/* Tab tìm kiếm cơ bản */}
          <TabsContent value="basic">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Tìm kiếm cơ bản</CardTitle>
                <CardDescription>
                  Tìm kiếm theo tiêu đề, tác giả hoặc mô tả
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBasicSearch} className="flex space-x-2">
                  <div className="flex-grow relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Nhập từ khóa tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit" disabled={!searchQuery.trim()}>
                    Tìm kiếm
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab tìm kiếm nâng cao */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Tìm kiếm nâng cao</CardTitle>
                <CardDescription>
                  Tìm kiếm với nhiều tùy chọn lọc, sắp xếp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdvancedSearch} className="space-y-4">
                  {/* Tiêu đề */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      placeholder="Nhập tiêu đề tìm kiếm..."
                      value={advancedSearch.title}
                      onChange={(e) => setAdvancedSearch({ ...advancedSearch, title: e.target.value })}
                    />
                  </div>
                  
                  {/* Loại truyện */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Loại truyện</Label>
                      <Select 
                        value={advancedSearch.type} 
                        onValueChange={(value) => setAdvancedSearch({ ...advancedSearch, type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Tất cả loại truyện" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tất cả</SelectItem>
                          <SelectItem value="manga">Truyện tranh</SelectItem>
                          <SelectItem value="novel">Tiểu thuyết</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Trạng thái */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Trạng thái</Label>
                      <Select 
                        value={advancedSearch.status} 
                        onValueChange={(value) => setAdvancedSearch({ ...advancedSearch, status: value })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tất cả</SelectItem>
                          <SelectItem value="ongoing">Đang tiến hành</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="hiatus">Tạm ngưng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Thứ tự sắp xếp */}
                  <div className="space-y-2">
                    <Label htmlFor="sort">Sắp xếp theo</Label>
                    <Select 
                      value={advancedSearch.sort} 
                      onValueChange={(value) => setAdvancedSearch({ ...advancedSearch, sort: value })}
                    >
                      <SelectTrigger id="sort">
                        <SelectValue placeholder="Sắp xếp theo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                        <SelectItem value="az">A-Z</SelectItem>
                        <SelectItem value="za">Z-A</SelectItem>
                        <SelectItem value="popularity">Xem nhiều nhất</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Thể loại */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="genres">
                      <AccordionTrigger className="text-sm font-medium">Thể loại</AccordionTrigger>
                      <AccordionContent>
                        {loadingGenres ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                            {genres?.map((genre: any) => (
                              <div key={genre.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`genre-${genre.id}`}
                                  checked={advancedSearch.genres.includes(genre.id.toString())}
                                  onCheckedChange={() => handleGenreToggle(genre.id.toString())}
                                />
                                <Label htmlFor={`genre-${genre.id}`} className="text-sm cursor-pointer">
                                  {genre.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  {/* Nút tìm kiếm và reset */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={!advancedSearch.title && !advancedSearch.type && !advancedSearch.status && advancedSearch.genres.length === 0}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Tìm kiếm nâng cao
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={resetAdvancedForm}
                      className="w-10 px-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Hiển thị kết quả */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">
            {activeTab === "basic" 
              ? searchQuery 
                ? `Kết quả tìm kiếm cho "${searchQuery}"` 
                : "Nhập từ khóa để tìm kiếm"
              : "Kết quả tìm kiếm nâng cao"}
          </h2>
          
          {loadingResults ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tìm kiếm...</p>
            </div>
          ) : searchResults?.content?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.content.map((content: any) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Không tìm thấy kết quả phù hợp</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc tìm kiếm của bạn.
              </p>
              
              {activeTab === "advanced" && (
                <Button onClick={resetAdvancedForm} variant="outline">
                  Đặt lại bộ lọc
                </Button>
              )}
            </div>
          )}
          
          {/* Phân trang */}
          {searchResults?.content?.length > 0 && searchResults.total > searchResults.content.length && (
            <div className="flex justify-center mt-8">
              <Button variant="outline">
                Xem thêm kết quả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default SearchPage;