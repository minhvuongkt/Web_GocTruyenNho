import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Ad schema validation
const adSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: "Tiêu đề không được để trống" }),
  imageUrl: z.string().min(1, { message: "URL hình ảnh không được để trống" }),
  targetUrl: z.string().min(1, { message: "URL đích không được để trống" }),
  position: z.enum(["banner", "sidebar_left", "sidebar_right", "popup", "overlay"], { 
    required_error: "Vui lòng chọn vị trí" 
  }),
  startDate: z.string().min(1, { message: "Ngày bắt đầu không được để trống" }),
  endDate: z.string().min(1, { message: "Ngày kết thúc không được để trống" }),
  isActive: z.boolean().default(true),
  displayFrequency: z.number().min(15).max(60).optional(),
});

type AdFormValues = z.infer<typeof adSchema>;

interface AdvertisementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement?: any;
  mode: "add" | "edit";
}

export function AdvertisementFormDialog({
  open,
  onOpenChange,
  advertisement,
  mode,
}: AdvertisementFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      targetUrl: "",
      position: "banner",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      isActive: true,
    },
  });

  // Update form values when advertisement changes (for edit mode)
  useEffect(() => {
    if (advertisement && mode === "edit") {
      form.reset({
        id: advertisement.id,
        title: advertisement.title,
        imageUrl: advertisement.imageUrl,
        targetUrl: advertisement.targetUrl,
        position: advertisement.position,
        startDate: format(new Date(advertisement.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(advertisement.endDate), "yyyy-MM-dd"),
        isActive: advertisement.isActive,
      });
    } else if (mode === "add") {
      form.reset({
        title: "",
        imageUrl: "",
        targetUrl: "",
        position: "banner",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        isActive: true,
      });
    }
  }, [advertisement, mode, form]);

  // Create advertisement mutation
  const createAdMutation = useMutation({
    mutationFn: async (adData: AdFormValues) => {
      setIsSubmitting(true);
      try {
        // Convert dates to ISO strings
        const formattedData = {
          ...adData,
          startDate: new Date(adData.startDate).toISOString(),
          endDate: new Date(adData.endDate).toISOString(),
        };
        
        const response = await apiRequest("POST", "/api/ads", formattedData);
        return await response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm quảng cáo mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm quảng cáo",
        variant: "destructive",
      });
    },
  });

  // Update advertisement mutation
  const updateAdMutation = useMutation({
    mutationFn: async (adData: AdFormValues) => {
      setIsSubmitting(true);
      try {
        if (!adData.id) throw new Error("Thiếu ID quảng cáo");
        
        // Convert dates to ISO strings
        const formattedData = {
          ...adData,
          startDate: new Date(adData.startDate).toISOString(),
          endDate: new Date(adData.endDate).toISOString(),
        };
        
        const response = await apiRequest("PUT", `/api/ads/${adData.id}`, formattedData);
        return await response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật quảng cáo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật quảng cáo",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AdFormValues) => {
    if (mode === "add") {
      createAdMutation.mutate(data);
    } else {
      updateAdMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm quảng cáo mới" : "Sửa quảng cáo"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Thêm quảng cáo mới vào hệ thống" 
              : "Chỉnh sửa thông tin quảng cáo"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề quảng cáo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Hình ảnh</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Đích</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/landing-page" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vị trí</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vị trí hiển thị" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="sidebar_left">Thanh bên trái</SelectItem>
                      <SelectItem value="sidebar_right">Thanh bên phải</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="overlay">Overlay (Toàn màn hình)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Trạng thái</FormLabel>
                    <FormDescription>
                      Quảng cáo có đang hoạt động hay không
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "add" ? "Thêm quảng cáo" : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}