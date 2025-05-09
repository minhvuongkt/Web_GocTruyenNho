import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Chapter, ChapterContent } from "@shared/schema";
import { ReaderLayout } from "@/components/layouts/reader-layout";
import { UnlockModal } from "@/components/shared/unlock-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  LockIcon,
  AlertTriangle,
  Search,
  SearchX,
  Eye as EyeIcon,
  Settings,
  BookOpen,
  ArrowUp,
  ChevronRight,
  Edit2,
} from "lucide-react";

interface NovelReaderPageProps {
  contentId: number;
  chapterNumber: number;
}

export function NovelReaderPage({
  contentId,
  chapterNumber,
}: NovelReaderPageProps) {
  // Đặt tất cả các Hooks lên đầu - quy tắc của React Hooks
  const { user } = useAuth();
  const { theme } = useTheme();

  // State hooks
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchChapter, setSearchChapter] = useState("");

  // Reader settings
  const defaultSettings = {
    fontSize: 14,
    fontFamily: "Times New Roman",
    lineHeight: 1.5,
    textColor: "",
    backgroundColor: "",
  };

  const [readerSettings, setReaderSettings] = useState(defaultSettings);

  // Data fetching with React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`/api/content/${contentId}/chapter/${chapterNumber}`],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/content/${contentId}/chapter/${chapterNumber}`,
      );
      return res.json();
    },
  });

  const { data: novelDetails } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}`);
      return res.json();
    },
    enabled: !!contentId,
  });

  // Query to fetch all chapters for this content
  const { data: chaptersData } = useQuery({
    queryKey: [`/api/content/${contentId}/chapters`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}/chapters`);
      return res.json();
    },
    enabled: !!contentId,
  });

  // Effects
  useEffect(() => {
    // Load reader settings from localStorage on mount
    if (typeof window !== "undefined") {
      try {
        const savedSettings = localStorage.getItem("novelReaderSettings");
        if (savedSettings) {
          setReaderSettings(JSON.parse(savedSettings));
        }
      } catch (e) {
        console.error("Error loading reader settings:", e);
      }
    }
  }, []);

  // Show unlock modal when chapter is locked
  useEffect(() => {
    if (data && data.chapter && data.chapter.isLocked && !data.isUnlocked) {
      setShowUnlockModal(true);
    } else {
      // Ensure modal is closed when data changes and chapter is unlocked
      setShowUnlockModal(false);
    }
  }, [data]);

  // Handlers and utilities
  const handleChapterListToggle = () => {
    setShowChapterList(!showChapterList);
  };

  const updateSettings = (newSettings: any) => {
    const updatedSettings = { ...readerSettings, ...newSettings };
    setReaderSettings(updatedSettings);
    try {
      localStorage.setItem(
        "novelReaderSettings",
        JSON.stringify(updatedSettings),
      );
    } catch (e) {
      console.error("Error saving reader settings:", e);
    }
  };

  const getSortedChapters = () => {
    if (!chaptersData) return [];
    return [...chaptersData].sort((a, b) => a.number - b.number);
  };

  // Font options and sizes
  const fontOptions = [
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Arial", label: "Arial" },
    { value: "Roboto", label: "Roboto" },
    { value: "Noto Sans", label: "Noto Sans" },
    { value: "Noto Serif", label: "Noto Serif" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Montserrat", label: "Montserrat" },
    { value: "Quicksand", label: "Quicksand" },
    { value: "Be Vietnam Pro", label: "Be Vietnam Pro" },
    { value: "Josefin Sans", label: "Josefin Sans" },
  ];

  const fontSizeOptions = [
    { value: 14, label: "Rất Nhỏ" },
    { value: 18, label: "Nhỏ" },
    { value: 20, label: "Vừa" },
    { value: 22, label: "Lớn" },
    { value: 26, label: "Rất lớn" },
    { value: 30, label: "Cực lớn" },
  ];

  // Calculated values
  const defaultTextColor = theme === "dark" ? "white" : "black";

  // Loading state
  if (isLoading) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={0} // Placeholder ID during loading
        contentType="novel"
        title="Đang tải..."
        chapterTitle="Đang tải..."
        chapterNumber={chapterNumber}
        onChapterListToggle={handleChapterListToggle}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải nội dung...</p>
          </div>
        </div>
      </ReaderLayout>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Không thể tải chương</h2>
          <p className="text-muted-foreground mb-4">
            Đã xảy ra lỗi khi tải nội dung chương này. Vui lòng thử lại sau.
          </p>
          <Button asChild>
            <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if chapter data exists
  if (!data || !data.chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy chương</h2>
          <p className="text-muted-foreground mb-4">
            Chương này không tồn tại hoặc đã bị xóa.
          </p>
          <Button asChild>
            <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Extract data now that we know it exists
  const {
    chapter,
    content: chapterContent,
    chapterContent: chapterContentList,
    isUnlocked,
  } = data;
  const novelTitle = novelDetails?.content?.title || "Đang tải...";
  const novelContent = chapterContent || "";

  // Parse HTML content safely
  const renderFormattedContent = () => {
    if (!novelContent) return null;

    return (
      <div
        dangerouslySetInnerHTML={{ __html: novelContent }}
        className="novel-content"
      />
    );
  };

  // Chapter locked state
  if (chapter.isLocked && !isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-6 text-center">
          <LockIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Chương bị khóa</h2>
          <p className="text-muted-foreground mb-6">
            Chương này yêu cầu mở khóa để đọc. Vui lòng mở khóa để tiếp tục.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setShowUnlockModal(true)}>
              Mở khóa chương
            </Button>
            <Button asChild variant="outline">
              <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
            </Button>
          </div>

          <Alert className="mt-8" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Thông báo</AlertTitle>
            <AlertDescription>
              Cần đăng nhập để mở khóa chương này. Mỗi chương truyện mở khóa yêu
              cầu {chapter.unlockPrice} xu.
            </AlertDescription>
          </Alert>

          <UnlockModal
            isOpen={showUnlockModal}
            onClose={() => setShowUnlockModal(false)}
            chapter={chapter}
            onUnlockSuccess={refetch}
          />
        </div>
      </div>
    );
  }

  // Main content view
  return (
    <ReaderLayout
      contentId={contentId}
      chapterId={chapter.number}
      contentType="novel"
      title={novelTitle}
      chapterTitle={chapter.title || `Chương ${chapter.number}`}
      chapterNumber={chapter.number}
      prevChapterId={data.navigation?.prevChapter?.number}
      nextChapterId={data.navigation?.nextChapter?.number}
      onChapterListToggle={handleChapterListToggle}
    >
      <div className="novel-reader relative">
        {/* Reader settings button - now using a popup similar to manga reader */}
        <div className="flex justify-end items-center mb-4 gap-2">
          {/* Edit button for admin users */}
          {user?.role === 'admin' && (
            <Link 
              href={`/truyen/${contentId}/chapter/${chapter.number}/edit`}
              className="inline-block"
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-9 w-9 p-0 flex items-center justify-center bg-primary/90 border-primary-foreground settings-btn"
                title="Chỉnh sửa chương này"
              >
                <Edit2 className="h-4 w-4 text-white" />
              </Button>
            </Link>
          )}
          
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full h-9 w-9 p-0 flex items-center justify-center bg-gray-900/90 border-gray-700 settings-btn"
              title="Tùy chọn đọc"
            >
              <Settings className="h-4 w-4 text-gray-300" />
            </Button>
          </div>

          {/* Chapter list button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleChapterListToggle}
            className="rounded-full h-9 w-9 p-0 flex items-center justify-center bg-gray-900/90 border-gray-700"
            title="Mục lục"
          >
            <BookOpen className="h-4 w-4 text-gray-300" />
          </Button>
        </div>

        <h1 className="text-2xl font-semibold mb-6 pr-24">
          Chương {chapter.number}: {chapter.title || ""}
        </h1>

        <div
          className="novel-content-container"
          style={{
            fontFamily: readerSettings.fontFamily,
            fontSize: `${readerSettings.fontSize}px`,
            color: readerSettings.textColor || defaultTextColor,
            backgroundColor: readerSettings.backgroundColor || "",
            padding: readerSettings.backgroundColor ? "1rem" : "0",
            borderRadius: readerSettings.backgroundColor ? "0.5rem" : "0",
          }}
        >
          {renderFormattedContent()}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tùy chỉnh hiển thị</DialogTitle>
            <DialogDescription>
              Điều chỉnh giao diện đọc truyện theo ý thích của bạn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fontFamily">Phông chữ</Label>
              <Select
                value={readerSettings.fontFamily}
                onValueChange={(value) => updateSettings({ fontFamily: value })}
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue placeholder="Chọn phông chữ" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fontSize">Cỡ chữ</Label>
              <Select
                value={readerSettings.fontSize.toString()}
                onValueChange={(value) =>
                  updateSettings({ fontSize: parseInt(value) })
                }
              >
                <SelectTrigger id="fontSize">
                  <SelectValue placeholder="Chọn cỡ chữ" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value.toString()}>
                      {size.label} ({size.value}px)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="textColor">Màu chữ</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={readerSettings.textColor || defaultTextColor}
                  onChange={(e) =>
                    updateSettings({ textColor: e.target.value })
                  }
                  className="w-12 h-8 p-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ textColor: "" })}
                >
                  Mặc định
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="backgroundColor">Màu nền</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={
                    readerSettings.backgroundColor ||
                    (theme === "dark" ? "#1e1e2e" : "#ffffff")
                  }
                  onChange={(e) =>
                    updateSettings({ backgroundColor: e.target.value })
                  }
                  className="w-12 h-8 p-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ backgroundColor: "" })}
                >
                  Mặc định
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter List Side Sheet */}
      <ChapterListSidebar
        showChapterList={showChapterList}
        setShowChapterList={setShowChapterList}
        searchChapter={searchChapter}
        setSearchChapter={setSearchChapter}
        getSortedChapters={getSortedChapters}
        currentChapterId={data.chapter.id}
        contentId={contentId}
      />
      {/* <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
        <SheetContent side="right">
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Danh sách chương</h3>
            <div className="flex-grow overflow-y-auto">
              {getSortedChapters().map((ch) => (
                <div key={ch.id} className="py-2 border-b border-border">
                  <Link
                    href={`/truyen/${contentId}/chapter/${ch.number}`}
                    className={`block py-1 px-2 rounded hover:bg-muted ${ch.id === chapter.id ? "bg-primary/10 text-primary font-medium" : ""}`}
                    onClick={() => setShowChapterList(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span>Chương {ch.number}</span>
                      {ch.isLocked && <LockIcon className="h-3 w-3" />}
                    </div>
                    {ch.title && (
                      <span className="text-sm text-muted-foreground">
                        {ch.title}
                      </span>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet> */}
    </ReaderLayout>
  );
}
function ChapterListSidebar({
  showChapterList,
  setShowChapterList,
  searchChapter,
  setSearchChapter,
  getSortedChapters,
  currentChapterId,
  contentId,
}: {
  showChapterList: boolean;
  setShowChapterList: (show: boolean) => void;
  searchChapter: string;
  setSearchChapter: (search: string) => void;
  getSortedChapters: () => any[];
  currentChapterId: number;
  contentId: number;
}) {
  // Filter chapters based on search
  const filteredChapters = getSortedChapters().filter(
    (ch) =>
      searchChapter === "" ||
      (ch.title &&
        ch.title.toLowerCase().includes(searchChapter.toLowerCase())) ||
      `chương ${ch.number}`.toLowerCase().includes(searchChapter.toLowerCase()),
  );

  // Check if there are no matching chapters
  const noResults = filteredChapters.length === 0;

  return (
    <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[350px] md:w-[400px] bg-gray-900 border-l-gray-800"
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              Danh sách chương
            </h3>
            {/* <Button variant="ghost" size="sm" onClick={() => setShowChapterList(false)} className="text-gray-400 hover:text-white hover:bg-gray-800">
              <X className="h-4 w-4" />
            </Button> */}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm chương..."
                className="pl-8 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-gray-700"
                value={searchChapter}
                onChange={(e) => setSearchChapter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {!noResults ? (
              filteredChapters.map((ch) => (
                <div key={ch.id} className="py-1 border-b border-gray-800">
                  <Link
                    href={`/truyen/${contentId}/chapter/${ch.number}`}
                    className={`block py-2 px-3 rounded-md hover:bg-gray-800 transition-colors duration-200 ${
                      ch.id === currentChapterId
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-primary pl-2"
                        : "text-gray-300"
                    }`}
                    onClick={() => setShowChapterList(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {ch.id === currentChapterId && (
                          <ChevronRight className="h-3 w-3 mr-1 text-primary" />
                        )}
                        <span>Chương {ch.number}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {ch.views > 0 && (
                          <EyeIcon className="h-3 w-3 text-gray-500" />
                        )}
                        {ch.isLocked && (
                          <LockIcon className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                    {ch.title && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {ch.title}
                      </div>
                    )}
                  </Link>
                </div>
              ))
            ) : (
              // Empty state design from screenshot
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gray-800 p-6 mb-4">
                  <SearchX className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">
                  Không tìm thấy chương phù hợp
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
export default NovelReaderPage;
