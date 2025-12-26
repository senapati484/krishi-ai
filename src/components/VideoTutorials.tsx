"use client";

import { useState, useEffect } from "react";
import { Play, ThumbsUp, Eye, Download, QrCode as QrCodeIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { QRCodeSVG } from "qrcode.react";

interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  language: string;
  crop?: string;
  disease?: string;
  treatmentType?: string;
  duration?: number;
  views: number;
  likes: number;
  isCommunityUpload: boolean;
}

interface VideoTutorialsProps {
  language: Language;
  crop?: string;
  disease?: string;
  treatmentType?: string;
  showQR?: boolean;
  diagnosisId?: string;
}

export default function VideoTutorials ({
  language,
  crop,
  disease,
  treatmentType,
  showQR = false,
  diagnosisId,
}: VideoTutorialsProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Helper function to check if URL is YouTube
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  useEffect(() => {
    setMounted(true);
    fetchVideos();
  }, [crop, disease, treatmentType, language]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        language,
        limit: "5",
      });
      if (crop) params.append("crop", crop);
      if (disease) params.append("disease", disease);
      if (treatmentType) params.append("treatmentType", treatmentType);

      const response = await fetch(`/api/videos?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateVideoURL = (videoId: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/videos/${videoId}${diagnosisId ? `?diagnosis=${diagnosisId}` : ""}`;
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Play className="w-6 h-6 text-green-600" />
          {t("videoTutorials", language) || "Video Tutorials"}
        </h3>
        {showQR && selectedVideo && (
          <button
            onClick={() => setShowQRCode(!showQRCode)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Show QR Code"
          >
            <QrCodeIcon className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {showQRCode && selectedVideo && (
        <div className="bg-gray-50 rounded-xl p-4 text-center border-2 border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {t("scanToWatch", language) || "Scan QR Code to Watch Video"}
          </p>
          <div className="flex justify-center mb-2">
            <QRCodeSVG
              value={generateVideoURL(selectedVideo.id)}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-xs text-gray-600">{selectedVideo.title}</p>
        </div>
      )}

      <div className="space-y-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-green-500 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedVideo(video);
              if (showQR) {
                setShowQRCode(false);
              }
            }}
          >
            <div className="flex gap-4 p-4">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">{video.title}</h4>
                {video.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {video.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {video.likes}
                  </span>
                  {video.duration && (
                    <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}</span>
                  )}
                  {video.isCommunityUpload && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {t("community", language) || "Community"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {selectedVideo?.id === video.id && (
              <div className="px-4 pb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  {isYouTubeUrl(video.videoUrl) ? (
                    <iframe
                      width="100%"
                      height="400"
                      src={video.videoUrl}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="rounded-lg"
                    />
                  ) : (
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full rounded-lg"
                      poster={video.thumbnailUrl}
                    />
                  )}
                </div>
                {showQR && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQRCode(true);
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    {t("showQRCode", language) || "Show QR Code"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

