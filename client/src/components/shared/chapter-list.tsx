import { useState } from "react";
import { Link } from "wouter";
import { Chapter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LockIcon, SearchIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ChapterListProps {
  chapters: Chapter[];
  contentId: number;
  contentType: "manga" | "novel";
  userUnlockedChapters?: number[]; // List of chapter IDs that the user has unlocked
}

export function ChapterList({
  chapters,
  contentId,
  contentType,
  userUnlockedChapters = [],
}: ChapterListProps) {
  const [sortAscending, setSortAscending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort chapters
  const sortedChapters = [...chapters].sort((a, b) => {
    return sortAscending ? a.number - b.number : b.number - a.number;
  });

  // Filter chapters based on search term
  const filteredChapters = sortedChapters.filter((chapter) => {
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
        {filteredChapters.length > 0 ? (
          filteredChapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/truyen/${contentId}/chapter/${chapter.number}`}
              className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <div className="flex-1 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Chương {chapter.number}</span>
                  {chapter.isLocked &&
                    !userUnlockedChapters.includes(chapter.id) && (
                      <Badge
                        variant="outline"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      >
                        {/* <LockIcon className="h-3 w-3 mr-1" /> */}
                        {chapter.unlockPrice} xu
                      </Badge>
                    )}
                </div>
                {chapter.title && (
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {chapter.title}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground hidden md:block">
                {formatDate(chapter.releaseDate)}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có chương nào cả. Bạn thử qua truyện khác xem nhé
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterList;
