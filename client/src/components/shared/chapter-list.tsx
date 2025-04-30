import { useState } from "react";
import { Link } from "wouter";
import { Chapter } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LockIcon, SearchIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChapterListProps {
  chapters: Chapter[];
  contentId: number;
  contentType: 'manga' | 'novel';
  userUnlockedChapters?: number[]; // List of chapter IDs that the user has unlocked
}

export function ChapterList({ 
  chapters, 
  contentId, 
  contentType,
  userUnlockedChapters = []
}: ChapterListProps) {
  const [sortAscending, setSortAscending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sort chapters
  const sortedChapters = [...chapters].sort((a, b) => {
    return sortAscending 
      ? a.number - b.number 
      : b.number - a.number;
  });
  
  // Filter chapters based on search term
  const filteredChapters = sortedChapters.filter(chapter => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatches = chapter.title?.toLowerCase().includes(searchLower);
    const numberMatches = chapter.number.toString().includes(searchTerm);
    return titleMatches || numberMatches;
  });
  
  const toggleSort = () => {
    setSortAscending(!sortAscending);
  };
  
  // Check if a chapter is unlocked
  const isChapterUnlocked = (chapter: Chapter) => {
    return !chapter.isLocked || userUnlockedChapters.includes(chapter.id);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Danh sách chương</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSort}
          className="flex items-center"
        >
          {sortAscending ? (
            <>
              <SortAscIcon className="h-4 w-4 mr-1" />
              Cũ → Mới
            </>
          ) : (
            <>
              <SortDescIcon className="h-4 w-4 mr-1" />
              Mới → Cũ
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm chương..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="border rounded-md chapter-list">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Chương</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="hidden md:table-cell">Ngày đăng</TableHead>
              <TableHead className="w-16 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChapters.length > 0 ? (
              filteredChapters.map((chapter) => (
                <TableRow 
                  key={chapter.id} 
                  className="chapter-item hover:bg-muted/50 transition-opacity"
                >
                  <TableCell>{chapter.number}</TableCell>
                  <TableCell>
                    {chapter.title || `Chương ${chapter.number}`}
                    {chapter.isLocked && !userUnlockedChapters.includes(chapter.id) && (
                      <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        <LockIcon className="h-3 w-3 mr-1" />
                        Khóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(chapter.releaseDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <Link href={`/truyen/${contentId}/chapter-${chapter.number}`}>
                        Đọc
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  Không tìm thấy chương phù hợp
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ChapterList;
