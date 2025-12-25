import { NextRequest, NextResponse } from 'next/server';
import { getWeatherData } from '@/lib/weather';

// Get current weather for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const weather = await getWeatherData(lat, lon);

    return NextResponse.json({
      success: true,
      weather,
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

