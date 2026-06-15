import { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  value?: string;
  onChange?: (signatureData: string) => void;
  readOnly?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export function SignaturePad({
  value,
  onChange,
  readOnly = false,
  width = 400,
  height = 200,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPosRef.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPosRef.current) return;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;

    if (!readOnly && onChange && hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        onChange(canvas.toDataURL());
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);

    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed overflow-hidden bg-slate-50',
          readOnly ? 'border-slate-200' : 'border-slate-300',
          !readOnly && 'hover:border-blue-400 transition-colors'
        )}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSignature && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <PenTool size={32} className="text-slate-300 mb-2" />
            <span className="text-sm text-slate-400">在此处签名</span>
          </div>
        )}

        {readOnly && !hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-slate-400">暂无签名</span>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {hasSignature ? '已签名' : '请使用鼠标或触屏签名'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas} leftIcon={<Eraser size={14} />}>
              清除
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
