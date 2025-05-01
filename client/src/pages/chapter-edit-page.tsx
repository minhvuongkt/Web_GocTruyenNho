import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { MainLayout } from '@/components/layouts/main-layout';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChapterEditPageProps {
  contentId: number;
  chapterNumber: number;
}

export function ChapterEditPage({ contentId, chapterNumber }: ChapterEditPageProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: 'Không có quyền truy cập',
        description: 'Bạn không có quyền để chỉnh sửa nội dung này.',
        variant: 'destructive'
      });
      navigate(`/truyen/${contentId}`);
    }
  }, [user, navigate, contentId, toast]);

  // Fetch content details
  const { data: contentData } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/content/${contentId}`);
      return res.json();
    }
  });

  // Fetch chapter details
  const { data: chapterData, isLoading, isError } = useQuery({
    queryKey: [`/api/content/${contentId}/chapter/${chapterNumber}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/content/${contentId}/chapter/${chapterNumber}`);
      return res.json();
    }
  });

  // Save chapter mutation
  const saveChapterMutation = useMutation({
    mutationFn: async ({ content, title }: { content: string; title: string }) => {
      const res = await apiRequest(
        'PATCH',
        `/api/content/${contentId}/chapter/${chapterNumber}`,
        {
          title,
          content
        }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Lưu thành công',
        description: 'Nội dung chương đã được cập nhật.'
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/content/${contentId}/chapter/${chapterNumber}`] 
      });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi lưu',
        description: 'Đã xảy ra lỗi khi lưu nội dung chương. Vui lòng thử lại.',
        variant: 'destructive'
      });
      console.error('Error saving chapter:', error);
    }
  });

  // Save chapter handler
  const handleSaveChapter = (content: string, title: string) => {
    setIsSaving(true);
    saveChapterMutation.mutate({ content, title }, {
      onSettled: () => {
        setIsSaving(false);
      }
    });
  };

  // Check if content exists and is novel
  if (contentData?.content?.type !== 'novel') {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Không hỗ trợ chỉnh sửa</h1>
            <p className="text-muted-foreground mb-4">
              Chức năng soạn thảo nâng cao chỉ hỗ trợ cho truyện chữ.
            </p>
            <Button asChild>
              <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-xl font-semibold">Đang tải dữ liệu...</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (isError || !chapterData) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Lỗi khi tải dữ liệu</h1>
            <p className="text-muted-foreground mb-4">
              Không thể tải thông tin chương. Vui lòng thử lại sau.
            </p>
            <Button asChild>
              <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { chapter, content: chapterContent } = chapterData;
  const contentTitle = contentData?.content?.title || 'Nội dung chưa có tiêu đề';

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="mb-2"
            >
              <Link href={`/truyen/${contentId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Quay lại trang truyện
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{contentTitle}</h1>
            <p className="text-muted-foreground">Soạn thảo chương {chapter.number}</p>
          </div>
          <Button 
            onClick={() => navigate(`/truyen/${contentId}/chapter/${chapterNumber}`)}
            variant="outline"
          >
            Xem chương
          </Button>
        </div>

        <RichTextEditor
          initialValue={chapterContent || ''}
          title={chapter.title || ''}
          onSave={handleSaveChapter}
        />
      </div>
    </MainLayout>
  );
}

export default function DefaultChapterEditPage() {
  const [, params] = useLocation();

  if (!params) return null;

  const contentId = parseInt(params.contentId);
  const chapterNumber = parseInt(params.chapterNumber);

  if (isNaN(contentId) || isNaN(chapterNumber)) {
    return <div>ID hoặc số chương không hợp lệ</div>;
  }

  return <ChapterEditPage contentId={contentId} chapterNumber={chapterNumber} />;
}