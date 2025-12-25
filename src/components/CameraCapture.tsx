"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose?: () => void;
  language: "hi" | "bn" | "en";
}

export default function CameraCapture({
  onCapture,
  onClose,
  language,
}: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Camera access denied. Please allow camera access to use this feature."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setPreview(imageData);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmCapture = () => {
    if (preview) {
      onCapture(preview);
      setPreview(null);
      if (onClose) onClose();
    }
  };

  const cancelPreview = () => {
    setPreview(null);
  };

  const labels = {
    hi: {
      useCamera: "कैमरा उपयोग करें",
      upload: "गैलरी से चुनें",
      capture: "कैप्चर करें",
      confirm: "पुष्टि करें",
      cancel: "रद्द करें",
    },
    bn: {
      useCamera: "ক্যামেরা ব্যবহার করুন",
      upload: "গ্যালারি থেকে নির্বাচন করুন",
      capture: "ক্যাপচার করুন",
      confirm: "নিশ্চিত করুন",
      cancel: "বাতিল করুন",
    },
    en: {
      useCamera: "Use Camera",
      upload: "Choose from Gallery",
      capture: "Capture",
      confirm: "Confirm",
      cancel: "Cancel",
    },
  };

  const t = labels[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {!showCamera && !preview && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Capture Image</h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-6 h-6" />
                {t.useCamera}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-colors"
              >
                <Upload className="w-6 h-6" />
                {t.upload}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {showCamera && !preview && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-[60vh] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
                >
                  {t.capture}
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {preview && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-[60vh] object-contain bg-gray-100"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={cancelPreview}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmCapture}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
