"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, RotateCcw } from "lucide-react";

interface Props {
  onCapture: (image: string) => void;
  onClose: () => void;
  language: "hi" | "bn" | "en";
}

const labels = {
  en: {
    title: "Capture Image",
    useCamera: "Use Camera",
    upload: "Upload from Gallery",
    capture: "Capture",
    retake: "Retake",
    confirm: "Confirm",
  },
  hi: {
    title: "छवि कैप्चर करें",
    useCamera: "कैमरा उपयोग करें",
    upload: "गैलरी से चुनें",
    capture: "कैप्चर करें",
    retake: "फिर से लें",
    confirm: "पुष्टि करें",
  },
  bn: {
    title: "ছবি ক্যাপচার করুন",
    useCamera: "ক্যামেরা ব্যবহার করুন",
    upload: "গ্যালারি থেকে নির্বাচন করুন",
    capture: "ক্যাপচার করুন",
    retake: "আবার নিন",
    confirm: "নিশ্চিত করুন",
  },
};

export default function CameraCapture({ onCapture, onClose, language }: Props) {
  const t = labels[language];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      if (stream) return; // 🔑 prevent double start

      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });

      setStream(s);
      setCameraOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }
    } catch (e) {
      alert("Camera permission denied");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const v = videoRef.current;
    const c = canvasRef.current;

    c.width = v.videoWidth;
    c.height = v.videoHeight;

    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, 0, 0);

    setPreview(c.toDataURL("image/jpeg", 0.85));
    // ❌ DO NOT stop camera here
  };

  const confirm = () => {
    if (preview) onCapture(preview);
    stopCamera();
    onClose();
  };

  const retake = () => {
    setPreview(null);
  };

  const flipCamera = async () => {
    stopCamera();
    setFacing((f) => (f === "user" ? "environment" : "user"));
    setTimeout(startCamera, 200);
  };

  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl mx-2 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">{t.title}</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            <X />
          </button>
        </div>

        {/* BODY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* CAMERA / PREVIEW */}
          <div className="relative bg-black h-[70vh] md:h-[80vh]">
            {!preview && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            )}

            {preview && (
              <img
                src={preview}
                className="w-full h-full object-contain bg-black"
              />
            )}

            {cameraOn && !preview && (
              <>
                <button
                  onClick={flipCamera}
                  className="absolute top-4 left-4 bg-white/80 p-2 rounded-full"
                >
                  <RotateCcw />
                </button>

                <button
                  onClick={capture}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white w-20 h-20 rounded-full"
                >
                  ●
                </button>
              </>
            )}
          </div>

          {/* ACTION PANEL */}
          <div className="p-6 flex flex-col justify-center gap-4">
            {!cameraOn && !preview && (
              <>
                <button
                  onClick={startCamera}
                  className="bg-green-600 text-white py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Camera /> {t.useCamera}
                </button>

                <div className="text-center text-gray-400 font-semibold">
                  OR
                </div>

                <button
                  onClick={() => fileRef.current?.click()}
                  className="bg-gray-100 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Upload /> {t.upload}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={upload}
                  className="hidden"
                />
              </>
            )}

            {preview && (
              <div className="flex gap-4">
                <button
                  onClick={retake}
                  className="flex-1 bg-gray-200 py-3 rounded-xl font-semibold"
                >
                  {t.retake}
                </button>
                <button
                  onClick={confirm}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold"
                >
                  {t.confirm}
                </button>
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
