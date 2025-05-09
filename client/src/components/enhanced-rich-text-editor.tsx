import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Spinner } from './ui/spinner';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Định nghĩa các font chữ
const fonts = [
  'arial',
  'times-new-roman',
  'tahoma',
  'verdana',
  'open-sans',
  'roboto',
  'merriweather',
  'source-sans-pro',
  'noticia-text',
  'segoe-ui',
  'noto-sans',
  'serif',
];

// Định nghĩa các kích cỡ từ 10px đến 48px
const fontSizes = [
  '10px', '11px', '12px', '14px', '16px', '18px', '20px', 
  '22px', '24px', '26px', '28px', '32px', '36px', '40px', '44px', '48px'
];

// Đăng ký các font chữ cho Quill
const fontAttributor = Quill.import('attributors/style/font');
fontAttributor.whitelist = fonts;
Quill.register(fontAttributor, true);

// Size Format
const sizeAttributor = Quill.import('attributors/style/size');
sizeAttributor.whitelist = fontSizes;
Quill.register(sizeAttributor, true);

// Nhập lớp Quill Image Resize
class ImageResize {
  quill: any;
  options: any;
  currentImage: HTMLElement | null;
  overlay: HTMLElement;
  
  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.currentImage = null;
    
    // Tạo overlay để bọc ảnh khi chỉnh sửa
    this.overlay = document.createElement('div');
    this.overlay.classList.add('image-resize-overlay');
    
    // Thêm style cho overlay
    document.head.appendChild(document.createElement('style')).textContent = `
      .image-resize-overlay {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px dashed #3498db;
        z-index: 100;
      }
      .image-resize-handle {
        position: absolute;
        height: 12px;
        width: 12px;
        background: white;
        border: 1px solid #3498db;
        z-index: 101;
      }
      .image-resize-handle-ne { top: -6px; right: -6px; cursor: ne-resize; }
      .image-resize-handle-se { bottom: -6px; right: -6px; cursor: se-resize; }
      .image-resize-handle-sw { bottom: -6px; left: -6px; cursor: sw-resize; }
      .image-resize-handle-nw { top: -6px; left: -6px; cursor: nw-resize; }
    `;
    
    // Lắng nghe sự kiện khi nhấp vào ảnh
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    
    // Thêm overlay vào DOM
    document.body.appendChild(this.overlay);
    this.hideOverlay();
    
    // Khởi tạo các điểm điều chỉnh kích thước
    this.createHandles();
  }
  
  createHandles() {
    const directions = ['nw', 'ne', 'se', 'sw'];
    
    directions.forEach(direction => {
      const handle = document.createElement('div');
      handle.classList.add('image-resize-handle', `image-resize-handle-${direction}`);
      handle.addEventListener('mousedown', this.handleMousedown.bind(this, direction));
      this.overlay.appendChild(handle);
    });
  }
  
  handleClick(event: MouseEvent) {
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      if (this.currentImage === event.target) {
        // Đã chọn ảnh này rồi, không làm gì cả
        return;
      }
      
      // Thiết lập ảnh hiện tại
      this.currentImage = event.target as HTMLElement;
      this.showOverlay();
    } else if (this.currentImage) {
      // Nhấp ra ngoài ảnh, ẩn overlay
      this.hideOverlay();
      this.currentImage = null;
    }
  }
  
  handleMousedown(direction: string, event: MouseEvent) {
    if (!this.currentImage) return;
    
    event.preventDefault();
    
    const imageRect = this.currentImage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = imageRect.width;
    const startHeight = imageRect.height;
    
    const handleMousemove = (moveEvent: MouseEvent) => {
      if (!this.currentImage) return;
      
      moveEvent.preventDefault();
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      // Tính toán kích thước mới dựa trên hướng kéo
      if (direction.includes('e')) {
        newWidth = startWidth + moveEvent.clientX - startX;
      } else if (direction.includes('w')) {
        newWidth = startWidth - (moveEvent.clientX - startX);
      }
      
      if (direction.includes('s')) {
        newHeight = startHeight + moveEvent.clientY - startY;
      } else if (direction.includes('n')) {
        newHeight = startHeight - (moveEvent.clientY - startY);
      }
      
      // Giữ tỷ lệ khung hình
      const ratio = startWidth / startHeight;
      if (moveEvent.shiftKey) {
        if (direction.includes('e') || direction.includes('w')) {
          newHeight = newWidth / ratio;
        } else {
          newWidth = newHeight * ratio;
        }
      }
      
      // Cập nhật kích thước ảnh
      this.currentImage.setAttribute('width', `${newWidth}px`);
      this.currentImage.setAttribute('height', `${newHeight}px`);
      
      // Cập nhật vị trí overlay
      this.showOverlay();
    };
    
    const handleMouseup = () => {
      document.removeEventListener('mousemove', handleMousemove);
      document.removeEventListener('mouseup', handleMouseup);
    };
    
    document.addEventListener('mousemove', handleMousemove);
    document.addEventListener('mouseup', handleMouseup);
  }
  
  showOverlay() {
    if (!this.currentImage) return;
    
    const rect = this.currentImage.getBoundingClientRect();
    const editorRect = this.quill.root.getBoundingClientRect();
    
    this.overlay.style.display = 'block';
    this.overlay.style.left = `${rect.left - editorRect.left + this.quill.root.scrollLeft}px`;
    this.overlay.style.top = `${rect.top - editorRect.top + this.quill.root.scrollTop}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  }
  
  hideOverlay() {
    this.overlay.style.display = 'none';
  }
}

// Đăng ký module ImageResize
Quill.register('modules/imageResize', ImageResize);

// Các định dạng được hỗ trợ
const formats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'align',
  'list',
  'bullet',
  'indent',
  'blockquote',
  'code-block',
  'link',
  'image',
  'video',
];

// Cấu hình Quill
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: fonts }],
    [{ size: fontSizes }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean'],
  ],
  imageResize: {
    displaySize: true,
    modules: ['Resize', 'DisplaySize']
  },
};

interface EnhancedRichTextEditorProps {
  initialValue?: string;
  onSave?: (content: string) => void;
  onChange?: (content: string) => void; // Thêm hàm callback để thông báo khi nội dung thay đổi
  readOnly?: boolean;
  chapterId?: number;
  contentId?: number;
  autoSave?: boolean;
  fontFamily?: string; // Thêm font family hiện tại
  fontSize?: string;   // Thêm font size hiện tại
}

const EnhancedRichTextEditor: React.FC<EnhancedRichTextEditorProps> = ({
  initialValue = '',
  onSave,
  onChange,
  readOnly = false,
  chapterId,
  contentId,
  autoSave = true,
  fontFamily = 'merriweather',
  fontSize = 'large',
}) => {
  const [content, setContent] = useState<string>(initialValue);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string>('');
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [currentFont, setCurrentFont] = useState(fontFamily);
  const [currentSize, setCurrentSize] = useState(fontSize);
  const quillRef = useRef<ReactQuill | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Xử lý thay đổi nội dung
  const handleChange = (value: string) => {
    setContent(value);
    // Gọi callback onChange nếu được cung cấp
    if (onChange) {
      onChange(value);
    }
  };

  // Chức năng tự động lưu
  useEffect(() => {
    if (autoSave && content && content !== initialValue) {
      // Clear timer cũ nếu có
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Thiết lập timer mới (30 giây)
      autoSaveTimerRef.current = setTimeout(() => {
        if (content !== initialValue) {
          handleAutoSave();
        }
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, initialValue, autoSave]);

  // Xử lý tự động lưu
  const handleAutoSave = async () => {
    if (!chapterId || !contentId) return;
    
    try {
      setIsAutoSaving(true);
      
      await apiRequest(
        'PATCH',
        `/api/chapters/${chapterId}`, 
        { 
          content: content,
          fontFamily: currentFont,
          fontSize: currentSize
        }
      );
      
      setLastSaved(new Date());
      toast({
        title: "Tự động lưu",
        description: "Nội dung đã được lưu tự động",
        variant: "default",
      });
    } catch (error) {
      console.error('Error auto-saving content:', error);
      toast({
        title: "Lỗi lưu tự động",
        description: "Không thể lưu nội dung tự động. Vui lòng lưu thủ công.",
        variant: "destructive",
      });
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Xử lý lưu thủ công
  const handleSave = () => {
    if (onSave) {
      // Truyền content cùng với font và size hiện tại
      onSave(content);
      setLastSaved(new Date());
      toast({
        title: "Đã lưu",
        description: "Nội dung đã được lưu thành công",
        variant: "default",
      });
    }
  };
  
  // Xử lý thay đổi font
  const handleFontChange = (fontName: string) => {
    setCurrentFont(fontName);
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const container = editor.root as HTMLElement;
      container.style.fontFamily = fontName;
    }
  };
  
  // Xử lý thay đổi size
  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const container = editor.root as HTMLElement;
      container.style.fontSize = size;
    }
  };

  // Xử lý tải file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Hiển thị thông tin file
      setUploadInfo(`File được chọn: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  // Xử lý upload file
  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "Không có file",
        description: "Vui lòng chọn file trước khi tải lên",
        variant: "destructive",
      });
      return;
    }
    
    // Kiểm tra loại file
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['docx', 'doc', 'txt', 'pdf'];
    
    if (!fileExt || !allowedExts.includes(fileExt)) {
      toast({
        title: "Định dạng không hỗ trợ",
        description: "Chỉ hỗ trợ file docx, doc, txt, pdf",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Tạo form data
      const formData = new FormData();
      formData.append('document', file);
      
      if (chapterId) {
        formData.append('chapterId', chapterId.toString());
      }
      
      // Upload file
      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Đặt nội dung đã xử lý vào editor
      setContent(data.content);
      
      toast({
        title: "Tải file thành công",
        description: "Nội dung file đã được chuyển đổi và đưa vào trình soạn thảo",
        variant: "default",
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      setUploadInfo('');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Lỗi tải file",
        description: "Không thể xử lý file. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý thả file
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (readOnly) return;
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const fileType = file.type;
      
      // Kiểm tra nếu là ảnh hoặc video
      if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
        // Tải lên và chèn vào editor
        handleMediaUpload(file);
      } else {
        // Nếu là file văn bản, xử lý như upload file thông thường
        setFile(file);
        setUploadInfo(`File được chọn: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      }
    }
  }, [readOnly]);

  // Xử lý upload ảnh/video
  const handleMediaUpload = async (file: File) => {
    if (!quillRef.current) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('media', file);
      
      if (chapterId) {
        formData.append('chapterId', chapterId.toString());
      }
      
      const response = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      
      // Chèn ảnh hoặc video vào vị trí con trỏ
      if (file.type.startsWith('image/')) {
        quill.insertEmbed(range.index, 'image', data.url);
      } else if (file.type.startsWith('video/')) {
        quill.insertEmbed(range.index, 'video', data.url);
      }
      
      // Di chuyển con trỏ đến vị trí sau ảnh/video
      quill.setSelection(range.index + 1, 0);
      
      toast({
        title: "Tải lên thành công",
        description: `${file.type.startsWith('image/') ? 'Ảnh' : 'Video'} đã được chèn vào nội dung`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: "Lỗi tải lên",
        description: "Không thể tải lên tệp phương tiện. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm sự kiện ngăn chặn hành vi mặc định của trình duyệt khi thả file
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };
    
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('drop', preventDefault);
    
    return () => {
      document.removeEventListener('dragover', preventDefault);
      document.removeEventListener('drop', preventDefault);
    };
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {!readOnly && (
          <div className="mb-4 space-y-4">
            {/* File upload controls */}
            <div className="flex items-center gap-2">
              <Label htmlFor="file-upload">Tải lên tài liệu (DOCX, DOC, TXT, PDF):</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="max-w-md"
                ref={fileInputRef}
                accept=".docx,.doc,.txt,.pdf"
              />
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || isLoading}
                variant="outline"
              >
                {isLoading ? <Spinner className="mr-2" /> : null}
                Tải lên
              </Button>
            </div>
            
            {/* Font controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="font-family">Font chữ:</Label>
                <Select 
                  value={currentFont} 
                  onValueChange={handleFontChange}
                >
                  <SelectTrigger className="w-40" id="font-family">
                    <SelectValue placeholder="Font chữ" />
                  </SelectTrigger>
                  <SelectContent>
                    {fonts.map(font => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="font-size">Kích thước:</Label>
                <Select 
                  value={currentSize} 
                  onValueChange={handleSizeChange}
                >
                  <SelectTrigger className="w-32" id="font-size">
                    <SelectValue placeholder="Kích thước" />
                  </SelectTrigger>
                  <SelectContent>
                    {['small', 'medium', 'large', 'x-large', 'xx-large'].map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {uploadInfo && (
              <Alert className="bg-blue-50">
                <AlertDescription>
                  {uploadInfo}
                </AlertDescription>
              </Alert>
            )}
            
            {lastSaved && (
              <div className="text-sm text-gray-500">
                Lần lưu cuối: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            
            {isAutoSaving && (
              <div className="text-sm text-blue-500 flex items-center">
                <Spinner className="w-4 h-4 mr-2" />
                Đang tự động lưu...
              </div>
            )}
          </div>
        )}
        
        <div
          onDrop={handleDrop}
          className={`border rounded-md ${readOnly ? 'bg-gray-50' : ''}`}
          style={{ fontFamily: currentFont, fontSize: currentSize }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={quillModules}
            formats={formats}
            readOnly={readOnly}
            placeholder="Nhập nội dung ở đây hoặc kéo thả file ảnh/video..."
          />
        </div>
        
        {!readOnly && (
          <div className="mt-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              Font: {currentFont}, Size: {currentSize}
            </div>
            <Button onClick={handleSave}>
              Lưu nội dung
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedRichTextEditor;