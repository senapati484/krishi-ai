import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Farm from '@/models/Farm';
import { getWeatherData, generateWeatherAlerts } from '@/lib/weather';
import { sendWeatherAlertEmail } from '@/lib/email';

// Crop weather sensitivity mapping
const cropWeatherSensitivity: Record<string, {
  harmfulConditions: Array<{
    type: string;
    condition: (weather: any) => boolean;
    impact: string;
  }>;
}> = {
  rice: {
    harmfulConditions: [
      {
        type: 'excessive_rainfall',
        condition: (w: any) => w.rainfall > 100,
        impact: 'Excessive rainfall can cause waterlogging and fungal diseases in rice',
      },
      {
        type: 'high_temperature',
        condition: (w: any) => w.temp > 35,
        impact: 'High temperature can affect grain filling and reduce yield',
      },
      {
        type: 'storm',
        condition: (w: any) => w.windSpeed > 40,
        impact: 'Strong winds can cause lodging (bending) of rice plants',
      },
    ],
  },
  wheat: {
    harmfulConditions: [
      {
        type: 'frost',
        condition: (w: any) => w.temp < 0,
        impact: 'Frost can damage wheat seedlings and young plants',
      },
      {
        type: 'excessive_rainfall',
        condition: (w: any) => w.rainfall > 80,
        impact: 'Excessive rainfall during flowering can cause diseases',
      },
    ],
  },
  cotton: {
    harmfulConditions: [
      {
        type: 'excessive_humidity',
        condition: (w: any) => w.humidity > 85,
        impact: 'High humidity increases risk of fungal diseases in cotton',
      },
      {
        type: 'heavy_rainfall',
        condition: (w: any) => w.rainfall > 90,
        impact: 'Heavy rainfall can cause boll rot in cotton',
      },
    ],
  },
  tomato: {
    harmfulConditions: [
      {
        type: 'high_humidity',
        condition: (w: any) => w.humidity > 80,
        impact: 'High humidity increases risk of late blight and early blight',
      },
      {
        type: 'excessive_rainfall',
        condition: (w: any) => w.rainfall > 100,
        impact: 'Excessive rainfall can cause various fungal diseases',
      },
    ],
  },
  potato: {
    harmfulConditions: [
      {
        type: 'high_humidity_temp',
        condition: (w: any) => w.humidity > 80 && w.temp > 18,
        impact: 'High humidity and temperature increase late blight risk',
      },
      {
        type: 'excessive_rainfall',
        condition: (w: any) => w.rainfall > 80,
        impact: 'Excessive rainfall can cause tuber rot diseases',
      },
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you should add proper authentication)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all users with farms and location data
    const users = await User.find({
      $and: [
        { 'lastLocation': { $exists: true } },
        { 'lastLocation.lat': { $exists: true, $ne: null } },
        { 'lastLocation.lon': { $exists: true, $ne: null } },
      ],
    }).lean();

    let notificationsSent = 0;
    let errors: string[] = [];

    for (const user of users) {
      try {
        if (!user.lastLocation || !user.lastLocation.lat || !user.lastLocation.lon) {
          continue;
        }

        // Get user's farms to find crops
        const farms = await Farm.find({ userId: user._id }).lean();
        const crops = farms.flatMap((farm: any) => farm.crops || []);

        if (crops.length === 0) {
          continue;
        }

        // Get weather data for user's location
        const weatherData = await getWeatherData(
          user.lastLocation.lat,
          user.lastLocation.lon
        );

        // Check each crop for weather hazards
        let hazardsFound = false;
        const hazardAlerts: string[] = [];

        for (const crop of crops) {
          const cropSensitivity = cropWeatherSensitivity[crop.name?.toLowerCase()];
          
          if (cropSensitivity) {
            for (const harmfulCondition of cropSensitivity.harmfulConditions) {
              if (harmfulCondition.condition(weatherData)) {
                hazardsFound = true;
                hazardAlerts.push(`${crop.name}: ${harmfulCondition.impact}`);
              }
            }
          }
        }

        // Send email if hazards found
        if (hazardsFound && user.email && user.emailNotifications !== false) {
          const alerts = generateWeatherAlerts(weatherData, user.language || 'hi');
          
          await sendWeatherAlertEmail(user.email, {
            userName: user.name || 'Farmer',
            location: `${user.location?.district || ''}, ${user.location?.state || ''}`,
            alerts: alerts.map(a => ({
              type: a.type,
              severity: a.severity,
              message: a.message,
              cropImpact: a.cropImpact,
            })),
            weather: {
              temp: weatherData.temp,
              humidity: weatherData.humidity,
              rainfall: weatherData.rainfall,
              condition: weatherData.condition,
            },
            language: user.language || 'hi',
          });

          notificationsSent++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user._id}:`, userError);
        errors.push(`User ${user._id}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent,
      usersProcessed: users.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
