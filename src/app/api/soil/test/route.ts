import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoilTest from '@/models/SoilTest';
import Diagnosis from '@/models/Diagnosis';
import { analyzeSoilHealth } from '@/lib/soilHealth';

// POST - Add soil test result
export async function POST (request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, farmId, pH, nitrogen, phosphorus, potassium, organicMatter, moisture, texture, notes } = body;

    if (!userId || !pH) {
      return NextResponse.json(
        { error: 'User ID and pH are required' },
        { status: 400 }
      );
    }

    // Get disease history for this user/farm
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const diseaseHistory = await Diagnosis.find({
      userId,
      ...(farmId && { farmId }),
      timestamp: { $gte: sixMonthsAgo },
    }).sort({ timestamp: -1 }).limit(20);

    // Create soil test record
    const soilTest = new SoilTest({
      userId,
      farmId,
      pH,
      nitrogen,
      phosphorus,
      potassium,
      organicMatter,
      moisture,
      texture,
      notes,
      testDate: new Date(),
    });

    await soilTest.save();

    // Analyze soil health with AI
    const analysis = await analyzeSoilHealth(soilTest, diseaseHistory, body.language || 'hi');

    // Update soil test with recommendations
    soilTest.recommendations = [
      ...analysis.recommendations.map(r => `${r.crop}: ${r.reason}`),
      ...analysis.improvements.map(i => i.action),
    ];
    await soilTest.save();

    const soilTestData = soilTest as any;
    return NextResponse.json({
      success: true,
      soilTest: {
        id: (soilTestData?._id as any)?.toString() || soilTestData?._id,
        pH: soilTest.pH,
        nitrogen: soilTest.nitrogen,
        phosphorus: soilTest.phosphorus,
        potassium: soilTest.potassium,
        organicMatter: soilTest.organicMatter,
        moisture: soilTest.moisture,
        texture: soilTest.texture,
        testDate: soilTest.testDate,
        recommendations: soilTest.recommendations,
      },
      analysis,
    });
  } catch (error: unknown) {
    console.error('Error in soil test API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process soil test', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Get soil test history
export async function GET (request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const farmId = searchParams.get('farmId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const query: any = { userId };
    if (farmId) {
      query.farmId = farmId;
    }

    const soilTests = await SoilTest.find(query)
      .sort({ testDate: -1 })
      .limit(10)
      .lean() as any[];

    return NextResponse.json({
      success: true,
      soilTests: soilTests.map(test => ({
        id: (test?._id as any)?.toString() || test?._id,
        pH: test.pH,
        nitrogen: test.nitrogen,
        phosphorus: test.phosphorus,
        potassium: test.potassium,
        organicMatter: test.organicMatter,
        moisture: test.moisture,
        texture: test.texture,
        testDate: test.testDate,
        recommendations: test.recommendations,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching soil tests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch soil tests', details: errorMessage },
      { status: 500 }
    );
  }
}

