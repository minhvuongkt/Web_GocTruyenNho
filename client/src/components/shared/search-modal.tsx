import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Genre } from "@shared/schema";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [, navigate] = useLocation();
  const [keyword, setKeyword] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [searchType, setSearchType] = useState("and");

  // Fetch genres
  const { data: genres } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    enabled: isOpen
  });

  // Generate years from 2010 to current year
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let year = 2010; year <= currentYear; year++) {
    years.push(year.toString());
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Build the search URL with query parameters
    let searchUrl = "/?";
    
    if (keyword.trim()) {
      searchUrl += `keyword=${encodeURIComponent(keyword.trim())}&`;
    }
    
    if (selectedYear) {
      searchUrl += `year=${selectedYear}&`;
    }
    
    if (selectedGenres.length > 0) {
      searchUrl += `genres=${selectedGenres.join(",")}&`;
    }
    
    searchUrl += `searchType=${searchType}`;
    
    navigate(searchUrl);
    onClose();
  };

  const handleGenreChange = (genreId: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  // Clear form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setKeyword("");
      setSelectedYear("");
      setSelectedGenres([]);
      setSearchType("and");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tìm kiếm nâng cao</DialogTitle>
          <DialogDescription>
            Tìm truyện theo tên, tác giả, thể loại hoặc năm phát hành
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="space-y-4 mt-2">
          <div>
            <Input
              placeholder="Nhập tên truyện, tác giả hoặc nhóm dịch..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year selection */}
            <div>
              <Label className="block text-sm font-medium mb-1">Năm phát hành</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả các năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả các năm</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Search type */}
            <div>
              <Label className="block text-sm font-medium mb-1">Loại tìm kiếm</Label>
              <RadioGroup value={searchType} onValueChange={setSearchType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="and" id="and" />
                  <Label htmlFor="and">Cùng với</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not" id="not" />
                  <Label htmlFor="not">Trừ</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* Genres */}
          <div>
            <Label className="block text-sm font-medium mb-1">Thể loại</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border rounded-md p-3 mt-1 max-h-[150px] overflow-y-auto">
              {genres ? (
                genres.map((genre) => (
                  <div key={genre.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`genre-${genre.id}`} 
                      checked={selectedGenres.includes(genre.id)}
                      onCheckedChange={() => handleGenreChange(genre.id)}
                    />
                    <Label htmlFor={`genre-${genre.id}`} className="text-sm">
                      {genre.name}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-2 text-muted-foreground">
                  Đang tải thể loại...
                </div>
              )}
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Tìm kiếm
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SearchModal;
