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
import { ExternalAdConfig } from "@/components/ads/external-ad";

// Schema for external ad validation
const externalAdSchema = z.object({
  name: z.string().min(1, "Tên quảng cáo là bắt buộc"),
  provider: z.string().min(1, "Nhà cung cấp là bắt buộc"),
  position: z.string().min(1, "Vị trí là bắt buộc"),
  scriptContent: z.string().min(1, "Nội dung script là bắt buộc"),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  containerId: z.string().optional(),
  isActive: z.boolean().default(true),
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
  ad: ExternalAdConfig | null;
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

  // Initialize form with ad data or defaults
  const form = useForm<ExternalAdFormValues>({
    resolver: zodResolver(externalAdSchema),
    defaultValues: {
      name: ad?.name || "",
      provider: ad?.provider || "google",
      position: ad?.position || "top",
      scriptContent: ad?.scriptContent || "",
      width: ad?.width || null,
      height: ad?.height || null,
      containerId: ad?.containerId || "",
      isActive: ad?.isActive ?? true,
      isMobileEnabled: ad?.isMobileEnabled ?? true,
      adUnitId: ad?.adUnitId || "",
      slotId: ad?.slotId || "",
      publisherId: ad?.publisherId || "",
      cssSelector: ad?.cssSelector || "",
      cssStyles: ad?.cssStyles || "",
      format: ad?.format || "",
    },
  });

  // Form submission
  const onSubmit = async (data: ExternalAdFormValues) => {
    setIsSubmitting(true);

    try {
      let response;
      if (ad) {
        // Update existing ad
        response = await apiRequest("PATCH", `/api/external-ads/${ad.id}`, data);
      } else {
        // Create new ad
        response = await apiRequest("POST", "/api/external-ads", data);
      }

      // Show success message
      toast({
        title: ad ? "Cập nhật thành công" : "Thêm mới thành công",
        description: ad
          ? "Quảng cáo bên thứ 3 đã được cập nhật."
          : "Quảng cáo bên thứ 3 mới đã được thêm vào hệ thống.",
        variant: "success",
      });

      // Call success callback
      onSuccess();
    } catch (error) {
      console.error("Error saving external ad:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu quảng cáo bên thứ 3",
        variant: "destructive",
      });
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
<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; padding: 10px; text-align: center;">
  <div>
    <div style="font-weight: bold; color: #4285f4;">Google AdSense Mockup</div>
    <div style="margin-top: 5px; font-size: 12px; color: #666;">Ad will appear here - 728x90</div>
  </div>
</div>
      `.trim());
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
      <DialogContent className="sm:max-w-[700px]">
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
              name="name"
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
                      className="min-h-[120px] font-mono text-sm" 
                      {...field} 
                    />
                  </FormControl>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="isMobileEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hiển thị trên mobile</FormLabel>
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