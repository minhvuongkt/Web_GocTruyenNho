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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Advertisement } from "@shared/schema";

// Schema for ad validation
const adSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  targetUrl: z.string().url("URL không hợp lệ").or(z.literal("")),
  position: z.enum(["top", "bottom", "left", "right", "popup", "overlay", "custom"], {
    required_error: "Vị trí là bắt buộc",
  }),
  isActive: z.boolean().default(true),
  displayFrequency: z.number().min(0).nullable().optional(),
  width: z.number().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  displayOrder: z.number().min(0).nullable().optional(),
  startDate: z.date({
    required_error: "Vui lòng chọn ngày bắt đầu",
  }),
  endDate: z.date({
    required_error: "Vui lòng chọn ngày kết thúc",
  }),
  provider: z.enum(["internal", "google", "facebook", "other"]).default("internal"),
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
      startDate: ad?.startDate ? new Date(ad.startDate) : new Date(),
      endDate: ad?.endDate ? new Date(ad.endDate) : (() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      })(),
      provider: ad?.provider || "internal"
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
      
      // Add basic text fields
      formData.append("title", data.title);
      formData.append("targetUrl", data.targetUrl);
      formData.append("position", data.position);
      formData.append("isActive", String(data.isActive));
      formData.append("provider", data.provider);
      
      // Add numeric fields that may be null
      if (data.displayOrder !== null && data.displayOrder !== undefined) {
        formData.append("displayOrder", String(data.displayOrder));
      }
      
      if (data.displayFrequency !== null && data.displayFrequency !== undefined) {
        formData.append("displayFrequency", String(data.displayFrequency));
      }
      
      if (data.width !== null && data.width !== undefined) {
        formData.append("width", String(data.width));
      }
      
      if (data.height !== null && data.height !== undefined) {
        formData.append("height", String(data.height));
      }
      
      // Add dates
      formData.append("startDate", data.startDate.toISOString());
      formData.append("endDate", data.endDate.toISOString());

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
        variant: "default",
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại quảng cáo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại quảng cáo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="internal">Nội bộ</SelectItem>
                        <SelectItem value="google">Google AdSense</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Để trống để tự động điều chỉnh</p>
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
                        className="w-full"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Để trống để tự động điều chỉnh</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground">
                      Số càng nhỏ thì quảng cáo càng được ưu tiên hiển thị
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tần suất hiển thị (phút)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Tần suất hiển thị (để trống = mặc định)"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Áp dụng cho popup và overlay. Mặc định là 30 phút.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/20 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Trạng thái quảng cáo</h3>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">Kích hoạt</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Quảng cáo sẽ hiển thị cho người dùng.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Hình ảnh quảng cáo</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-sm text-muted-foreground">
                Định dạng: JPG, PNG, GIF. Kích thước tối đa: 2MB.
              </p>

              {(imagePreview || ad?.imageUrl) && (
                <div className="mt-4 border rounded-md p-2 bg-muted/10">
                  <div className="aspect-video w-full relative flex items-center justify-center overflow-hidden rounded-md">
                    <img
                      src={imagePreview || ad?.imageUrl}
                      alt="Ad preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">Xem trước hình ảnh quảng cáo</p>
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