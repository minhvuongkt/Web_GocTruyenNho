import { useState, useEffect, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Eye } from "lucide-react";

// Font options cho dropdown
const fontOptions = [
  { value: "Arial", label: "Arial", className: "arial" },
  { value: "Times New Roman", label: "Times New Roman", className: "times-new-roman" },
  { value: "Tahoma", label: "Tahoma", className: "tahoma" },
  { value: "Verdana", label: "Verdana", className: "verdana" },
  { value: "Open Sans", label: "Open Sans", className: "open-sans" },
  { value: "Roboto", label: "Roboto", className: "roboto" },
  { value: "Merriweather", label: "Merriweather", className: "merriweather" },
  { value: "Source Sans Pro", label: "Source Sans Pro", className: "source-sans-pro" },
  { value: "Noticia Text", label: "Noticia Text", className: "noticia-text" },
  { value: "Segoe UI", label: "Segoe UI", className: "segoe-ui" },
  { value: "Noto Sans", label: "Noto Sans", className: "noto-sans" },
  { value: "Serif", label: "Serif", className: "serif" },
];

// Đảm bảo danh sách font cho Quill khớp với fontOptions
const fonts = fontOptions.map(font => font.className);

const sizes = Array.from(
  { length: (48 - 10) / 2 + 1 },
  (_, i) => `${10 + i * 2}px`,
);

// Quill modules và formats
const modules = {
  toolbar: [
    // [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: fonts }],
    [{ size: sizes }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "image", "video", "formula"],
  ],
};

const formats = [
  // "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "align",
  "list",
  "bullet",
  "check",
  "indent",
  "link",
  "image",
  "video",
  "formula",
];

interface RichTextEditorProps {
  id?: string;
  initialValue?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string, title: string) => void;
  title?: string;
  autosaveInterval?: number; // in milliseconds
  readOnly?: boolean;
  placeholder?: string;
  showSubmitButton?: boolean;
}

export function RichTextEditor({
  id,
  initialValue = "",
  onChange,
  onSave,
  title = "",
  autosaveInterval = 30000, // 30 seconds default
  readOnly = false,
  placeholder = "Bắt đầu soạn thảo nội dung chương...",
  showSubmitButton = true,
}: RichTextEditorProps) {
  const [editorValue, setEditorValue] = useState(initialValue);
  const [chapterTitle, setChapterTitle] = useState(title);
  const [activeTab, setActiveTab] = useState("edit");
  // Sử dụng default font nếu không có font được chọn
  const defaultFont = fontOptions[0].value;
  const [fontFamily, setFontFamily] = useState(defaultFont);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  // Auto-save timer
  useEffect(() => {
    if (readOnly) return;

    const timer = setInterval(() => {
      if (editorValue !== initialValue) {
        handleSave();
      }
    }, autosaveInterval);

    return () => clearInterval(timer);
  }, [editorValue, initialValue, autosaveInterval, readOnly]);

  // Handle manual save
  const handleSave = () => {
    if (readOnly) return;

    setIsSaving(true);

    // Call onSave if provided
    if (onSave) {
      onSave(editorValue, chapterTitle);
    }

    setLastSaved(new Date());

    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  // Apply font family to entire editor
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const container = editor.root as HTMLElement;
      container.style.fontFamily = fontFamily;
    }
  }, [fontFamily]);

  // If readOnly, just show the content
  if (readOnly) {
    return (
      <div className="rich-text-view">
        <h2 className="text-2xl font-semibold mb-6">{chapterTitle}</h2>
        <div
          className="ql-editor"
          style={{ fontFamily }}
          dangerouslySetInnerHTML={{ __html: editorValue }}
        />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="border rounded-md flex items-center justify-between p-2">
          <div className="flex-1">
            <Input
              placeholder="Nhập tiêu đề chương"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="text-xl font-bold border-none focus-visible:ring-0 px-0 h-auto text-2xl"
            />
          </div>
        </CardTitle>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn font chữ" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setActiveTab(activeTab === "edit" ? "preview" : "edit")
              }
            >
              <Eye className="h-4 w-4 mr-1" />
              {activeTab === "edit" ? "Xem trước" : "Chỉnh sửa"}
            </Button>
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Đang lưu..." : "Lưu lại"}
            </Button>
          </div>
        </CardTitle>
        {lastSaved && (
          <div className="text-xs text-muted-foreground mt-1">
            Lưu lần cuối: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <div className="w-full">
          <div className="flex w-full border-b mb-4">
            <button
              className={`w-1/2 py-2 text-center ${
                activeTab === "edit" ? "bg-secondary text-secondary-foreground" : ""
              }`}
              onClick={() => setActiveTab("edit")}
            >
              Soạn thảo
            </button>
            <button
              className={`w-1/2 py-2 text-center ${
                activeTab === "preview" ? "bg-secondary text-secondary-foreground" : ""
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Xem trước
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === "edit" ? (
              <div style={{ fontFamily }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={editorValue}
                  onChange={(content) => {
                    setEditorValue(content);
                    if (onChange) {
                      onChange(content);
                    }
                  }}
                  modules={modules}
                  formats={formats}
                  placeholder={placeholder}
                />
              </div>
            ) : (
              <div
                className="ql-editor preview-content"
                style={{ fontFamily }}
                dangerouslySetInnerHTML={{ __html: editorValue }}
              />
            )}
          </div>
        </div>
      </CardContent>
      {showSubmitButton && (
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Tự động lưu sau mỗi {autosaveInterval / 1000} giây không hoạt động
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Đang lưu..." : "Lưu lại"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
