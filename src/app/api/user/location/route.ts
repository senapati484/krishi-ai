import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Update user's last known location
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { userId, lat, lon } = body;

        if (!userId || !lat || !lon) {
            return NextResponse.json(
                { error: 'User ID, latitude, and longitude are required' },
                { status: 400 }
            );
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                lastLocation: {
                    lat,
                    lon,
                    updatedAt: new Date(),
                },
            },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            lastLocation: user.lastLocation,
        });
    } catch (error: unknown) {
        console.error('Error updating location:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to update location', details: errorMessage },
            { status: 500 }
        );
    }
}

