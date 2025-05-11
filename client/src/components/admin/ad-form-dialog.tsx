import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Advertisement } from "@/components/ads/ad-context";

// Schema for ad validation
const adSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  targetUrl: z.string().url("URL không hợp lệ"),
  position: z.string().min(1, "Vị trí là bắt buộc"),
  isActive: z.boolean().default(true),
  displayFrequency: z.number().min(0).nullable().optional(),
  width: z.number().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  displayOrder: z.number().min(0).nullable().optional(),
});

type AdFormValues = z.infer<typeof adSchema>;

interface AdFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: Advertisement | null;
  onSuccess: () => void;
}

export function AdFormDialog({ open, onOpenChange, ad, onSuccess }: AdFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(ad?.imageUrl || "");

  // Initialize form with ad data or defaults
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: ad?.title || "",
      targetUrl: ad?.targetUrl || "",
      position: ad?.position || "top",
      isActive: ad?.isActive ?? true,
      displayFrequency: ad?.displayFrequency || null,
      width: ad?.width || null,
      height: ad?.height || null,
      displayOrder: ad?.displayOrder || 0,
    },
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission
  const onSubmit = async (data: AdFormValues) => {
    setIsSubmitting(true);

    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Add image file if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let response;
      if (ad) {
        // Update existing ad
        response = await fetch(`/api/ads/${ad.id}`, {
          method: "PATCH",
          body: formData,
          credentials: 'include'
        });
      } else {
        // Create new ad
        response = await fetch("/api/ads", {
          method: "POST",
          body: formData,
          credentials: 'include'
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save advertisement");
      }

      // Show success message
      toast({
        title: ad ? "Cập nhật thành công" : "Thêm mới thành công",
        description: ad
          ? "Quảng cáo đã được cập nhật."
          : "Quảng cáo mới đã được thêm vào hệ thống.",
        variant: "success",
      });

      // Call success callback
      onSuccess();
    } catch (error) {
      console.error("Error saving ad:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu quảng cáo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{ad ? "Sửa quảng cáo" : "Thêm quảng cáo mới"}</DialogTitle>
          <DialogDescription>
            {ad ? "Cập nhật thông tin quảng cáo." : "Thêm một quảng cáo mới vào hệ thống."}
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
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL đích</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập URL đích" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vị trí hiển thị" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="top">Đầu trang</SelectItem>
                      <SelectItem value="bottom">Cuối trang</SelectItem>
                      <SelectItem value="left">Trái</SelectItem>
                      <SelectItem value="right">Phải</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chiều rộng (px)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Chiều rộng"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chiều cao (px)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Chiều cao"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thứ tự hiển thị</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Thứ tự hiển thị (0 = mặc định)"
                      {...field}
                      value={field.value === null ? "0" : field.value}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tần suất hiển thị (giây)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Tần suất hiển thị (để trống = mọi lúc)"
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Kích hoạt</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Quảng cáo sẽ hiển thị cho người dùng.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Hình ảnh quảng cáo</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {(imagePreview || ad?.imageUrl) && (
                <div className="mt-2 max-w-[300px] mx-auto">
                  <img
                    src={imagePreview || ad?.imageUrl}
                    alt="Ad preview"
                    className="max-w-full h-auto rounded-md border"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : ad ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}