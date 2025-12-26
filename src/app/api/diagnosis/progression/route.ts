import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Diagnosis from '@/models/Diagnosis';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const progressionId = searchParams.get('progressionId');

    if (!progressionId) {
      return NextResponse.json(
        { error: 'Progression ID is required' },
        { status: 400 }
      );
    }

    // Convert string ID to ObjectId
    let progressionObjectId;
    try {
      progressionObjectId = new mongoose.Types.ObjectId(progressionId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid progression ID' },
        { status: 400 }
      );
    }

    // Get all diagnoses in this progression
    const diagnoses = await Diagnosis.find({
      $or: [
        { _id: progressionObjectId },
        { progressionId: progressionObjectId },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = diagnoses.map((d: any) => ({
      id: d._id.toString(),
      date: d.timestamp,
      imageUrl: d.imageUrl,
      severity: d.disease?.severity || 'low',
      notes: d.inputData,
    }));

    return NextResponse.json({
      success: true,
      entries,
    });
  } catch (error: unknown) {
    console.error('Error fetching progression:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch progression', details: errorMessage },
      { status: 500 }
    );
  }
}

