import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";

// Define the fonts list
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
  'serif'
];

// Define readable font display names
interface FontNameMap {
  [key: string]: string;
}

const fontNameMap: FontNameMap = {
  'arial': 'Arial',
  'times-new-roman': 'Times New Roman',
  'tahoma': 'Tahoma',
  'verdana': 'Verdana',
  'open-sans': 'Open Sans',
  'roboto': 'Roboto',
  'merriweather': 'Merriweather',
  'source-sans-pro': 'Source Sans Pro',
  'noticia-text': 'Noticia Text',
  'segoe-ui': 'Segoe UI',
  'noto-sans': 'Noto Sans',
  'serif': 'Serif',
};

// Register Font Format
const Font = Quill.import('formats/font');
Font.whitelist = fonts;
Quill.register(Font, true);

// Register Size Format
const Size = Quill.import('formats/size');
Size.whitelist = ['small', 'normal', 'large', 'huge'];
Quill.register(Size, true);

// Add CSS for the fonts and other styling
const editorStyles = `
  /* Import Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&family=Merriweather&family=Source+Sans+Pro&family=Noticia+Text&family=Noto+Sans&display=swap');

  /* Styles for font dropdown items */
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
  
  /* Font label display */
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
  
  /* Size styles */
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before { content: "Small"; }
  
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="normal"]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="normal"]::before { content: "Normal"; }
  
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before { content: "Large"; }
  
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before { content: "Huge"; }
  
  .ql-size-small { font-size: 0.75em !important; }
  .ql-size-normal { font-size: 1em !important; }
  .ql-size-large { font-size: 1.5em !important; }
  .ql-size-huge { font-size: 2em !important; }

  /* Fix font dropdown width */
  .ql-snow .ql-picker.ql-font {
    width: 120px;
  }

  /* Fix size dropdown width */
  .ql-snow .ql-picker.ql-size {
    width: 100px;
  }

  /* Make dropdown text more readable */
  .ql-snow .ql-picker-options {
    max-height: 300px;
    overflow-y: auto;
  }

  /* Custom styles for image resizing */
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

  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.currentImg = null;
    this.overlay = null;
    this.handle = null;
    
    // Initialize properties for resize
    this.initialWidth = 0;
    this.initialHeight = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.isResizing = false;
    
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
      
      // Calculate new dimensions (keep aspect ratio)
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

// Register the image resize module
Quill.register('modules/imageResize', ImageResize);

// Image upload handler for the toolbar
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
    styleElement.innerHTML = editorStyles;
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
        [{ size: ['small', 'normal', 'large', 'huge'] }],
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
    imageResize: {}
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
          // Get cursor position for the drop
          const selection = editor.getSelection();
          let index = 0;
          if (selection) {
            index = selection.index;
          }

          // Insert images one by one
          imageFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              editor.insertEmbed(index, 'image', reader.result, 'user');
              index += 1;
            };
            reader.readAsDataURL(file);
          });
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.items) {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
          e.preventDefault();
          
          // Get cursor position
          const selection = editor.getSelection();
          let index = 0;
          if (selection) {
            index = selection.index;
          }

          // Insert images from clipboard
          imageItems.forEach(item => {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                editor.insertEmbed(index, 'image', reader.result, 'user');
                index += 1;
              };
              reader.readAsDataURL(file);
            }
          });
        }
      }
    };

    editorContainer.addEventListener('drop', handleDrop as EventListener);
    editorContainer.addEventListener('dragover', handleDragOver as EventListener);
    editorContainer.addEventListener('paste', handlePaste as EventListener);

    return () => {
      editorContainer.removeEventListener('drop', handleDrop as EventListener);
      editorContainer.removeEventListener('dragover', handleDragOver as EventListener);
      editorContainer.removeEventListener('paste', handlePaste as EventListener);
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
        </div>
        
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