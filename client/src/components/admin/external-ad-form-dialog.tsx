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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Advertisement } from "@shared/schema";

// Schema for external ad validation
const externalAdSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  provider: z.enum(["google", "facebook", "other"], {
    required_error: "Vui lòng chọn nhà cung cấp",
  }),
  position: z.enum(["top", "bottom", "left", "right", "popup", "overlay", "custom"], {
    required_error: "Vui lòng chọn vị trí",
  }),
  targetUrl: z.string().default("https://example.com"),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.date({
    required_error: "Vui lòng chọn ngày bắt đầu",
  }),
  endDate: z.date({
    required_error: "Vui lòng chọn ngày kết thúc",
  }),
  // Các thuộc tính cho metadata
  scriptContent: z.string().min(1, "Nội dung script là bắt buộc"),
  containerId: z.string().optional(),
  isMobileEnabled: z.boolean().default(true),
  adUnitId: z.string().optional(),
  slotId: z.string().optional(),
  publisherId: z.string().optional(),
  cssSelector: z.string().optional(),
  cssStyles: z.string().optional(),
  format: z.string().optional(),
});

type ExternalAdFormValues = z.infer<typeof externalAdSchema>;

interface ExternalAdFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: Advertisement | null;
  onSuccess: () => void;
}

export function ExternalAdFormDialog({
  open,
  onOpenChange,
  ad,
  onSuccess,
}: ExternalAdFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract metadata from ad if it exists
  const metadata = ad?.metadata 
    ? (typeof ad.metadata === 'string' 
      ? JSON.parse(ad.metadata) 
      : ad.metadata) 
    : {};
    
  // Log để debug
  console.log('ExternalAdFormDialog - Ad Data:', ad);
  console.log('ExternalAdFormDialog - Metadata:', metadata);

  // Initialize form with ad data or defaults
  const form = useForm<ExternalAdFormValues>({
    resolver: zodResolver(externalAdSchema),
    defaultValues: {
      title: ad?.title || "",
      provider: (ad?.provider as any) || "google",
      position: ad?.position || "custom",
      targetUrl: ad?.targetUrl || "https://example.com",
      width: ad?.width || null,
      height: ad?.height || null,
      displayOrder: ad?.displayOrder || 0,
      isActive: ad?.isActive ?? true,
      startDate: ad?.startDate ? new Date(ad.startDate) : new Date(),
      endDate: ad?.endDate ? new Date(ad.endDate) : (() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
      })(),
      // Metadata fields
      scriptContent: metadata.scriptContent || "",
      containerId: metadata.containerId || "",
      isMobileEnabled: metadata.isMobileEnabled ?? true,
      adUnitId: metadata.adUnitId || "",
      slotId: metadata.slotId || "",
      publisherId: metadata.publisherId || "",
      cssSelector: metadata.cssSelector || "",
      cssStyles: metadata.cssStyles || "",
      format: metadata.format || "",
    },
  });

  // Form submission
  const onSubmit = async (data: ExternalAdFormValues) => {
    setIsSubmitting(true);

    try {
      // Create metadata object from form data
      const metadata = {
        scriptContent: data.scriptContent,
        containerId: data.containerId,
        isMobileEnabled: data.isMobileEnabled,
        adUnitId: data.adUnitId,
        slotId: data.slotId,
        publisherId: data.publisherId,
        cssSelector: data.cssSelector,
        cssStyles: data.cssStyles,
        format: data.format,
      };

      // Create payload for API request
      const payload = {
        title: data.title,
        provider: data.provider,
        position: data.position,
        width: data.width,
        height: data.height,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        metadata: metadata,
        targetUrl: data.targetUrl // Sử dụng targetUrl từ form
      };
      
      console.log("Sending payload to API:", payload);

      let response;
      if (ad) {
        // Update existing ad
        response = await apiRequest("PATCH", `/api/ads/${ad.id}`, payload);
      } else {
        // Create new ad
        response = await apiRequest("POST", "/api/ads", payload);
      }

      // Show success message
      toast({
        title: ad ? "Cập nhật thành công" : "Thêm mới thành công",
        description: ad
          ? "Quảng cáo bên thứ 3 đã được cập nhật."
          : "Quảng cáo bên thứ 3 mới đã được thêm vào hệ thống.",
        variant: "default",
      });

      // Call success callback
      onSuccess();
      
      // Reset form nếu là thêm mới (không phải edit)
      if (!ad) {
        form.reset({
          title: "",
          provider: "google",
          position: "top",
          targetUrl: "https://example.com",
          width: null,
          height: null,
          displayOrder: 0,
          isActive: true,
          startDate: new Date(),
          endDate: (() => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date;
          })(),
          scriptContent: "",
          containerId: "",
          isMobileEnabled: true,
          adUnitId: "",
          slotId: "",
          publisherId: "",
          cssSelector: "",
          cssStyles: "",
          format: "",
        });
        // Thông báo cho user và giữ dialog mở
        return;
      }
      // Close the dialog nếu là edit
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving external ad:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu quảng cáo bên thứ 3",
        variant: "destructive",
      });
      
      // Nếu là thêm mới, reset form ngay cả khi lỗi (để user có thể thử lại)
      if (!ad) {
        form.reset({
          title: "",
          provider: "google",
          position: "top",
          targetUrl: "https://example.com",
          width: null,
          height: null,
          displayOrder: 0,
          isActive: true,
          startDate: new Date(),
          endDate: (() => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date;
          })(),
          scriptContent: "",
          containerId: "",
          isMobileEnabled: true,
          adUnitId: "",
          slotId: "",
          publisherId: "",
          cssSelector: "",
          cssStyles: "",
          format: "",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle provider change
  const handleProviderChange = (value: string) => {
    form.setValue("provider", value);
    
    // Set placeholder for script content based on provider
    if (value === "google") {
      form.setValue("scriptContent", `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
<!-- Ad unit name -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
      `.trim());
      
      // Also update related fields for Google AdSense
      form.setValue("adUnitId", "ca-pub-XXXXXXXXXXXXXXXX");
      form.setValue("slotId", "XXXXXXXXXX");
    } else if (value === "facebook") {
      form.setValue("scriptContent", `
<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; padding: 10px; text-align: center;">
  <div>
    <div style="font-weight: bold; color: #3b5998;">Facebook Ad Mockup</div>
    <div style="margin-top: 5px; font-size: 12px; color: #666;">Facebook ad will appear here - 300x250</div>
  </div>
</div>
      `.trim());
    } else {
      form.setValue("scriptContent", "");
    }
  };

  const watchProvider = form.watch("provider");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ad ? "Sửa quảng cáo bên thứ 3" : "Thêm quảng cáo bên thứ 3 mới"}
          </DialogTitle>
          <DialogDescription>
            {ad
              ? "Cập nhật thông tin quảng cáo bên thứ 3."
              : "Thêm một quảng cáo bên thứ 3 mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên quảng cáo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên quảng cáo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhà cung cấp</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleProviderChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà cung cấp" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google">Google AdSense</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground">Để trống để tự động điều chỉnh</p>
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
                  <p className="text-xs text-muted-foreground">
                    Số càng nhỏ thì quảng cáo càng được ưu tiên hiển thị
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchProvider === "google" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adUnitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AdSense Unit ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Mã Ad Unit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publisherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publisher ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Mã Publisher" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="containerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container ID (tùy chọn)</FormLabel>
                  <FormControl>
                    <Input placeholder="ID của container (nếu có)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scriptContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung script</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập mã script hoặc HTML quảng cáo"
                      className="min-h-[150px] font-mono text-sm resize-y" 
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Mã script sẽ được nhúng vào trang web. Đối với Google AdSense, bạn có thể dán mã script từ AdSense.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cssSelector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSS Selector (tùy chọn)</FormLabel>
                    <FormControl>
                      <Input placeholder="CSS selector" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cssStyles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSS Styles (tùy chọn)</FormLabel>
                    <FormControl>
                      <Input placeholder="CSS styles" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
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

              <FormField
                control={form.control}
                name="isMobileEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base font-medium">Hiển thị trên mobile</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Quảng cáo sẽ hiển thị trên thiết bị di động.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Đang lưu..."
                  : ad
                  ? "Cập nhật"
                  : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}