import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Chapter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  onUnlockSuccess: () => void;
}

export function UnlockModal({
  isOpen,
  onClose,
  chapter,
  onUnlockSuccess
}: UnlockModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Fetch the latest user data to get current balance
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    enabled: isOpen && !!user,
  });

  // Get user balance
  const userBalance = (userData as any)?.balance || (user as any)?.balance || 0;
  
  // Check if user has enough balance
  const hasEnoughBalance = userBalance >= (chapter.unlockPrice || 0);
  
  // Unlock chapter mutation
  const unlockMutation = useMutation({
    mutationFn: async () => {
      setIsUnlocking(true);
      const response = await apiRequest("POST", `/api/chapters/${chapter.id}/unlock`);
      return response.json();
    },
    onSuccess: () => {
      setIsUnlocking(false);
      toast({
        title: "Mở khóa thành công",
        description: "Bạn đã mở khóa chương này thành công.",
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/chapters/${chapter.id}`] });
      
      // Invalidate content/chapter query to update isUnlocked status
      const contentId = chapter.contentId;
      const chapterNumber = chapter.number;
      if (contentId && chapterNumber) {
        // Invalidate specific chapter data
        queryClient.invalidateQueries({ 
          queryKey: [`/api/content/${contentId}/chapter/${chapterNumber}`] 
        });
        
        // Invalidate unlocked chapters list
        queryClient.invalidateQueries({
          queryKey: [`/api/user/unlocked-chapters/${contentId}`]
        });
      }
      
      onUnlockSuccess();
      onClose();
    },
    onError: (error: Error) => {
      setIsUnlocking(false);
      toast({
        title: "Mở khóa thất bại",
        description: error.message || "Đã xảy ra lỗi khi mở khóa chương.",
        variant: "destructive",
      });
    }
  });
  
  const handleUnlock = () => {
    unlockMutation.mutate();
  };
  
  if (!chapter) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-center">Chương đã bị khóa</DialogTitle>
          <DialogDescription className="text-center">
            Bạn cần mở khóa chương này để tiếp tục đọc truyện.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted rounded-lg p-4 my-4">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Giá mở khóa:</span>
            <span className="font-bold">{formatCurrency(chapter.unlockPrice || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số dư hiện tại:</span>
            <span className={`font-bold ${!hasEnoughBalance ? 'text-destructive' : ''}`}>
              {formatCurrency(userBalance)}
            </span>
          </div>
          {!hasEnoughBalance && (
            <p className="text-destructive text-xs mt-2">
              Số dư không đủ để mở khóa chương này.
            </p>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleUnlock} 
            disabled={!hasEnoughBalance || isUnlocking}
            className="w-full"
          >
            {isUnlocking ? "Đang mở khóa..." : "Mở khóa ngay"}
          </Button>
          
          <Button 
            variant="outline" 
            asChild 
            className="w-full"
          >
            <Link href="/payment">Nạp thêm tiền</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UnlockModal;
