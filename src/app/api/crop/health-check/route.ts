import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Farm from '@/models/Farm';
import { getWeatherData } from '@/lib/weather';
import { analyzeCropHealth } from '@/lib/cropHealth';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, cropName, plantedDate, lat, lon, language } = body;

        if (!userId || !cropName) {
            return NextResponse.json(
                { error: 'User ID and crop name are required' },
                { status: 400 }
            );
        }

        if (!lat || !lon) {
            return NextResponse.json(
                { error: 'Location (lat, lon) is required for weather-based analysis' },
                { status: 400 }
            );
        }

        // Fetch current weather data
        let weather;
        try {
            weather = await getWeatherData(lat, lon);
        } catch (error) {
            console.error('Weather fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch weather data. Please try again.' },
                { status: 500 }
            );
        }

        // Analyze crop health based on weather
        const healthAnalysis = analyzeCropHealth(cropName, plantedDate, weather);

        // Update farm crop status based on analysis
        try {
            const farm = await Farm.findOne({ userId });
            if (farm && farm.crops) {
                const cropIndex = farm.crops.findIndex(
                    (c: any) => c.name.toLowerCase() === cropName.toLowerCase()
                );
                if (cropIndex !== -1) {
                    // Map overall status to farm status
                    let status: 'healthy' | 'monitoring' | 'diseased' = 'healthy';
                    if (healthAnalysis.overallStatus === 'critical' || healthAnalysis.overallStatus === 'poor') {
                        status = 'diseased';
                    } else if (healthAnalysis.overallStatus === 'moderate') {
                        status = 'monitoring';
                    }

                    farm.crops[cropIndex].status = status;
                    farm.crops[cropIndex].lastCheck = new Date();
                    await farm.save();
                }
            }
        } catch (error) {
            console.error('Error updating farm status:', error);
            // Continue even if farm update fails
        }

        return NextResponse.json({
            success: true,
            weather: {
                temp: weather.temp,
                humidity: weather.humidity,
                rainfall: weather.rainfall,
                windSpeed: weather.windSpeed,
                condition: weather.condition,
                description: weather.description,
            },
            analysis: healthAnalysis,
        });
    } catch (error: unknown) {
        console.error('Error in crop health check API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to analyze crop health', details: errorMessage },
            { status: 500 }
        );
    }
}
