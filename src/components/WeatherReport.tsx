"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

interface WeatherReportProps {
  language: Language;
}

interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  description: string;
  main: string;
  alerts?: Array<{
    type: string;
    severity: "low" | "moderate" | "high" | "critical";
    message: string;
    cropImpact: string;
  }>;
}

export default function WeatherReport({ language }: WeatherReportProps) {
  const { user } = useStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!user?.lastLocation?.lat || !user?.lastLocation?.lon) {
      setError("Location not set. Please update your location in profile.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/weather/current?lat=${user.lastLocation.lat}&lon=${user.lastLocation.lon}`
      );
      const data = await response.json();
      if (data.success && data.weather) {
        setWeather(data.weather);
      } else {
        setError(data.error || "Failed to fetch weather data");
      }
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.lastLocation?.lat && user?.lastLocation?.lon) {
      fetchWeather();
    }
  }, [user?.lastLocation?.lat, user?.lastLocation?.lon]);

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case "rain":
      case "drizzle":
        return <CloudRain className="w-8 h-8" />;
      case "clouds":
        return <Cloud className="w-8 h-8" />;
      case "clear":
        return <Sun className="w-8 h-8" />;
      default:
        return <Cloud className="w-8 h-8" />;
    }
  };

  if (!user?.lastLocation) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <p className="text-blue-800 font-semibold mb-2">
          {t("locationNotSet", language) || "Location not set"}
        </p>
        <p className="text-sm text-blue-700">
          Please update your location in profile to see weather reports.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
        <p className="mt-3 text-gray-600">{t("loading", language)}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-semibold mb-2">{error}</p>
        <button
          onClick={fetchWeather}
          className="text-red-700 text-sm font-semibold hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          {t("weatherReport", language) || "Weather Report"}
        </h3>
        <button
          onClick={fetchWeather}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-xs text-gray-600">Temperature</p>
            <p className="text-lg font-bold">{Math.round(weather.temp)}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Humidity</p>
            <p className="text-lg font-bold">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-600">Rainfall</p>
            <p className="text-lg font-bold">{weather.rainfall.toFixed(1)}mm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">Wind</p>
            <p className="text-lg font-bold">{weather.windSpeed.toFixed(1)} m/s</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        {getWeatherIcon(weather.main)}
        <div>
          <p className="font-semibold text-gray-900 capitalize">
            {weather.description}
          </p>
          <p className="text-sm text-gray-600">
            {weather.main}
          </p>
        </div>
      </div>

      {weather.alerts && weather.alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-gray-900">
            {t("weatherAlerts", language) || "Weather Alerts"}:
          </h4>
          {weather.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${
                alert.severity === "critical"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : alert.severity === "high"
                  ? "bg-orange-50 border-orange-200 text-orange-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}
            >
              <p className="font-semibold text-sm">{alert.message}</p>
              <p className="text-xs mt-1">{alert.cropImpact}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

