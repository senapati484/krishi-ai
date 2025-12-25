import { NextRequest, NextResponse } from 'next/server';
import { getWeatherData, generateWeatherAlerts } from '@/lib/weather';

// Get current weather for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');
    const language = searchParams.get('language') || 'en';

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const weatherData = await getWeatherData(lat, lon);

    if (!weatherData) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      );
    }

    // Generate alerts based on weather conditions
    const alerts = generateWeatherAlerts(weatherData, language);

    // Format weather data for response
    const weather = {
      temp: weatherData.temp,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall,
      windSpeed: weatherData.windSpeed,
      description: weatherData.description,
      main: weatherData.main || weatherData.condition,
      alerts: alerts.length > 0 ? alerts : undefined,
    };

    return NextResponse.json({
      success: true,
      weather: {
        ...weather,
        alerts: alerts.length > 0 ? alerts : undefined,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching weather:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch weather', details: errorMessage },
      { status: 500 }
    );
  }
}

