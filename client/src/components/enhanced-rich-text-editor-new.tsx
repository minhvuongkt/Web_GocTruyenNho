import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Quill from 'quill';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Danh sách font chữ hỗ trợ
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

// Tạo danh sách kích cỡ phông chữ từ 10px đến 28px
const fontSizes: string[] = [];
for (let i = 10; i <= 28; i += 2) {
  fontSizes.push(i + 'px');
}

// Đăng ký Font Format
const Font = Quill.import('formats/font');
Font.whitelist = fonts;
Quill.register(Font, true);

// Đăng ký Size Format
const Size = Quill.import('formats/size');
Size.whitelist = fontSizes;
Quill.register(Size, true);

// CSS tùy chỉnh cho rich text editor
const editorStyles = `
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&family=Merriweather&family=Source+Sans+Pro&family=Noticia+Text&family=Noto+Sans&display=swap');

  /* Font families */
  .ql-font-arial { font-family: Arial !important; }
  .ql-font-times-new-roman { font-family: "Times New Roman" !important; }
  .ql-font-tahoma { font-family: Tahoma !important; }
  .ql-font-verdana { font-family: Verdana !important; }
  .ql-font-open-sans { font-family: "Open Sans" !important; }
  .ql-font-roboto { font-family: Roboto !important; }
  .ql-font-merriweather { font-family: Merriweather !important; }
  .ql-font-source-sans-pro { font-family: "Source Sans Pro" !important; }
  .ql-font-noticia-text { font-family: "Noticia Text" !important; }
  .ql-font-segoe-ui { font-family: "Segoe UI" !important; }
  .ql-font-noto-sans { font-family: "Noto Sans" !important; }
  .ql-font-serif { font-family: serif !important; }
  
  /* Font label display in dropdown */
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before { content: "Arial"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before { content: "Times New Roman"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="tahoma"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="tahoma"]::before { content: "Tahoma"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="verdana"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before { content: "Verdana"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="open-sans"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="open-sans"]::before { content: "Open Sans"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="roboto"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="roboto"]::before { content: "Roboto"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="merriweather"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="merriweather"]::before { content: "Merriweather"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="source-sans-pro"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="source-sans-pro"]::before { content: "Source Sans Pro"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="noticia-text"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="noticia-text"]::before { content: "Noticia Text"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="segoe-ui"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="segoe-ui"]::before { content: "Segoe UI"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="noto-sans"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="noto-sans"]::before { content: "Noto Sans"; }
  
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before { content: "Serif"; }
  
  /* Kích thước phông chữ */
  ${fontSizes.map(size => `
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"]::before {
    content: "${size}";
    font-size: 14px;
  }`).join('\n')}
  
  /* Tối ưu dropdown */
  .ql-snow .ql-picker.ql-font {
    width: 130px;
  }

  .ql-snow .ql-picker.ql-size {
    width: 80px;
  }

  .ql-snow .ql-picker-options {
    max-height: 300px;
    overflow-y: auto;
  }

  /* Tùy chỉnh hiển thị hình ảnh */
  .ql-editor img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
    cursor: pointer;
  }
`;

// Tạo module resize hình ảnh tùy chỉnh
class ImageResize {
  quill: any;
  options: any;
  currentImg: any;
  overlay: any;
  handle: any;
  initialWidth: number;
  initialHeight: number;
  initialX: number;
  initialY: number;
  isResizing: boolean;

  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.currentImg = null;
    this.overlay = null;
    this.handle = null;
    
    this.initialWidth = 0;
    this.initialHeight = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.isResizing = false;
    
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    this.quill.root.addEventListener('mousedown', this.handleMousedown.bind(this));
    window.addEventListener('mouseup', this.handleMouseup.bind(this));
    window.addEventListener('mousemove', this.handleMousemove.bind(this));
  }

  handleClick(e: MouseEvent) {
    if (e.target && (e.target as HTMLElement).tagName === 'IMG') {
      if (this.currentImg) {
        this.hide();
      }
      this.show(e.target as HTMLElement);
    } else if (this.currentImg && e.target !== this.handle) {
      this.hide();
    }
  }

  handleMousedown(e: MouseEvent) {
    if (e.target === this.handle) {
      e.preventDefault();
      this.quill.root.setAttribute('contenteditable', 'false');
      this.initialWidth = this.currentImg.width || this.currentImg.naturalWidth;
      this.initialHeight = this.currentImg.height || this.currentImg.naturalHeight;
      this.initialX = e.clientX;
      this.initialY = e.clientY;
      this.isResizing = true;
    }
  }

  handleMouseup() {
    if (this.isResizing) {
      this.isResizing = false;
      this.quill.root.setAttribute('contenteditable', 'true');
      if (this.overlay && this.handle && this.currentImg) {
        this.positionElements();
      }
    }
  }

  handleMousemove(e: MouseEvent) {
    if (this.isResizing && this.currentImg) {
      const deltaX = e.clientX - this.initialX;
      
      // Giữ tỷ lệ khung hình
      const aspectRatio = this.initialHeight / this.initialWidth;
      let newWidth = this.initialWidth + deltaX;
      let newHeight = newWidth * aspectRatio;
      
      // Giới hạn kích thước
      newWidth = Math.max(50, Math.min(newWidth, this.quill.root.offsetWidth));
      newHeight = newWidth * aspectRatio;
      
      // Cập nhật kích thước
      this.currentImg.width = newWidth;
      this.currentImg.height = newHeight;
      
      // Cập nhật vị trí handles
      this.positionElements();
    }
  }

  show(img: HTMLElement) {
    this.currentImg = img;
    
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.classList.add('image-resizer');
      this.handle = document.createElement('div');
      this.handle.classList.add('resize-handle', 'br');
      this.overlay.appendChild(this.handle);
      this.quill.root.appendChild(this.overlay);
    }
    
    this.positionElements();
    this.overlay.style.display = 'block';
  }

  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    this.currentImg = null;
  }

  positionElements() {
    if (!this.currentImg || !this.overlay) return;
    
    const imgRect = this.currentImg.getBoundingClientRect();
    const containerRect = this.quill.root.getBoundingClientRect();
    
    this.overlay.style.left = (imgRect.left - containerRect.left) + 'px';
    this.overlay.style.top = (imgRect.top - containerRect.top) + 'px';
    this.overlay.style.width = imgRect.width + 'px';
    this.overlay.style.height = imgRect.height + 'px';
  }
}

// Đăng ký module resize hình ảnh
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

// Props cho component editor
interface EnhancedRichTextEditorProps {
  initialValue?: string;
  onSave?: (content: string) => void;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  chapterId?: number;
  contentId?: number;
  autoSave?: boolean;
  fontFamily?: string;
  fontSize?: string;
  placeholder?: string;
  showSubmitButton?: boolean;
  autosaveInterval?: number;
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
  fontSize = '14px',
  placeholder = "Nhập nội dung ở đây...",
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

  // Thêm CSS tùy chỉnh
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = editorStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    }
  }, []);
  
  // Cập nhật font và size khi props thay đổi
  useEffect(() => {
    setCurrentFont(fontFamily);
    setCurrentSize(fontSize);
    
    // Cập nhật font và size trong trình soạn thảo
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      
      // Áp dụng font và size cho toàn bộ nội dung
      editor.formatText(0, editor.getLength(), {
        'font': fontFamily,
        'size': fontSize
      });
    }
  }, [fontFamily, fontSize]);

  // Xử lý thay đổi nội dung
  const handleChange = (value: string) => {
    setContent(value);
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
      
      // Áp dụng class font cho nội dung được chọn
      const range = editor.getSelection();
      if (range && range.length > 0) {
        editor.format('font', fontName);
      } else {
        // Nếu không có vùng chọn, áp dụng font cho toàn văn bản
        editor.formatText(0, editor.getLength(), 'font', fontName);
      }
      
      // Thông báo thay đổi nội dung
      const updatedContent = editor.root.innerHTML;
      setContent(updatedContent);
      if (onChange) {
        onChange(updatedContent);
      }
    }
  };
  
  // Xử lý thay đổi size
  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      
      // Áp dụng class size cho nội dung được chọn
      const range = editor.getSelection();
      if (range && range.length > 0) {
        editor.format('size', size);
      } else {
        // Nếu không có vùng chọn, áp dụng size cho toàn văn bản
        editor.formatText(0, editor.getLength(), 'size', size);
      }
      
      // Thông báo thay đổi nội dung
      const updatedContent = editor.root.innerHTML;
      setContent(updatedContent);
      if (onChange) {
        onChange(updatedContent);
      }
    }
  };
  
  // Trả về tên hiển thị cho font
  const getFontDisplayName = (fontName: string): string => {
    switch (fontName) {
      case 'arial': return 'Arial';
      case 'times-new-roman': return 'Times New Roman';
      case 'tahoma': return 'Tahoma';
      case 'verdana': return 'Verdana';
      case 'open-sans': return 'Open Sans';
      case 'roboto': return 'Roboto';
      case 'merriweather': return 'Merriweather';
      case 'source-sans-pro': return 'Source Sans Pro';
      case 'noticia-text': return 'Noticia Text';
      case 'segoe-ui': return 'Segoe UI';
      case 'noto-sans': return 'Noto Sans';
      case 'serif': return 'Serif';
      default: return fontName.charAt(0).toUpperCase() + fontName.slice(1);
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
    
    // Thêm các event listener
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    
    return () => {
      // Xóa các event listener khi component unmount
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);
  
  // Render component
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {!readOnly && (
          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1">
                <Label htmlFor="file-upload" className="block mb-2">Tải lên file:</Label>
                <div className="flex gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".doc,.docx,.txt,.pdf"
                    disabled={isLoading || readOnly}
                  />
                  <Button 
                    onClick={handleFileUpload}
                    disabled={!file || isLoading}
                    className="whitespace-nowrap"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Đang tải...
                      </>
                    ) : 'Tải lên'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
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
                      <SelectItem key={font} value={font}>{getFontDisplayName(font)}</SelectItem>
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
                    {fontSizes.map(size => (
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
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={quillModules}
            formats={formats}
            readOnly={readOnly}
            placeholder={placeholder}
          />
        </div>
        
        {!readOnly && (
          <div className="mt-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              Font: {getFontDisplayName(currentFont)}, Size: {currentSize}
            </div>
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
              Lưu nội dung
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedRichTextEditor;