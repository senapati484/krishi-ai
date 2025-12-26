"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

export default function LocationTracker() {
  const { user, setUser } = useStore();
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;

    // If we already have a fresh location (within 1 hour), skip
    if (
      user?.lastLocation?.updatedAt &&
      new Date(user.lastLocation.updatedAt).getTime() > Date.now() - 3600000
    ) {
      return;
    }

    requestedRef.current = true;

    // Silently attempt location - only log to console if needed for debugging
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Always store locally so UI can render weather
          setUser({
            ...(user || { name: "Guest", language: "en" }),
            lastLocation: {
              lat: latitude,
              lon: longitude,
              updatedAt: new Date().toISOString(),
            },
          });

          // If user is logged in, persist to backend
          if (user?.id) {
            try {
              await fetch("/api/user/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user.id,
                  lat: latitude,
                  lon: longitude,
                }),
              });
            } catch (error) {
              // Silently fail
            }
          }
        },
        (error) => {
          // Silently handle geolocation errors - location is optional and user can enable it in settings
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 3600000,
        }
      );
    }
  }, [setUser, user]);

  return null;
}
