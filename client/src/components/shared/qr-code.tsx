import { useEffect, useRef } from 'react';
import QRCodeLibrary from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
}

export function QRCode({
  value,
  size = 200,
  level = 'M',
  includeMargin = true
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const options = {
      errorCorrectionLevel: level,
      margin: includeMargin ? 4 : 0,
      width: size,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    QRCodeLibrary.toCanvas(canvasRef.current, value, options, (error) => {
      if (error) {
        console.error('Error generating QR code:', error);
      }
    });
  }, [value, size, level, includeMargin]);
  
  return (
    <div className="flex justify-center">
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="border border-border rounded-md" 
      />
    </div>
  );
}

export default QRCode;
