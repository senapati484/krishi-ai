import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Farm from '@/models/Farm';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const farm = await Farm.findOne({ userId });

    return NextResponse.json({
      success: true,
      farm: farm || null,
    });
  } catch (error: unknown) {
    console.error('Error fetching farm:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch farm', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, crop } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let farm = await Farm.findOne({ userId });

    if (!farm) {
      farm = new Farm({
        userId,
        crops: crop ? [crop] : [],
      });
    } else if (crop) {
      farm.crops = farm.crops || [];
      farm.crops.push(crop);
    }

    await farm.save();

    return NextResponse.json({
      success: true,
      farm,
      crop: crop || null,
    });
  } catch (error: unknown) {
    console.error('Error saving farm:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to save farm', details: errorMessage },
      { status: 500 }
    );
  }
}

