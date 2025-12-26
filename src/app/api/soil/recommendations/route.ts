import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoilTest from '@/models/SoilTest';
import Diagnosis from '@/models/Diagnosis';
import { analyzeSoilHealth } from '@/lib/soilHealth';

// GET - Get crop recommendations based on soil + disease history
export async function GET (request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const farmId = searchParams.get('farmId');
        const language = searchParams.get('language') || 'hi';

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get latest soil test
        const query: Record<string, string> = { userId };
        if (farmId) {
            query.farmId = farmId;
        }

        const latestSoilTest = await SoilTest.findOne(query)
            .sort({ testDate: -1 })
            .lean();

        if (!latestSoilTest) {
            return NextResponse.json(
                { error: 'No soil test found. Please add a soil test first.' },
                { status: 404 }
            );
        }

        // Get disease history
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const diseaseHistory = await Diagnosis.find({
            userId,
            ...(farmId && { farmId }),
            timestamp: { $gte: sixMonthsAgo },
        }).sort({ timestamp: -1 }).limit(20);

        // Analyze and get recommendations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const analysis = await analyzeSoilHealth(latestSoilTest as any, diseaseHistory, language);

        return NextResponse.json({
            success: true,
            recommendations: analysis.recommendations,
            improvements: analysis.improvements,
            overallHealth: analysis.overallHealth,
            summary: analysis.summary,
        });
    } catch (error: unknown) {
        console.error('Error getting soil recommendations:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to get recommendations', details: errorMessage },
            { status: 500 }
        );
    }
}

