import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Diagnosis from '@/models/Diagnosis';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const diagnoses = await Diagnosis.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Calculate basic stats
    const stats = {
      total: diagnoses.length,
      diseases: diagnoses
        .filter((d) => d.disease)
        .map((d) => d.disease?.name)
        .reduce((acc: Record<string, number>, name) => {
          if (name) {
            acc[name] = (acc[name] || 0) + 1;
          }
          return acc;
        }, {}),
      mostCommonDisease: Object.entries(
        diagnoses
          .filter((d) => d.disease)
          .reduce((acc: Record<string, number>, d) => {
            const name = d.disease?.name || 'Unknown';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
          }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    };

    return NextResponse.json({
      success: true,
      diagnoses: diagnoses.map((d) => ({
        id: d._id,
        crop: d.crop,
        disease: d.disease,
        inputType: d.inputType,
        timestamp: d.timestamp,
        severity: d.disease?.severity,
      })),
      stats,
    });
  } catch (error: unknown) {
    console.error('Error in history API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch history', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET single diagnosis by ID
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { diagnosisId } = body;

    if (!diagnosisId) {
      return NextResponse.json({ error: 'Diagnosis ID is required' }, { status: 400 });
    }

    const diagnosis = await Diagnosis.findById(diagnosisId).lean() as any;

    if (!diagnosis) {
      return NextResponse.json({ error: 'Diagnosis not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      diagnosis: {
        id: diagnosis?._id?.toString() || diagnosis?._id,
        crop: diagnosis.crop,
        disease: diagnosis.disease,
        advice: diagnosis.advice,
        inputType: diagnosis.inputType,
        inputData: diagnosis.inputData,
        imageUrl: diagnosis.imageUrl,
        timestamp: diagnosis.timestamp,
        weather: diagnosis.weather,
      },
    });
  } catch (error: unknown) {
    console.error('Error in POST history API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch diagnosis', details: errorMessage },
      { status: 500 }
    );
  }
}

