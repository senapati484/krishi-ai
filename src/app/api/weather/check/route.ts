import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getWeatherData, shouldSendAlert } from '@/lib/weather';
import { sendWeatherAlertEmail } from '@/lib/email';

// This endpoint will be called by a cron job every 5 minutes
export async function GET(request: NextRequest) {
  try {
    // Check for cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all users with email notifications enabled, verified email, and lastLocation
    const users = await User.find({
      emailNotifications: true,
      emailVerified: true, // Only verified emails
      lastLocation: { $exists: true, $ne: null },
      email: { $exists: true, $ne: null },
    });

    console.log(`Checking weather for ${users.length} users...`);

    let alertsSent = 0;
    let errors = 0;

    // Process each user
    for (const user of users) {
      try {
        if (!user.lastLocation?.lat || !user.lastLocation?.lon) {
          continue;
        }

        // Get weather data
        const weather = await getWeatherData(user.lastLocation.lat, user.lastLocation.lon);

        // Check if alerts are needed
        if (weather.alerts && weather.alerts.length > 0 && shouldSendAlert(weather.alerts)) {
          // Prepare location string
          const locationStr = user.location?.village 
            ? `${user.location.village}, ${user.location.district || ''}, ${user.location.state || ''}`
            : `Lat: ${user.lastLocation.lat}, Lon: ${user.lastLocation.lon}`;

          // Send email alert
          await sendWeatherAlertEmail(user.email, {
            userName: user.name,
            location: locationStr,
            alerts: weather.alerts,
            weather: {
              temp: weather.temp,
              humidity: weather.humidity,
              rainfall: weather.rainfall,
              condition: weather.condition,
            },
            language: user.language,
          });

          alertsSent++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weather check completed`,
      stats: {
        usersChecked: users.length,
        alertsSent,
        errors,
      },
    });
  } catch (error: unknown) {
    console.error('Error in weather check API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to check weather', details: errorMessage },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

