const OPEN_WEATHER_API_KEY = process.env.OPEN_WEATHER_API_KEY || '';

export interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  condition: string;
  description: string;
  windSpeed: number;
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  type: 'rain' | 'storm' | 'extreme_temp' | 'high_humidity' | 'drought';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  cropImpact: string;
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  if (!OPEN_WEATHER_API_KEY) {
    throw new Error('OPEN_WEATHER_API_KEY not configured');
  }

  try {
    // Get current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric`;
    const currentResponse = await fetch(currentUrl);
    const currentData = await currentResponse.json();

    // Get forecast for next 24 hours
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}&units=metric&cnt=8`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    // Calculate rainfall from forecast
    let rainfall = 0;
    if (forecastData.list) {
      forecastData.list.forEach((item: any) => {
        if (item.rain && item.rain['3h']) {
          rainfall += item.rain['3h'];
        }
      });
    }

    const weather: WeatherData = {
      temp: currentData.main.temp,
      humidity: currentData.main.humidity,
      rainfall,
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      windSpeed: currentData.wind?.speed || 0,
    };

    // Generate alerts based on weather conditions
    weather.alerts = generateWeatherAlerts(weather);

    return weather;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

function generateWeatherAlerts(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Heavy rain alert
  if (weather.rainfall > 20) {
    alerts.push({
      type: 'rain',
      severity: weather.rainfall > 50 ? 'critical' : 'high',
      message: `Heavy rainfall expected: ${weather.rainfall.toFixed(1)}mm`,
      cropImpact: 'Risk of waterlogging, fungal diseases, and crop damage. Ensure proper drainage.',
    });
  } else if (weather.rainfall > 10) {
    alerts.push({
      type: 'rain',
      severity: 'moderate',
      message: `Moderate rainfall expected: ${weather.rainfall.toFixed(1)}mm`,
      cropImpact: 'Monitor for waterlogging. Good for irrigation but watch for fungal diseases.',
    });
  }

  // Extreme temperature alerts
  if (weather.temp > 40) {
    alerts.push({
      type: 'extreme_temp',
      severity: 'high',
      message: `Extreme heat: ${weather.temp.toFixed(1)}°C`,
      cropImpact: 'High risk of heat stress, wilting, and reduced yield. Increase irrigation frequency.',
    });
  } else if (weather.temp < 5) {
    alerts.push({
      type: 'extreme_temp',
      severity: 'high',
      message: `Freezing temperature: ${weather.temp.toFixed(1)}°C`,
      cropImpact: 'Risk of frost damage. Cover sensitive crops or move them indoors.',
    });
  }

  // High humidity alert (promotes fungal diseases)
  if (weather.humidity > 80) {
    alerts.push({
      type: 'high_humidity',
      severity: weather.humidity > 90 ? 'high' : 'moderate',
      message: `High humidity: ${weather.humidity}%`,
      cropImpact: 'Increased risk of fungal diseases (powdery mildew, blight). Apply preventive fungicides.',
    });
  }

  // Storm/strong wind alert
  if (weather.windSpeed > 15) {
    alerts.push({
      type: 'storm',
      severity: weather.windSpeed > 25 ? 'critical' : 'moderate',
      message: `Strong winds: ${weather.windSpeed.toFixed(1)} m/s`,
      cropImpact: 'Risk of physical damage to crops. Secure structures and protect young plants.',
    });
  }

  // Drought alert (no rain for extended period - would need historical data)
  // This is a simplified version
  if (weather.rainfall === 0 && weather.temp > 30 && weather.humidity < 40) {
    alerts.push({
      type: 'drought',
      severity: 'moderate',
      message: 'Dry conditions detected',
      cropImpact: 'Low moisture levels. Increase irrigation to prevent crop stress.',
    });
  }

  return alerts;
}

export function shouldSendAlert(alerts: WeatherAlert[]): boolean {
  // Only send alerts for moderate, high, or critical severity
  return alerts.some(alert => 
    alert.severity === 'moderate' || 
    alert.severity === 'high' || 
    alert.severity === 'critical'
  );
}

