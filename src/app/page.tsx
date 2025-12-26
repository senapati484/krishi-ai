"use client";

import { useState } from "react";
import {
  Camera,
  Mic,
  History,
  User,
  Globe,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import CameraCapture from "@/components/CameraCapture";
import VoiceInput from "@/components/VoiceInput";
import DiagnosisResult from "@/components/DiagnosisResult";
import QuickDiagnosisCards from "@/components/QuickDiagnosisCards";
import WeatherAlert from "@/components/WeatherAlert";
import WeatherReport from "@/components/WeatherReport";
import VideoTutorials from "@/components/VideoTutorials";
import PWAInstall from "@/components/PWAInstall";
import LocationTracker from "@/components/LocationTracker";
import Link from "next/link";
import { useEffect } from "react";

export default function Home () {
  const { user, language, setLanguage, logout } = useStore();
  const [showCamera, setShowCamera] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  interface DiagnosisData {
    crop: string;
    disease: {
      name: string;
      scientificName?: string;
      confidence: number;
      severity: "low" | "moderate" | "high" | "critical";
    } | null;
    advice: {
      immediate: string[];
      treatment: Array<{
        type: "organic" | "chemical";
        name: string;
        dosage: string;
        cost: number;
        availability: string;
      }>;
      prevention: string[];
      expertConsultNeeded: boolean;
    };
    symptoms?: string[];
    affectedArea?: string;
    timestamp?: string;
  }

  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Register service worker
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }
  }, []);

  const handleImageCapture = async (imageData: string) => {
    setShowCamera(false);
    setLoading(true);
    setError(null);

    try {
      // Ensure user exists
      let currentUser = user;
      if (!currentUser || !currentUser.id) {
        // Create or get user
        const userResponse = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Farmer",
            language,
          }),
        });
        const userData = await userResponse.json();
        currentUser = userData.user;
        useStore.getState().setUser(currentUser);
      }

      if (!currentUser?.id) {
        setError("User not found");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          userId: currentUser.id,
          inputType: "image",
          language,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDiagnosis(data.diagnosis);
      } else {
        setError(data.error || "Failed to diagnose");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    setShowVoice(false);
    setLoading(true);
    setError(null);

    try {
      let currentUser = user;
      if (!currentUser || !currentUser.id) {
        const userResponse = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Farmer",
            language,
          }),
        });
        const userData = await userResponse.json();
        currentUser = userData.user;
        useStore.getState().setUser(currentUser);
      }

      if (!currentUser?.id) {
        setError("User not found");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceTranscript: transcript,
          userId: currentUser.id,
          inputType: "voice",
          language,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDiagnosis(data.diagnosis);
      } else {
        setError(data.error || "Failed to process query");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const languages: Array<{ code: "hi" | "bn" | "en"; name: string }> = [
    { code: "hi", name: "हिंदी" },
    { code: "bn", name: "বাংলা" },
    { code: "en", name: "English" },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-b from-green-50 to-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              🌾 {t("appName", language)}
            </h1>
            <p className="text-sm text-gray-600">
              {t("tagline", language) || "Your Crop Doctor"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-600" />
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "hi" | "bn" | "en")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            {user ? (
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {diagnosis ? (
          <div className="space-y-4">
            <button
              onClick={() => setDiagnosis(null)}
              className="text-green-700 font-semibold flex items-center gap-2"
            >
              ← {t("back", language)}
            </button>
            <DiagnosisResult diagnosis={diagnosis} language={language} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setShowCamera(true)}
                disabled={loading}
                className="bg-green-600 text-white p-8 rounded-2xl shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4 h-48"
              >
                <Camera className="w-16 h-16" />
                <span className="text-xl font-bold">
                  {t("scanCrop", language)}
                </span>
              </button>

              <button
                onClick={() => setShowVoice(true)}
                disabled={loading}
                className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4 h-48"
              >
                <Mic className="w-16 h-16" />
                <span className="text-xl font-bold">
                  {t("voiceQuery", language)}
                </span>
              </button>
            </div>

            {/* Weather Report Section - Always Show */}
            <div className="space-y-4">
              <WeatherReport language={language} />
              <WeatherAlert language={language} />
            </div>

            {/* Quick Diagnosis Cards */}
            <QuickDiagnosisCards language={language} cropType="tomato" />

            {/* Video Tutorials Section */}
            <div className="mt-6">
              <VideoTutorials language={language} showQR={true} />
            </div>

            {/* Secondary Actions */}
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/dashboard"
                className="bg-gray-100 text-gray-800 p-6 rounded-xl shadow hover:bg-gray-200 transition-all flex flex-col items-center justify-center gap-3 font-semibold"
              >
                <LayoutDashboard className="w-6 h-6" />
                {t("myFarm", language) || "My Farm"}
              </Link>

              <Link
                href="/history"
                className="bg-gray-100 text-gray-800 p-6 rounded-xl shadow hover:bg-gray-200 transition-all flex flex-col items-center justify-center gap-3 font-semibold"
              >
                <History className="w-6 h-6" />
                {t("myHistory", language)}
              </Link>

              <Link
                href="/profile"
                className="bg-gray-100 text-gray-800 p-6 rounded-xl shadow hover:bg-gray-200 transition-all flex flex-col items-center justify-center gap-3 font-semibold"
              >
                <User className="w-6 h-6" />
                {t("myProfile", language)}
              </Link>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-semibold">
                  {t("analyzing", language)}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-semibold">{error}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
          language={language}
        />
      )}

      {/* Voice Input Modal */}
      {showVoice && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{t("voiceQuery", language)}</h3>
              <button
                onClick={() => setShowVoice(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              language={language}
            />
          </div>
        </div>
      )}

      <PWAInstall />
      <LocationTracker />
    </div>
  );
}
