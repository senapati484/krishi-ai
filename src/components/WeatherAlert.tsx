"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  AlertTriangle,
  Droplets,
  Wind,
} from "lucide-react";
import { useStore } from "@/store/useStore";

interface WeatherAlert {
  type: string;
  severity: "low" | "moderate" | "high" | "critical";
  message: string;
  cropImpact: string;
}

interface WeatherData {
  alerts?: WeatherAlert[];
}

interface WeatherAlertProps {
  language: "hi" | "bn" | "en";
}

export default function WeatherAlert({
  language: _language,
}: WeatherAlertProps) {
  const { user } = useStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!user?.lastLocation?.lat || !user?.lastLocation?.lon) {
      return;
    }

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `/api/weather/current?lat=${user.lastLocation!.lat}&lon=${
            user.lastLocation!.lon
          }`
        );
        const data = await response.json();
        if (data.success && data.weather) {
          setWeather(data.weather);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchWeather();
  }, [user?.lastLocation?.lat, user?.lastLocation?.lon]);

  if (
    !user?.lastLocation ||
    !weather ||
    !weather.alerts ||
    weather.alerts.length === 0
  ) {
    return null;
  }

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case "rain":
        return <CloudRain className="w-6 h-6" />;
      case "storm":
        return <Wind className="w-6 h-6" />;
      case "extreme_temp":
        return <Sun className="w-6 h-6" />;
      case "high_humidity":
        return <Droplets className="w-6 h-6" />;
      default:
        return <Cloud className="w-6 h-6" />;
    }
  };

  const severityColors = {
    low: "bg-blue-50 border-blue-200 text-blue-800",
    moderate: "bg-yellow-50 border-yellow-200 text-yellow-800",
    high: "bg-orange-50 border-orange-200 text-orange-800",
    critical: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="space-y-3">
      {weather.alerts.map((alert: WeatherAlert, index: number) => (
        <div
          key={index}
          className={`p-4 rounded-xl border-2 ${
            severityColors[alert.severity as keyof typeof severityColors]
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-1">{getWeatherIcon(alert.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-lg">{alert.message}</h4>
              </div>
              <p className="text-sm opacity-90">{alert.cropImpact}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
