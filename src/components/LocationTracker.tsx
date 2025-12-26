"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export default function LocationTracker() {
  const { user, setUser } = useStore();

  useEffect(() => {
    if (!user?.id) return;

    // Check if location is already recent (within last hour)
    if (
      user.lastLocation?.updatedAt &&
      new Date(user.lastLocation.updatedAt).getTime() > Date.now() - 3600000
    ) {
      return;
    }

    // Request location - only in browser
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Update location on server
            const response = await fetch("/api/user/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                lat: latitude,
                lon: longitude,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && user) {
                // Update user in store
                setUser({
                  ...user,
                  lastLocation: {
                    lat: latitude,
                    lon: longitude,
                    updatedAt: new Date().toISOString(),
                  },
                });
              }
            }
          } catch (error) {
            console.error("Error updating location:", error);
          }
        },
        (error) => {
          // Handle geolocation error codes properly
          const errorMessages: { [key: number]: string } = {
            1: "Permission denied - please enable location access in browser settings",
            2: "Position unavailable - your device cannot determine location",
            3: "Timeout - location request took too long, please try again",
          };
          const message =
            errorMessages[error.code] ||
            `Geolocation error code: ${error.code}`;
          console.error("Error getting location:", message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3600000, // Cache for 1 hour
        }
      );
    }
  }, [user?.id]);

  return null; // This component doesn't render anything
}

