import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

import { RichTextEditor } from "@/components/shared/rich-text-editor";
import "react-quill/dist/quill.snow.css";
// UI Components
import AdminLayout from "@/components/layouts/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Icons
import {
  AlertTriangle,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Upload,
  File,
  Image,
  X,
  UploadCloud,
  FileUp,
} from "lucide-react";

export default function ChapterNewPage({ contentId }: { contentId: number }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  // State for chapter data
  const [chapter, setChapter] = useState({
    contentId: contentId || 0, // Initialize with the prop value but don't recreate the object when contentId changes
    number: 1,
    title: "",
    content: "",
    isLocked: false,
    unlockPrice: 0,
  });

  // Update contentId when the prop changes (without causing infinite updates)
  useEffect(() => {
    if (contentId && contentId !== chapter.contentId) {
      setChapter((prev) => ({ ...prev, contentId }));
    }
  }, [contentId]);

  // State for image uploads (manga)
  const [chapterImages, setChapterImages] = useState<File[]>([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // State for insertion position
  const [insertPosition, setInsertPosition] = useState("end");
  const [referenceChapterId, setReferenceChapterId] = useState<number | null>(
    null,
  );
  const [insertRelative, setInsertRelative] = useState<"before" | "after">(
    "after",
  );

  // Query to fetch content details
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) throw new Error("Không thể tải thông tin truyện");
      const data = await response.json();
      return data.content;
    },
    enabled: !!contentId,
  });
  // Query to fetch chapters for reference
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/content/${contentId}/chapters`],
    queryFn: async () => {
      const response = await fetch(`/api/content/${contentId}/chapters`);
      if (!response.ok) throw new Error("Không thể tải danh sách chương");
      return response.json();
    },
    enabled: !!contentId,
  });

  const chapters = chaptersData || [];

  // Query to fetch payment settings for default unlock price
  const { data: paymentSettings } = useQuery({
    queryKey: [`/api/payment-settings`],
    queryFn: async () => {
      const response = await fetch(`/api/payment-settings`);
      if (!response.ok) throw new Error("Không thể tải cài đặt thanh toán");
      return response.json();
    },
  });

  // Set default unlock price from settings
  useEffect(() => {
    if (paymentSettings?.chapterUnlockPrice) {
      setChapter((prev) => ({
        ...prev,
        unlockPrice: paymentSettings.chapterUnlockPrice,
      }));
    }
  }, [paymentSettings]);

  // Set default chapter number
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      const maxChapterNumber = Math.max(...chapters.map((c: any) => c.number));
      setChapter((prev) => ({ ...prev, number: maxChapterNumber + 1 }));
    } else {
      setChapter((prev) => ({ ...prev, number: 1 }));
    }
  }, [chapters]);

  // Mutation to create a new chapter
  const createChapterMutation = useMutation({
    mutationFn: async (chapterData: any) => {
      const response = await apiRequest(
        "POST",
        `/api/content/${contentId}/chapters`,
        chapterData,
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Thêm chương thành công",
        description: "Chương mới đã được thêm vào truyện",
      });

      // Redirect to chapter list
      navigate(`/admin/chapters/${contentId}`);

      // Refresh chapters data
      queryClient.invalidateQueries({
        queryKey: [`/api/content/${contentId}/chapters`],
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể thêm chương",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi thêm chương mới",
        variant: "destructive",
      });
    },
  });

  // Mutation to upload image files for manga chapters
  const uploadImagesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/chapters/images/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tải ảnh lên");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Create image content from uploaded URLs
      if (data.imageUrls && data.imageUrls.length > 0) {
        // Cấu trúc mới: Lưu ảnh dưới dạng JSON với key là số thứ tự
        const imageJson = data.imageUrls.reduce(
          (acc: Record<string, string>, url: string, index: number) => {
            acc[index + 1] = url;
            return acc;
          },
          {},
        );

        console.log("Saving image data as JSON:", imageJson);

        // Create chapter with image content as JSON
        createChapterMutation.mutate({
          ...chapter,
          content: JSON.stringify(imageJson),
          positionInfo: {
            insertPosition,
            referenceChapterId: referenceChapterId || undefined,
            insertRelative: insertRelative || undefined,
          },
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Lỗi khi tải ảnh lên",
        description:
          error instanceof Error
            ? error.message
            : "Không thể tải ảnh lên server",
        variant: "destructive",
      });
    },
  });

  // Mutation to process zip file
  const processZipMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/chapters/images/process-zip`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Lỗi khi xử lý file ZIP");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Create image content from extracted images
      if (data.imageUrls && data.imageUrls.length > 0) {
        // Cấu trúc mới: Lưu ảnh dưới dạng JSON với key là số thứ tự
        const imageJson = data.imageUrls.reduce(
          (acc: Record<string, string>, url: string, index: number) => {
            acc[index + 1] = url;
            return acc;
          },
          {},
        );

        console.log("Saving image data as JSON:", imageJson);

        // Create chapter with image content as JSON
        createChapterMutation.mutate({
          ...chapter,
          content: JSON.stringify(imageJson),
          positionInfo: {
            insertPosition,
            referenceChapterId: referenceChapterId || undefined,
            insertRelative: insertRelative || undefined,
          },
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Lỗi khi xử lý file ZIP",
        description:
          error instanceof Error ? error.message : "Không thể xử lý file ZIP",
        variant: "destructive",
      });
    },
  });

  // Mutation to process text file
  const processTextFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/chapters/text/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Lỗi khi xử lý file văn bản");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Set the extracted text content
      if (data.content) {
        setChapter((prev) => ({
          ...prev,
          content: data.content,
        }));

        toast({
          title: "Đã xử lý file văn bản",
          description: "Nội dung đã được nhập vào form",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Lỗi khi xử lý file văn bản",
        description:
          error instanceof Error ? error.message : "Không thể đọc file văn bản",
        variant: "destructive",
      });
    },
  });

  // Handle image file uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // Validate files
      const validFiles = newFiles.filter((file) => {
        const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        );
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

        if (!isValidType) {
          toast({
            title: "Loại file không hợp lệ",
            description: `${file.name} không phải là định dạng JPG, PNG hoặc WEBP`,
            variant: "destructive",
          });
        }

        if (!isValidSize) {
          toast({
            title: "File quá lớn",
            description: `${file.name} vượt quá giới hạn 5MB`,
            variant: "destructive",
          });
        }

        return isValidType && isValidSize;
      });

      setChapterImages((prev) => [...prev, ...validFiles]);
    }
  };

  // Handle zip file upload
  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file
      const isValidType = [
        "application/zip",
        "application/x-zip-compressed",
      ].includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit

      if (!isValidType) {
        toast({
          title: "Loại file không hợp lệ",
          description: `${file.name} không phải là định dạng ZIP`,
          variant: "destructive",
        });
        return;
      }

      if (!isValidSize) {
        toast({
          title: "File quá lớn",
          description: `${file.name} vượt quá giới hạn 50MB`,
          variant: "destructive",
        });
        return;
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append("zipFile", file);
      formData.append("contentId", contentId.toString());

      // Process the ZIP file
      processZipMutation.mutate(formData);
    }
  };

  // Handle text file upload
  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file
      const isValidType = [
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ].includes(file.type);
      const isValidSize = file.size <= 100 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        toast({
          title: "Loại file không hợp lệ",
          description: `${file.name} không phải là định dạng TXT, DOC hoặc DOCX`,
          variant: "destructive",
        });
        return;
      }

      if (!isValidSize) {
        toast({
          title: "File quá lớn",
          description: `${file.name} vượt quá giới hạn 100MB`,
          variant: "destructive",
        });
        return;
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append("textFile", file);

      // Process the text file
      processTextFileMutation.mutate(formData);
    }
  };
  // Remove selected image
  const removeImage = (index: number) => {
    setChapterImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Format text in novel editor
  const formatText = (format: string) => {
    const textarea = document.getElementById(
      "chapter-content",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = `<b>${selectedText}</b>`;
        break;
      case "italic":
        formattedText = `<i>${selectedText}</i>`;
        break;
      case "underline":
        formattedText = `<u>${selectedText}</u>`;
        break;
      case "h1":
        formattedText = `<h1>${selectedText}</h1>`;
        break;
      case "h2":
        formattedText = `<h2>${selectedText}</h2>`;
        break;
      case "h3":
        formattedText = `<h3>${selectedText}</h3>`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      textarea.value.substring(0, start) +
      formattedText +
      textarea.value.substring(end);

    setChapter((prev) => ({ ...prev, content: newContent }));

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length,
      );
    }, 0);
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "number" || name === "unlockPrice") {
      setChapter((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setChapter((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate basic fields
    // if (!chapter.title.trim()) {
    //   toast({
    //     title: "Thiếu thông tin",
    //     description: "Vui lòng nhập tiêu đề chương",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (chapter.number < 1) {
      toast({
        title: "Số chương không hợp lệ",
        description: "Số chương phải lớn hơn hoặc bằng 1",
        variant: "destructive",
      });
      return;
    }

    if (chapter.isLocked && chapter.unlockPrice < 1) {
      toast({
        title: "Giá mở khóa không hợp lệ",
        description: "Giá mở khóa phải lớn hơn 0 xu",
        variant: "destructive",
      });
      return;
    }

    // Validate content based on content type
    if (content?.type === "novel" && !chapter.content.trim()) {
      toast({
        title: "Thiếu nội dung",
        description: "Vui lòng nhập nội dung chương truyện",
        variant: "destructive",
      });
      return;
    }

    if (content?.type === "manga" && chapterImages.length === 0) {
      toast({
        title: "Thiếu ảnh",
        description: "Vui lòng tải lên ít nhất một ảnh cho chương truyện tranh",
        variant: "destructive",
      });
      return;
    }

    // Process based on content type
    if (content?.type === "manga") {
      // Upload images for manga
      const formData = new FormData();
      chapterImages.forEach((file, index) => {
        formData.append("images", file);
        formData.append(
          "imageNames",
          `image_${index + 1}_${Date.now()}.${file.name.split(".").pop()}`,
        );
      });

      formData.append("contentId", contentId.toString());

      toast({
        title: "Đang tải ảnh lên",
        description: `Đang xử lý ${chapterImages.length} ảnh cho chương mới...`,
      });

      uploadImagesMutation.mutate(formData);
    } else {
      // Directly create novel chapter
      createChapterMutation.mutate({
        ...chapter,
        positionInfo: {
          insertPosition,
          referenceChapterId: referenceChapterId || undefined,
          insertRelative: insertRelative || undefined,
        },
      });
    }
  };

  // Drag and drop handling for manga images
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-primary");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("border-primary");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      // Validate files
      const validFiles = newFiles.filter((file) => {
        const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        );
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

        if (!isValidType) {
          toast({
            title: "Loại file không hợp lệ",
            description: `${file.name} không phải là định dạng JPG, PNG hoặc WEBP`,
            variant: "destructive",
          });
        }

        if (!isValidSize) {
          toast({
            title: "File quá lớn",
            description: `${file.name} vượt quá giới hạn 5MB`,
            variant: "destructive",
          });
        }

        return isValidType && isValidSize;
      });

      setChapterImages((prev) => [...prev, ...validFiles]);
    }
  };

  // Loading state
  if (contentLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[500px]">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">
              Đang tải thông tin truyện...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Content not found
  if (!content) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[500px]">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">
              Không tìm thấy truyện
            </h2>
            <p className="mt-2 text-muted-foreground">
              Không tìm thấy truyện với ID: {contentId}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => navigate("/admin/manga")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách truyện
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Thêm chương mới
            </h1>
            <p className="text-muted-foreground">
              {content.title} -{" "}
              {content.type === "manga" ? "Truyện tranh" : "Truyện chữ"}
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/chapters/${contentId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách chương
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Thông tin chương</CardTitle>
              <CardDescription>
                Nhập thông tin cơ bản cho chương mới.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="title">Tiêu đề chương</Label>
                    <Input
                      id="title"
                      name="title"
                      value={chapter.title}
                      onChange={handleInputChange}
                      placeholder="Nhập tiêu đề chương"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="number">Chapter</Label>
                    <Input
                      id="number"
                      name="number"
                      type="number"
                      value={chapter.number}
                      onChange={handleInputChange}
                      min={1}
                      className="mt-1"
                    />
                  </div>

                  {/* <div>
                    <Label htmlFor="releaseDate">Ngày phát hành</Label>
                    <Input
                      id="releaseDate"
                      name="releaseDate"
                      type="date"
                      value={chapter.releaseDate}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div> */}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-1 block">Vị trí chèn chương</Label>
                    <RadioGroup
                      value={insertPosition}
                      onValueChange={setInsertPosition}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="end" id="option-end" />
                        <Label htmlFor="option-end">
                          Tự động chèn vào cuối
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific" id="option-specific" />
                        <Label htmlFor="option-specific">
                          Chèn vào vị trí cụ thể
                        </Label>
                      </div>
                    </RadioGroup>

                    {insertPosition === "specific" && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="referenceChapter">
                            Chương tham chiếu
                          </Label>
                          <Select
                            value={referenceChapterId?.toString() || ""}
                            onValueChange={(value) =>
                              setReferenceChapterId(parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn chương" />
                            </SelectTrigger>
                            <SelectContent>
                              {chaptersLoading ? (
                                <div className="flex justify-center p-2">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                              ) : chapters.length === 0 ? (
                                <div className="p-2 text-center text-muted-foreground">
                                  Chưa có chương nào
                                </div>
                              ) : (
                                chapters.map((chapter: any) => (
                                  <SelectItem
                                    key={chapter.id}
                                    value={chapter.id.toString()}
                                  >
                                    {chapter.number}.{" "}
                                    {chapter.title ||
                                      `Chương ${chapter.number}`}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="insertRelative">Vị trí chèn</Label>
                          <Select
                            value={insertRelative}
                            onValueChange={(value) =>
                              setInsertRelative(value as "before" | "after")
                            }
                            disabled={!referenceChapterId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn vị trí" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="before">Chèn trước</SelectItem>
                              <SelectItem value="after">Chèn sau</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lock-status">Khóa chương</Label>
                      <Switch
                        id="lock-status"
                        checked={chapter.isLocked}
                        onCheckedChange={(checked) => {
                          setChapter((prev) => ({
                            ...prev,
                            isLocked: checked,
                          }));
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {chapter.isLocked
                        ? "Người dùng cần trả phí để đọc chương này"
                        : "Chương này sẽ được hiển thị miễn phí cho tất cả người dùng"}
                    </p>

                    {chapter.isLocked && (
                      <div className="mt-4">
                        <Label htmlFor="unlockPrice">Giá mở khóa (xu)</Label>
                        <Input
                          id="unlockPrice"
                          name="unlockPrice"
                          type="number"
                          value={chapter.unlockPrice}
                          onChange={handleInputChange}
                          min={1}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Giá đề xuất: 100-400 xu cho chương thường, 500-1000 xu
                          cho chương đặc biệt.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nội dung chương</CardTitle>
              <CardDescription>
                {content.type === "manga"
                  ? "Tải lên ảnh cho chương truyện tranh"
                  : "Nhập nội dung cho chương truyện chữ"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {content.type === "novel" ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => textFileInputRef.current?.click()}
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      Upload từ file văn bản
                    </Button>
                    <input
                      type="file"
                      ref={textFileInputRef}
                      className="hidden"
                      accept=".txt,.doc,.docx"
                      onChange={handleTextFileUpload}
                    />
                  </div>

                  <RichTextEditor
                    id="chapter-content"
                    initialValue={chapter.content}
                    onChange={(content) => {
                      setChapter((prev: any) => ({
                        ...prev,
                        content: content,
                      }));
                    }}
                    placeholder="Nhập nội dung chương truyện..."
                    showSubmitButton={false}
                    autosaveInterval={30}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Tabs defaultValue="image-upload">
                    <TabsList className="mb-4">
                      <TabsTrigger value="image-upload">
                        Tải lên ảnh
                      </TabsTrigger>
                      <TabsTrigger value="zip-upload">
                        Tải lên file ZIP
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="image-upload">
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <UploadCloud className="h-10 w-10 text-muted-foreground" />
                          <h3 className="font-medium">
                            Kéo thả hoặc nhấn để tải lên ảnh
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB mỗi ảnh.
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            multiple
                          />
                        </div>
                      </div>

                      {chapterImages.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-medium mb-2">
                            Ảnh đã tải lên ({chapterImages.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {chapterImages.map((file, index) => (
                              <div
                                key={index}
                                className="relative border rounded-md overflow-hidden"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="h-24 w-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <div className="bg-secondary text-xs p-1 text-center truncate">
                                  {index + 1}.{" "}
                                  {file.name.length > 15
                                    ? file.name.substring(0, 15) + "..."
                                    : file.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="zip-upload">
                      <div
                        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => zipFileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <File className="h-12 w-12 text-muted-foreground" />
                          <h3 className="font-medium">
                            Nhấn để tải lên file ZIP
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Tải lên file ZIP chứa các ảnh đã được đánh số thứ
                            tự.
                            <br />
                            Ví dụ: 01.jpg, 02.jpg, 03.jpg, ...
                          </p>
                          <input
                            type="file"
                            ref={zipFileInputRef}
                            className="hidden"
                            accept=".zip,application/zip,application/x-zip-compressed"
                            onChange={handleZipUpload}
                          />
                        </div>
                      </div>
                      {processZipMutation.isPending && (
                        <div className="mt-6 flex flex-col items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                          <p className="mt-2">Đang xử lý file ZIP...</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(`/admin/chapters/${contentId}`)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                createChapterMutation.isPending ||
                uploadImagesMutation.isPending ||
                processZipMutation.isPending
              }
            >
              {createChapterMutation.isPending ||
              uploadImagesMutation.isPending ||
              processZipMutation.isPending ? (
                <>
                  <span className="mr-2">Đang xử lý</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Lưu chương mới"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
