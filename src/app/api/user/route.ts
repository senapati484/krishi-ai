import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import Farm from '@/models/Farm';

// GET user by ID or create new user
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const farm = await Farm.findOne({ userId: user._id });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                language: user.language,
                location: user.location,
                lastLocation: user.lastLocation,
                emailNotifications: user.emailNotifications,
                emailVerified: user.emailVerified,
                farm: farm ? {
                    farmSize: farm.farmSize,
                    crops: farm.crops,
                    soilType: farm.soilType,
                    irrigationType: farm.irrigationType,
                } : null,
            },
        });
    } catch (error: unknown) {
        console.error('Error in GET user API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch user', details: errorMessage },
            { status: 500 }
        );
    }
}

// POST - Create or update user
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { id, name, phone, language, location, farm, lastLocation, emailNotifications } = body;

        let user;
        if (id) {
            // Get current user to preserve emailVerified status
            const currentUser = await User.findById(id);
            if (!currentUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            
            // Update existing user
            const updateData: Partial<IUser> = {
                name,
                phone,
                language,
                location,
                // CRITICAL: Preserve emailVerified status - never overwrite it to false
                // Only update if it's explicitly true, otherwise keep existing value
                emailVerified: currentUser.emailVerified !== undefined ? currentUser.emailVerified : false,
            };

            // Update lastLocation if provided
            if (lastLocation && lastLocation.lat && lastLocation.lon) {
                updateData.lastLocation = {
                    lat: lastLocation.lat,
                    lon: lastLocation.lon,
                    updatedAt: new Date(),
                };
            }

            // Update email notifications preference
            if (emailNotifications !== undefined) {
                updateData.emailNotifications = emailNotifications;
            }

            user = await User.findByIdAndUpdate(id, updateData, { new: true });
        } else {
            // Create new user (should use register endpoint, but keeping for backward compatibility)
            user = new User({
                name: name || 'Farmer',
                phone,
                language: language || 'hi',
                location,
            });
            if (lastLocation && lastLocation.lat && lastLocation.lon) {
                user.lastLocation = {
                    lat: lastLocation.lat,
                    lon: lastLocation.lon,
                    updatedAt: new Date(),
                };
            }
            await user.save();
        }

        // Update or create farm
        if (farm && user) {
            await Farm.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    farmSize: farm.farmSize,
                    crops: farm.crops,
                    soilType: farm.soilType,
                    irrigationType: farm.irrigationType,
                },
                { upsert: true, new: true }
            );
        }

        // Fetch fresh user to ensure we have latest emailVerified status
        const updatedUser = await User.findById(user._id);
        
        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser?._id || user._id,
                name: updatedUser?.name || user.name,
                email: updatedUser?.email || user.email,
                phone: updatedUser?.phone || user.phone,
                language: updatedUser?.language || user.language,
                location: updatedUser?.location || user.location,
                lastLocation: updatedUser?.lastLocation || user.lastLocation,
                emailNotifications: updatedUser?.emailNotifications ?? user.emailNotifications,
                emailVerified: updatedUser?.emailVerified ?? user.emailVerified ?? false,
            },
        });
    } catch (error: unknown) {
        console.error('Error in POST user API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to save user', details: errorMessage },
            { status: 500 }
        );
    }
}

