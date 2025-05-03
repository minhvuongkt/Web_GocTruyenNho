import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Quill from 'quill';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

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

// Đăng ký Font Format
const Font = Quill.import('formats/font');
Font.whitelist = fonts;
Quill.register(Font, true);

// Tạo danh sách kích cỡ phông chữ từ 10px đến 48px
const fontSizes: string[] = [];
for (let i = 10; i <= 48; i += 2) {
  fontSizes.push(i + 'px');
}

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
  .ql-font-serif { font-family: Serif !important; }
  
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
    font-size: ${size};
  }`).join('\n')}
  
  /* Áp dụng kích thước thực tế cho nội dung */
  ${fontSizes.map(size => `
  .ql-size-${size.replace('px', '')} {
    font-size: ${size} !important;
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
  
  /* Tùy chỉnh resize hình ảnh */
  .ql-editor .image-resizer {
    position: relative;
    display: inline-block;
  }
  
  .ql-editor .image-resizer .resize-handle {
    position: absolute;
    height: 12px;
    width: 12px;
    background: #1e88e5;
    border-radius: 50%;
    border: 1px solid white;
  }
  
  .ql-editor .image-resizer .resize-handle.br {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
  }
  
  /* Cải thiện hiển thị file drop zone */
  .file-drop-active {
    border: 2px dashed #4f46e5;
    background-color: rgba(79, 70, 229, 0.1);
    border-radius: 4px;
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

// Loại file được hỗ trợ để tải lên
type SupportedFileType = 'txt' | 'doc' | 'docx' | 'pdf' | 'image';

// Props cho Enhanced Rich Text Editor
export interface EnhancedRichTextEditorProps {
  id: string;
  initialValue: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showSubmitButton?: boolean;
  autosaveInterval?: number;
  onFileUpload?: (file: File) => Promise<string>;
}

export default function EnhancedRichTextEditor({
  id,
  initialValue,
  onChange,
  placeholder = "Viết nội dung ở đây...",
  showSubmitButton = false,
  autosaveInterval = 0,
  onFileUpload,
}: EnhancedRichTextEditorProps) {
  const [value, setValue] = useState<string>(initialValue || "");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessingDocument, setIsProcessingDocument] = useState<boolean>(false);
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thêm CSS tùy chỉnh
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = editorStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    }
  }, []);

  // Thiết lập tự động lưu
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autosaveInterval > 0) {
      intervalId = setInterval(() => {
        onChange(value);
        toast({
          title: "Đã tự động lưu",
          description: "Nội dung đã được lưu tự động",
        });
      }, autosaveInterval * 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [value, onChange, autosaveInterval, toast]);

  // Xác định loại file
  const getFileType = (file: File): SupportedFileType | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (file.type.startsWith('image/')) return 'image';
    if (extension === 'txt') return 'txt';
    if (extension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (extension === 'doc' || file.type === 'application/msword') return 'doc';
    if (extension === 'pdf' || file.type === 'application/pdf') return 'pdf';
    
    return null;
  };

  // Xử lý tải lên hình ảnh
  const uploadImage = async (file: File): Promise<string> => {
    if (onFileUpload) {
      setIsUploading(true);
      setUploadProgress(10);
      
      try {
        // Giả lập tiến trình tải lên
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const next = prev + 10;
            return next < 90 ? next : prev;
          });
        }, 300);

        const imageUrl = await onFileUpload(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Reset sau khi hoàn thành
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
        
        return imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Lỗi tải lên",
          description: "Không thể tải lên hình ảnh. Vui lòng thử lại.",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress(0);
        throw error;
      }
    }
    
    // Nếu không có hàm tải lên, sử dụng Data URL
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  // Xử lý tải lên tài liệu (docx, txt, pdf)
  const processDocument = async (file: File) => {
    setIsProcessingDocument(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/chapters/text/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Lỗi xử lý tài liệu');
      }
      
      const data = await response.json();
      
      if (data.content) {
        // Chèn nội dung vào editor tại vị trí con trỏ
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection() || { index: editor.getLength(), length: 0 };
          editor.insertText(range.index, '\n', 'user');
          editor.deleteText(range.index, 1);
          editor.clipboard.dangerouslyPasteHTML(range.index, data.content, 'user');
          editor.setSelection(range.index + 1, 0);
        }
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Lỗi xử lý tài liệu",
        description: "Không thể xử lý tài liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingDocument(false);
    }
  };

  // Xử lý tải lên file
  const handleFileUpload = async (file: File) => {
    const fileType = getFileType(file);
    
    if (!fileType) {
      toast({
        title: "Không hỗ trợ loại file",
        description: "Chỉ hỗ trợ các file docx, doc, txt, pdf và hình ảnh.",
        variant: "destructive",
      });
      return;
    }
    
    if (fileType === 'image') {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      
      try {
        const imageUrl = await uploadImage(file);
        const range = editor.getSelection() || { index: editor.getLength(), length: 0 };
        editor.insertEmbed(range.index, 'image', imageUrl, 'user');
        editor.setSelection(range.index + 1, 0);
      } catch (error) {
        console.error('Error embedding image:', error);
      }
    } else {
      await processDocument(file);
    }
  };

  // Handler tải lên hình ảnh cho toolbar
  const imageHandler = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Xử lý thay đổi từ editor
  const handleChange = (content: string) => {
    if (content !== value) {
      setValue(content);
    }
  };

  // Xử lý lưu nội dung
  const handleSave = () => {
    onChange(value);
    toast({
      title: "Đã lưu",
      description: "Nội dung đã được lưu thành công",
    });
  };

  // Thiết lập modules cho Quill
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: fonts }],
        [{ size: fontSizes }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false,
    },
    imageResize: {},
  }), []);

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

  // Thiết lập drag and drop cho hình ảnh
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const editorContainer = document.querySelector(`#${id} .ql-editor`);
    if (!editorContainer) return;

    const handleDrop = async (e: Event) => {
      const dragEvent = e as DragEvent;
      dragEvent.preventDefault();
      dragEvent.stopPropagation();

      if (dragEvent.dataTransfer?.files && dragEvent.dataTransfer.files.length > 0) {
        const files = Array.from(dragEvent.dataTransfer.files);
        
        // Xử lý từng file
        for (const file of files) {
          await handleFileUpload(file);
        }
      }
      
      // Xóa lớp active
      editorContainer.classList.remove('file-drop-active');
    };

    const handleDragOver = (e: Event) => {
      const dragEvent = e as DragEvent;
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
      editorContainer.classList.add('file-drop-active');
    };
    
    const handleDragLeave = (e: Event) => {
      const dragEvent = e as DragEvent;
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
      editorContainer.classList.remove('file-drop-active');
    };

    const handlePaste = async (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      if (clipboardEvent.clipboardData?.items) {
        const items = Array.from(clipboardEvent.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
          clipboardEvent.preventDefault();
          
          for (const item of imageItems) {
            const file = item.getAsFile();
            if (file) {
              await handleFileUpload(file);
            }
          }
        }
      }
    };

    editorContainer.addEventListener('drop', handleDrop);
    editorContainer.addEventListener('dragover', handleDragOver);
    editorContainer.addEventListener('dragleave', handleDragLeave);
    editorContainer.addEventListener('paste', handlePaste);

    return () => {
      editorContainer.removeEventListener('drop', handleDrop);
      editorContainer.removeEventListener('dragover', handleDragOver);
      editorContainer.removeEventListener('dragleave', handleDragLeave);
      editorContainer.removeEventListener('paste', handlePaste);
    };
  }, [id, quillRef]);

  return (
    <div className="relative w-full">
      <Card id={id} className="relative w-full">
        <div className="min-h-[300px]">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".txt,.doc,.docx,.pdf,image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
                e.target.value = ''; // Reset input
              }
            }}
          />
        </div>
        
        {/* Hiển thị trạng thái tải lên */}
        {isUploading && (
          <div className="p-2 bg-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tải lên hình ảnh...</span>
            </div>
            <Progress value={uploadProgress} className="h-1 mt-1" />
          </div>
        )}
        
        {/* Hiển thị trạng thái xử lý tài liệu */}
        {isProcessingDocument && (
          <div className="p-2 bg-muted">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý tài liệu...</span>
            </div>
          </div>
        )}
        
        {showSubmitButton && (
          <div className="p-2 bg-muted flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              className="mt-2"
            >
              Lưu nội dung
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}