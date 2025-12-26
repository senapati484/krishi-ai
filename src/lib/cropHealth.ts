import type { WeatherData } from './weather';

export interface CropHealthAnalysis {
    overallStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    weatherSuitability: {
        status: 'ideal' | 'favorable' | 'moderate' | 'unfavorable' | 'critical';
        score: number; // 0-100
        message: string;
    };
    diseaseRisk: {
        level: 'low' | 'moderate' | 'high' | 'critical';
        score: number; // 0-100
        factors: string[];
        recommendation: string;
    };
    waterStress: {
        level: 'none' | 'low' | 'moderate' | 'high' | 'severe';
        indicator: string;
        action: string;
    };
    pestRisk: {
        level: 'low' | 'moderate' | 'high';
        pests: string[];
        prevention: string;
    };
    growthStage: {
        stage: string;
        daysFromPlanting: number;
        nextMilestone: string;
        daysToNextMilestone: number;
    };
    harvestReadiness: {
        isReady: boolean;
        daysToHarvest: number;
        estimatedDate: string;
    };
    recommendations: string[];
    alerts: Array<{
        type: 'warning' | 'danger' | 'info';
        message: string;
    }>;
}

// Crop-specific optimal conditions
const CROP_CONDITIONS: Record<string, {
    optimalTemp: { min: number; max: number };
    optimalHumidity: { min: number; max: number };
    maxRainfall: number;
    growthDays: number;
    stages: Array<{ name: string; daysFromPlanting: number }>;
    diseases: Array<{ name: string; conditions: { humidity: number; temp: number } }>;
    pests: Array<{ name: string; season: string; conditions: string }>;
}> = {
    rice: {
        optimalTemp: { min: 20, max: 35 },
        optimalHumidity: { min: 60, max: 85 },
        maxRainfall: 30,
        growthDays: 120,
        stages: [
            { name: 'Germination', daysFromPlanting: 0 },
            { name: 'Seedling', daysFromPlanting: 15 },
            { name: 'Tillering', daysFromPlanting: 30 },
            { name: 'Stem Elongation', daysFromPlanting: 55 },
            { name: 'Heading', daysFromPlanting: 75 },
            { name: 'Flowering', daysFromPlanting: 90 },
            { name: 'Grain Filling', daysFromPlanting: 100 },
            { name: 'Maturity', daysFromPlanting: 120 },
        ],
        diseases: [
            { name: 'Blast', conditions: { humidity: 85, temp: 25 } },
            { name: 'Sheath Blight', conditions: { humidity: 90, temp: 30 } },
            { name: 'Brown Spot', conditions: { humidity: 80, temp: 28 } },
        ],
        pests: [
            { name: 'Stem Borer', season: 'monsoon', conditions: 'humid and warm' },
            { name: 'Brown Planthopper', season: 'monsoon', conditions: 'high humidity' },
        ],
    },
    wheat: {
        optimalTemp: { min: 10, max: 25 },
        optimalHumidity: { min: 40, max: 60 },
        maxRainfall: 15,
        growthDays: 140,
        stages: [
            { name: 'Germination', daysFromPlanting: 0 },
            { name: 'Seedling', daysFromPlanting: 14 },
            { name: 'Tillering', daysFromPlanting: 35 },
            { name: 'Stem Extension', daysFromPlanting: 60 },
            { name: 'Heading', daysFromPlanting: 85 },
            { name: 'Flowering', daysFromPlanting: 100 },
            { name: 'Grain Filling', daysFromPlanting: 120 },
            { name: 'Maturity', daysFromPlanting: 140 },
        ],
        diseases: [
            { name: 'Rust', conditions: { humidity: 70, temp: 20 } },
            { name: 'Powdery Mildew', conditions: { humidity: 60, temp: 18 } },
            { name: 'Karnal Bunt', conditions: { humidity: 75, temp: 22 } },
        ],
        pests: [
            { name: 'Aphids', season: 'winter', conditions: 'cool and dry' },
            { name: 'Termites', season: 'all', conditions: 'dry soil' },
        ],
    },
    tomato: {
        optimalTemp: { min: 18, max: 30 },
        optimalHumidity: { min: 50, max: 70 },
        maxRainfall: 10,
        growthDays: 90,
        stages: [
            { name: 'Germination', daysFromPlanting: 0 },
            { name: 'Seedling', daysFromPlanting: 14 },
            { name: 'Vegetative', daysFromPlanting: 30 },
            { name: 'Flowering', daysFromPlanting: 45 },
            { name: 'Fruiting', daysFromPlanting: 60 },
            { name: 'Harvesting', daysFromPlanting: 75 },
            { name: 'Maturity', daysFromPlanting: 90 },
        ],
        diseases: [
            { name: 'Early Blight', conditions: { humidity: 75, temp: 25 } },
            { name: 'Late Blight', conditions: { humidity: 90, temp: 20 } },
            { name: 'Leaf Curl Virus', conditions: { humidity: 60, temp: 30 } },
        ],
        pests: [
            { name: 'Whitefly', season: 'summer', conditions: 'hot and dry' },
            { name: 'Fruit Borer', season: 'monsoon', conditions: 'humid' },
        ],
    },
    potato: {
        optimalTemp: { min: 15, max: 25 },
        optimalHumidity: { min: 60, max: 80 },
        maxRainfall: 15,
        growthDays: 100,
        stages: [
            { name: 'Sprouting', daysFromPlanting: 0 },
            { name: 'Vegetative Growth', daysFromPlanting: 20 },
            { name: 'Tuber Initiation', daysFromPlanting: 40 },
            { name: 'Tuber Bulking', daysFromPlanting: 60 },
            { name: 'Maturity', daysFromPlanting: 90 },
            { name: 'Harvest', daysFromPlanting: 100 },
        ],
        diseases: [
            { name: 'Late Blight', conditions: { humidity: 90, temp: 18 } },
            { name: 'Early Blight', conditions: { humidity: 70, temp: 25 } },
        ],
        pests: [
            { name: 'Potato Tuber Moth', season: 'summer', conditions: 'warm' },
            { name: 'Aphids', season: 'all', conditions: 'moderate humidity' },
        ],
    },
    cotton: {
        optimalTemp: { min: 22, max: 35 },
        optimalHumidity: { min: 50, max: 70 },
        maxRainfall: 25,
        growthDays: 160,
        stages: [
            { name: 'Germination', daysFromPlanting: 0 },
            { name: 'Seedling', daysFromPlanting: 20 },
            { name: 'Square Formation', daysFromPlanting: 45 },
            { name: 'Flowering', daysFromPlanting: 70 },
            { name: 'Boll Development', daysFromPlanting: 100 },
            { name: 'Boll Opening', daysFromPlanting: 140 },
            { name: 'Harvest', daysFromPlanting: 160 },
        ],
        diseases: [
            { name: 'Bacterial Blight', conditions: { humidity: 80, temp: 30 } },
            { name: 'Grey Mildew', conditions: { humidity: 85, temp: 25 } },
        ],
        pests: [
            { name: 'Bollworm', season: 'monsoon', conditions: 'humid and warm' },
            { name: 'Whitefly', season: 'summer', conditions: 'hot and dry' },
        ],
    },
    maize: {
        optimalTemp: { min: 21, max: 32 },
        optimalHumidity: { min: 50, max: 75 },
        maxRainfall: 20,
        growthDays: 110,
        stages: [
            { name: 'Germination', daysFromPlanting: 0 },
            { name: 'Seedling', daysFromPlanting: 14 },
            { name: 'Vegetative', daysFromPlanting: 35 },
            { name: 'Tasseling', daysFromPlanting: 55 },
            { name: 'Silking', daysFromPlanting: 65 },
            { name: 'Grain Filling', daysFromPlanting: 85 },
            { name: 'Maturity', daysFromPlanting: 110 },
        ],
        diseases: [
            { name: 'Turcicum Leaf Blight', conditions: { humidity: 80, temp: 25 } },
            { name: 'Downy Mildew', conditions: { humidity: 90, temp: 22 } },
        ],
        pests: [
            { name: 'Fall Armyworm', season: 'monsoon', conditions: 'warm and humid' },
            { name: 'Stem Borer', season: 'all', conditions: 'moderate' },
        ],
    },
};

// Default conditions for unknown crops
const DEFAULT_CONDITIONS = {
    optimalTemp: { min: 18, max: 30 },
    optimalHumidity: { min: 50, max: 75 },
    maxRainfall: 20,
    growthDays: 100,
    stages: [
        { name: 'Germination', daysFromPlanting: 0 },
        { name: 'Seedling', daysFromPlanting: 15 },
        { name: 'Vegetative', daysFromPlanting: 30 },
        { name: 'Flowering', daysFromPlanting: 50 },
        { name: 'Fruiting', daysFromPlanting: 70 },
        { name: 'Maturity', daysFromPlanting: 100 },
    ],
    diseases: [
        { name: 'Fungal Infection', conditions: { humidity: 80, temp: 25 } },
        { name: 'Bacterial Wilt', conditions: { humidity: 75, temp: 28 } },
    ],
    pests: [
        { name: 'General Pests', season: 'all', conditions: 'various' },
    ],
};

export function analyzeCropHealth(
    cropName: string,
    plantedDate: string | undefined,
    weather: WeatherData
): CropHealthAnalysis {
    const cropKey = cropName.toLowerCase().trim();
    const conditions = CROP_CONDITIONS[cropKey] || DEFAULT_CONDITIONS;

    // Calculate days from planting
    const daysFromPlanting = plantedDate
        ? Math.floor((Date.now() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Weather Suitability Analysis
    const weatherSuitability = analyzeWeatherSuitability(weather, conditions);

    // Disease Risk Analysis
    const diseaseRisk = analyzeDiseaseRisk(weather, conditions);

    // Water Stress Analysis
    const waterStress = analyzeWaterStress(weather, conditions);

    // Pest Risk Analysis
    const pestRisk = analyzePestRisk(weather, conditions);

    // Growth Stage Analysis
    const growthStage = analyzeGrowthStage(daysFromPlanting, conditions);

    // Harvest Readiness
    const harvestReadiness = analyzeHarvestReadiness(daysFromPlanting, conditions);

    // Generate recommendations
    const recommendations = generateRecommendations(
        weather, conditions, weatherSuitability.status, diseaseRisk.level, waterStress.level
    );

    // Generate alerts
    const alerts = generateAlerts(weather, conditions, diseaseRisk, waterStress, harvestReadiness);

    // Calculate overall status
    const overallStatus = calculateOverallStatus(weatherSuitability.score, diseaseRisk.score);

    return {
        overallStatus,
        weatherSuitability,
        diseaseRisk,
        waterStress,
        pestRisk,
        growthStage,
        harvestReadiness,
        recommendations,
        alerts,
    };
}

function analyzeWeatherSuitability(
    weather: WeatherData,
    conditions: typeof DEFAULT_CONDITIONS
): CropHealthAnalysis['weatherSuitability'] {
    let score = 100;
    const issues: string[] = [];

    // Temperature check
    if (weather.temp < conditions.optimalTemp.min) {
        const diff = conditions.optimalTemp.min - weather.temp;
        score -= Math.min(diff * 5, 40);
        issues.push(`Temperature too low (${weather.temp}°C)`);
    } else if (weather.temp > conditions.optimalTemp.max) {
        const diff = weather.temp - conditions.optimalTemp.max;
        score -= Math.min(diff * 5, 40);
        issues.push(`Temperature too high (${weather.temp}°C)`);
    }

    // Humidity check
    if (weather.humidity < conditions.optimalHumidity.min) {
        const diff = conditions.optimalHumidity.min - weather.humidity;
        score -= Math.min(diff * 0.5, 20);
        issues.push(`Humidity too low (${weather.humidity}%)`);
    } else if (weather.humidity > conditions.optimalHumidity.max) {
        const diff = weather.humidity - conditions.optimalHumidity.max;
        score -= Math.min(diff * 0.5, 20);
        issues.push(`Humidity too high (${weather.humidity}%)`);
    }

    // Rainfall check
    if (weather.rainfall > conditions.maxRainfall) {
        score -= Math.min((weather.rainfall - conditions.maxRainfall) * 2, 30);
        issues.push(`Excessive rainfall (${weather.rainfall}mm)`);
    }

    // Wind check
    if (weather.windSpeed > 15) {
        score -= Math.min((weather.windSpeed - 15) * 2, 20);
        issues.push(`Strong winds (${weather.windSpeed} m/s)`);
    }

    score = Math.max(0, score);

    let status: CropHealthAnalysis['weatherSuitability']['status'];
    if (score >= 80) status = 'ideal';
    else if (score >= 60) status = 'favorable';
    else if (score >= 40) status = 'moderate';
    else if (score >= 20) status = 'unfavorable';
    else status = 'critical';

    const message = issues.length > 0
        ? `Current conditions: ${issues.join(', ')}`
        : 'Weather conditions are ideal for your crop!';

    return { status, score, message };
}

function analyzeDiseaseRisk(
    weather: WeatherData,
    conditions: typeof DEFAULT_CONDITIONS
): CropHealthAnalysis['diseaseRisk'] {
    let score = 0;
    const factors: string[] = [];
    const riskyDiseases: string[] = [];

    // Check each disease condition
    for (const disease of conditions.diseases) {
        const humidityMatch = weather.humidity >= disease.conditions.humidity - 10;
        const tempMatch = Math.abs(weather.temp - disease.conditions.temp) <= 5;

        if (humidityMatch && tempMatch) {
            score += 35;
            riskyDiseases.push(disease.name);
        } else if (humidityMatch || tempMatch) {
            score += 15;
        }
    }

    // High humidity increases disease risk
    if (weather.humidity > 85) {
        score += 20;
        factors.push('High humidity promotes fungal growth');
    }

    // Rain increases disease spread
    if (weather.rainfall > 10) {
        score += 15;
        factors.push('Rain can spread pathogens');
    }

    score = Math.min(100, score);

    let level: CropHealthAnalysis['diseaseRisk']['level'];
    if (score >= 70) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 25) level = 'moderate';
    else level = 'low';

    if (riskyDiseases.length > 0) {
        factors.unshift(`Risk of: ${riskyDiseases.join(', ')}`);
    }

    const recommendation = level === 'low'
        ? 'Continue regular monitoring'
        : level === 'moderate'
            ? 'Monitor closely and apply preventive measures'
            : 'Apply preventive fungicide and increase monitoring frequency';

    return { level, score, factors, recommendation };
}

function analyzeWaterStress(
    weather: WeatherData,
    conditions: typeof DEFAULT_CONDITIONS
): CropHealthAnalysis['waterStress'] {
    let level: CropHealthAnalysis['waterStress']['level'];
    let indicator: string;
    let action: string;

    const isHot = weather.temp > conditions.optimalTemp.max;
    const isDry = weather.humidity < conditions.optimalHumidity.min;
    const noRain = weather.rainfall < 2;

    if (isHot && isDry && noRain) {
        level = 'severe';
        indicator = 'High temperature, low humidity, no rainfall - severe water stress conditions';
        action = 'Irrigate immediately. Consider mulching to retain moisture. Water early morning or evening.';
    } else if ((isHot && isDry) || (isHot && noRain)) {
        level = 'high';
        indicator = 'Hot conditions with insufficient moisture';
        action = 'Increase irrigation frequency. Monitor for wilting.';
    } else if (isHot || (isDry && noRain)) {
        level = 'moderate';
        indicator = 'Moderate stress conditions detected';
        action = 'Maintain regular irrigation schedule. Check soil moisture.';
    } else if (isDry) {
        level = 'low';
        indicator = 'Slightly dry conditions';
        action = 'Continue normal watering. Monitor soil moisture levels.';
    } else {
        level = 'none';
        indicator = 'Adequate moisture levels';
        action = 'No additional irrigation needed at this time.';
    }

    return { level, indicator, action };
}

function analyzePestRisk(
    weather: WeatherData,
    conditions: typeof DEFAULT_CONDITIONS
): CropHealthAnalysis['pestRisk'] {
    const month = new Date().getMonth();
    const isMonsoon = month >= 5 && month <= 9; // June to October
    const isSummer = month >= 2 && month <= 5; // March to June
    const isWinter = month >= 10 || month <= 1; // November to February

    const currentSeason = isMonsoon ? 'monsoon' : isSummer ? 'summer' : 'winter';

    const activePests = conditions.pests.filter(pest =>
        pest.season === 'all' || pest.season === currentSeason
    );

    let level: CropHealthAnalysis['pestRisk']['level'];

    // High humidity and warm temps increase pest activity
    if (weather.humidity > 75 && weather.temp > 25) {
        level = activePests.length > 1 ? 'high' : 'moderate';
    } else if (weather.humidity > 60 && weather.temp > 20) {
        level = activePests.length > 0 ? 'moderate' : 'low';
    } else {
        level = 'low';
    }

    const pests = activePests.map(p => p.name);
    const prevention = level === 'high'
        ? 'Set up pheromone traps. Consider applying neem-based pesticides preventively.'
        : level === 'moderate'
            ? 'Regular scouting recommended. Keep field clean of crop residues.'
            : 'Maintain field hygiene. Monitor occasionally.';

    return { level, pests, prevention };
}

function analyzeGrowthStage(
    daysFromPlanting: number,
    conditions: typeof DEFAULT_CONDITIONS
): CropHealthAnalysis['growthStage'] {
    let currentStage = conditions.stages[0];
    let nextStage = conditions.stages[1];

    for (let i = 0; i < conditions.stages.length; i++) {
        if (daysFromPlanting >= conditions.stages[i].daysFromPlanting) {
            currentStage = conditions.stages[i];
            nextStage = conditions.stages[i + 1] || conditions.stages[i];
        }
    }

    const daysToNextMilestone = nextStage.daysFromPlanting - daysFromPlanting;

    return {
        stage: currentStage.name,
        daysFromPlanting,
        nextMilestone: nextStage.name,
        daysToNextMilestone: Math.max(0, daysToNextMilestone),
    };
}

function analyzeHarvestReadiness(
    daysFromPlanting: number,
    conditions: typeof DEFAULT_CONDITIONS
): CropHealthAnalysis['harvestReadiness'] {
    const daysToHarvest = Math.max(0, conditions.growthDays - daysFromPlanting);
    const isReady = daysFromPlanting >= conditions.growthDays * 0.9;

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToHarvest);

    return {
        isReady,
        daysToHarvest,
        estimatedDate: estimatedDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }),
    };
}

function generateRecommendations(
    weather: WeatherData,
    conditions: typeof DEFAULT_CONDITIONS,
    weatherStatus: string,
    diseaseLevel: string,
    waterLevel: string
): string[] {
    const recommendations: string[] = [];

    // Weather-based recommendations
    if (weather.temp > conditions.optimalTemp.max) {
        recommendations.push('Provide shade or use shade nets to protect from heat stress');
    }
    if (weather.temp < conditions.optimalTemp.min) {
        recommendations.push('Use mulching or row covers to protect from cold');
    }

    // Disease-based recommendations
    if (diseaseLevel === 'high' || diseaseLevel === 'critical') {
        recommendations.push('Apply preventive fungicide spray');
        recommendations.push('Ensure proper spacing between plants for air circulation');
    }

    // Water-based recommendations
    if (waterLevel === 'high' || waterLevel === 'severe') {
        recommendations.push('Irrigate immediately - use drip irrigation if available');
        recommendations.push('Apply organic mulch to conserve soil moisture');
    }

    // Humidity-based recommendations
    if (weather.humidity > 90) {
        recommendations.push('Avoid overhead irrigation to reduce fungal spread');
        recommendations.push('Improve field drainage if possible');
    }

    // Wind-based recommendations
    if (weather.windSpeed > 15) {
        recommendations.push('Provide windbreaks or support for tall plants');
    }

    // Rainfall recommendations
    if (weather.rainfall > 20) {
        recommendations.push('Check drainage systems to prevent waterlogging');
        recommendations.push('Postpone fertilizer application until rain subsides');
    }

    if (recommendations.length === 0) {
        recommendations.push('Continue regular crop management practices');
        recommendations.push('Monitor crop health daily during critical growth stages');
    }

    return recommendations;
}

function generateAlerts(
    weather: WeatherData,
    conditions: typeof DEFAULT_CONDITIONS,
    diseaseRisk: CropHealthAnalysis['diseaseRisk'],
    waterStress: CropHealthAnalysis['waterStress'],
    harvestReadiness: CropHealthAnalysis['harvestReadiness']
): CropHealthAnalysis['alerts'] {
    const alerts: CropHealthAnalysis['alerts'] = [];

    // Critical weather alerts
    if (weather.temp > 40) {
        alerts.push({ type: 'danger', message: 'Extreme heat warning! Immediate protective action needed.' });
    }
    if (weather.temp < 5) {
        alerts.push({ type: 'danger', message: 'Frost risk! Cover sensitive plants immediately.' });
    }
    if (weather.rainfall > 50) {
        alerts.push({ type: 'danger', message: 'Heavy rainfall alert! Check for waterlogging.' });
    }

    // Disease alerts
    if (diseaseRisk.level === 'critical') {
        alerts.push({ type: 'danger', message: `Critical disease risk: ${diseaseRisk.factors[0]}` });
    } else if (diseaseRisk.level === 'high') {
        alerts.push({ type: 'warning', message: `High disease risk detected. ${diseaseRisk.recommendation}` });
    }

    // Water stress alerts
    if (waterStress.level === 'severe') {
        alerts.push({ type: 'danger', message: 'Severe water stress! Irrigate immediately.' });
    } else if (waterStress.level === 'high') {
        alerts.push({ type: 'warning', message: waterStress.indicator });
    }

    // Harvest alerts
    if (harvestReadiness.isReady) {
        alerts.push({ type: 'info', message: `Crop is ready for harvest! Estimated date: ${harvestReadiness.estimatedDate}` });
    } else if (harvestReadiness.daysToHarvest <= 7 && harvestReadiness.daysToHarvest > 0) {
        alerts.push({ type: 'info', message: `Harvest approaching in ${harvestReadiness.daysToHarvest} days` });
    }

    return alerts;
}

function calculateOverallStatus(
    weatherScore: number,
    diseaseScore: number
): CropHealthAnalysis['overallStatus'] {
    // Invert disease score (higher disease risk = lower health)
    const healthScore = (weatherScore + (100 - diseaseScore)) / 2;

    if (healthScore >= 80) return 'excellent';
    if (healthScore >= 60) return 'good';
    if (healthScore >= 40) return 'moderate';
    if (healthScore >= 20) return 'poor';
    return 'critical';
}

export function getCropHealthStatusColor(status: CropHealthAnalysis['overallStatus']): string {
    switch (status) {
        case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
        case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'poor': return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'critical': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
}
