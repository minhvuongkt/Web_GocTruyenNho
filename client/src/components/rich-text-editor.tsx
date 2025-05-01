import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";

// Quill API to define custom fonts and sizes
// We need to register them before using them
const Font = Quill.import("formats/font");
const Size = Quill.import("formats/size");

// Define the fonts list
const fonts = [
  "arial",
  "times-new-roman",
  "tahoma",
  "verdana",
  "open-sans",
  "roboto",
  "merriweather",
  "source-sans-pro",
  "noticia-text",
  "segoe-ui",
  "noto-sans",
  "serif",
];

// Define sizes from 10px to 48px in 2px increments
const sizes = Array.from(
  { length: (48 - 10) / 2 + 1 },
  (_, i) => `${10 + i * 2}px`
);

// Register fonts
Font.whitelist = fonts;
Quill.register(Font, true);

// Register sizes
Size.whitelist = sizes;
Quill.register(Size, true);

// Add CSS for the fonts
const fontStyles = `
  ${fonts.map(font => `
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${font}"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${font}"]::before {
      content: "${font.replace(/-/g, ' ')}";
      font-family: "${font.replace(/-/g, ' ')}";
    }
    .ql-font-${font} {
      font-family: "${font.replace(/-/g, ' ')}";
    }
  `).join('')}
  
  ${sizes.map(size => `
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"]::before,
    .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"]::before {
      content: "${size}";
      font-size: ${size};
    }
    .ql-size-${size.replace('px', '')} {
      font-size: ${size};
    }
  `).join('')}

  /* Custom styles for image resizing and drag-drop */
  .ql-editor img {
    cursor: pointer;
    display: block;
    max-width: 100%;
  }
  
  .ql-editor .image-resizer {
    position: relative;
    display: inline-block;
  }
  
  .ql-editor .image-resizer .resize-handle {
    position: absolute;
    height: 10px;
    width: 10px;
    background: #1e88e5;
    border-radius: 50%;
  }
  
  .ql-editor .image-resizer .resize-handle.br {
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
  }
`;

// Create a custom image resize module
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
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;

  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.currentImg = null;
    this.overlay = null;
    this.handle = null;
    
    // Initialize properties for resize and drag
    this.initialWidth = 0;
    this.initialHeight = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.isResizing = false;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    
    // Setup listeners
    this.quill.root.addEventListener('click', this.handleClick.bind(this));
    this.quill.root.addEventListener('mousedown', this.handleMousedown.bind(this));
    window.addEventListener('mouseup', this.handleMouseup.bind(this));
    window.addEventListener('mousemove', this.handleMousemove.bind(this));
  }

  handleClick(e: MouseEvent) {
    if (e.target && (e.target as HTMLElement).tagName === 'IMG') {
      if (this.currentImg) {
        // Deselect if clicking on a different image
        this.hide();
      }
      this.show(e.target as HTMLElement);
    } else if (this.currentImg && e.target !== this.handle) {
      // If clicking outside image or resize handles
      this.hide();
    }
  }

  handleMousedown(e: MouseEvent) {
    if (e.target === this.handle) {
      e.preventDefault();
      this.quill.root.setAttribute('contenteditable', 'false');
      this.initialWidth = this.currentImg.width;
      this.initialHeight = this.currentImg.height;
      this.initialX = e.clientX;
      this.initialY = e.clientY;
      this.isResizing = true;
    } else if (e.target === this.currentImg) {
      e.preventDefault();
      this.quill.root.setAttribute('contenteditable', 'false');
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    }
  }

  handleMouseup() {
    if (this.isResizing || this.isDragging) {
      this.isResizing = false;
      this.isDragging = false;
      this.quill.root.setAttribute('contenteditable', 'true');
      if (this.overlay && this.handle && this.currentImg) {
        this.positionElements();
      }
    }
  }

  handleMousemove(e: MouseEvent) {
    if (this.isResizing && this.currentImg) {
      const deltaX = e.clientX - this.initialX;
      const deltaY = e.clientY - this.initialY;
      
      // Calculate new dimensions
      // Keep aspect ratio by using only width changes
      const aspectRatio = this.initialHeight / this.initialWidth;
      let newWidth = this.initialWidth + deltaX;
      let newHeight = newWidth * aspectRatio;
      
      // Apply min/max constraints
      newWidth = Math.max(50, Math.min(newWidth, this.quill.root.offsetWidth));
      newHeight = newWidth * aspectRatio;
      
      // Apply new size
      this.currentImg.width = newWidth;
      this.currentImg.height = newHeight;
      
      // Update resize handles
      this.positionElements();
    } else if (this.isDragging && this.currentImg) {
      // Handle dragging (simple position adjustment)
      // For full drag support, you would need to calculate offset in the editor
      // and update the image position accordingly
      
      // In this simple implementation, we're just showing how to detect drag
      // Full drag-n-drop would require additional DOM manipulation
      console.log('Dragging image', e.clientX - this.dragStartX, e.clientY - this.dragStartY);
    }
  }

  show(img: HTMLElement) {
    this.currentImg = img;
    
    // Create overlay if needed
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
    
    // Position the overlay to match the image
    this.overlay.style.left = (imgRect.left - containerRect.left) + 'px';
    this.overlay.style.top = (imgRect.top - containerRect.top) + 'px';
    this.overlay.style.width = imgRect.width + 'px';
    this.overlay.style.height = imgRect.height + 'px';
  }
}

// Add the ImageResize module to Quill
Quill.register('modules/imageResize', ImageResize);

// Add image upload handler
function imageHandler(this: any) {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = () => {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const quill = this.quill;
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', reader.result);
        quill.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    }
  };
}

export interface RichTextEditorProps {
  id: string;
  initialValue: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showSubmitButton?: boolean;
  autosaveInterval?: number;
}

export default function RichTextEditor({
  id,
  initialValue,
  onChange,
  placeholder = "Viết nội dung ở đây...",
  showSubmitButton = false,
  autosaveInterval = 0,
}: RichTextEditorProps) {
  const [value, setValue] = useState<string>(initialValue || "");
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();

  // Add style element to the document for custom font and size styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = fontStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    }
  }, []);

  // Set up autosave if interval is provided
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
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

  // Handle value change
  const handleChange = (content: string) => {
    setValue(content);
  };

  // Handle saving content
  const handleSave = () => {
    onChange(value);
    toast({
      title: "Đã lưu",
      description: "Nội dung đã được lưu thành công",
    });
  };

  // Configure Quill modules
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: fonts }],
        [{ size: sizes }],
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
    imageResize: {
      modules: ['Resize', 'DisplaySize']
    }
  }), []);

  // Configure formats
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
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
  ];

  // Enable drag and drop for images
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const editorContainer = document.querySelector(`#${id} .ql-editor`);
    if (!editorContainer) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
          // Get the cursor position for the drop
          const selection = editor.getSelection();
          let index = 0;
          if (selection) {
            index = selection.index;
          }

          // Insert images one by one
          imageFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              editor.insertEmbed(index, 'image', reader.result);
              index += 1;
              editor.setSelection(index, 0);
            };
            reader.readAsDataURL(file);
          });
        }
      }
    };

    // Prevent default behavior for drag over to enable drop
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    editorContainer.addEventListener('drop', handleDrop as EventListener);
    editorContainer.addEventListener('dragover', handleDragOver as EventListener);

    return () => {
      editorContainer.removeEventListener('drop', handleDrop as EventListener);
      editorContainer.removeEventListener('dragover', handleDragOver as EventListener);
    };
  }, [id]);

  // Enable paste images from clipboard
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check if there are images in the clipboard
      const items = Array.from(clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault();
        
        // Get the cursor position
        const selection = editor.getSelection();
        let index = 0;
        if (selection) {
          index = selection.index;
        }

        // Insert images one by one
        imageItems.forEach((item) => {
          const blob = item.getAsFile();
          if (!blob) return;

          const reader = new FileReader();
          reader.onload = () => {
            editor.insertEmbed(index, 'image', reader.result);
            index += 1;
            editor.setSelection(index, 0);
          };
          reader.readAsDataURL(blob);
        });
      }
    };

    // Add paste event listener to the editor
    const editorContainer = document.querySelector(`#${id} .ql-editor`);
    if (editorContainer) {
      editorContainer.addEventListener('paste', handlePaste as EventListener);
    }

    return () => {
      if (editorContainer) {
        editorContainer.removeEventListener('paste', handlePaste as EventListener);
      }
    };
  }, [id]);

  return (
    <Card
      className="overflow-hidden border border-input"
      id={id}
    >
      <div className="bg-muted p-2">
        <Label className="text-sm">
          Soạn thảo nội dung
        </Label>
      </div>
      <Separator />
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        className="h-[400px] overflow-auto"
      />
      {showSubmitButton && (
        <div className="p-2 bg-muted flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
          >
            Lưu nội dung
          </Button>
        </div>
      )}
    </Card>
  );
}