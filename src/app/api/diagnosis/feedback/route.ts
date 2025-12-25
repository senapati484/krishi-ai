import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Diagnosis from '@/models/Diagnosis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { diagnosisId, feedback, notes } = body;

    if (!diagnosisId || !feedback) {
      return NextResponse.json(
        { error: 'Diagnosis ID and feedback are required' },
        { status: 400 }
      );
    }

    const diagnosis = await Diagnosis.findByIdAndUpdate(
      diagnosisId,
      {
        treatmentEffectiveness: {
          feedback,
          feedbackDate: new Date(),
          notes,
        },
      },
      { new: true }
    );

    if (!diagnosis) {
      return NextResponse.json(
        { error: 'Diagnosis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: unknown) {
    console.error('Error submitting feedback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to submit feedback', details: errorMessage },
      { status: 500 }
    );
  }
}

