"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

const PLACEHOLDER = "/images/placeholder.png";
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // file goc toi da 10MB
const MAX_SIDE = 800; // canh dai nhat sau khi nen
const QUALITY = 0.82;

interface ProductImageInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Doc file anh -> ve lai len canvas (toi da 800px) -> xuat WEBP dang data URL
// Anh luu thang trong CSDL dung chung nen moi may trong nhom deu thay
async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Không đọc được file ảnh"));
      el.src = objectUrl;
    });

    const w = img.naturalWidth || MAX_SIDE;
    const h = img.naturalHeight || MAX_SIDE;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh");
    // Nen trang de anh PNG trong suot khong bi den khi chuyen dinh dang
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const webp = canvas.toDataURL("image/webp", QUALITY);
    // Safari cu khong xuat duoc WEBP -> tu tra ve PNG, luc do dung JPEG cho nhe
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatSize(dataUrl: string) {
  const bytes = Math.round((dataUrl.length * 3) / 4);
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function ProductImageInput({ value, onChange }: ProductImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const hasImage = !!value && value !== PLACEHOLDER;
  const isUploaded = value.startsWith("data:");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error("Ảnh gốc tối đa 10MB");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      setPreviewError(false);
      onChange(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xử lý được ảnh");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block font-bold text-slate-700">Hình ảnh sản phẩm</label>
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#f66315]"
        >
          <Link2 className="h-3 w-3" />
          {showUrl ? "Ẩn đường dẫn" : "Dùng đường dẫn"}
        </button>
      </div>

      <div className="flex gap-3">
        {/* Xem truoc */}
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {hasImage && !previewError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Ảnh sản phẩm"
              onError={() => setPreviewError(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            <ImagePlus className="h-8 w-8 text-slate-300" />
          )}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Loader2 className="h-6 w-6 animate-spin text-[#f66315]" />
            </div>
          )}
        </div>

        {/* Vung tai len */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            disabled={processing}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-3 text-center transition-colors disabled:opacity-60 ${
              dragOver
                ? "border-[#f66315] bg-orange-50"
                : "border-slate-200 hover:border-[#f66315] hover:bg-orange-50/50"
            }`}
          >
            <UploadCloud className="h-5 w-5 text-[#f66315]" />
            <span className="font-semibold text-slate-700">
              {hasImage ? "Đổi ảnh khác" : "Tải ảnh lên"}
            </span>
            <span className="text-[11px] text-slate-400">Kéo thả hoặc bấm để chọn · JPG, PNG, WEBP</span>
          </button>

          {hasImage && (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">
                {isUploaded ? `Ảnh đã tải lên · ${formatSize(value)}` : value}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPreviewError(false);
                  onChange(PLACEHOLDER);
                }}
                className="ml-2 flex shrink-0 items-center gap-1 font-semibold text-slate-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                Gỡ ảnh
              </button>
            </div>
          )}
        </div>
      </div>

      {showUrl && (
        <input
          type="text"
          placeholder="/images/ten-anh.jpg hoặc https://..."
          value={isUploaded ? "" : value}
          onChange={(e) => {
            setPreviewError(false);
            onChange(e.target.value);
          }}
          className="mt-2 w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-[#f66315]"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
