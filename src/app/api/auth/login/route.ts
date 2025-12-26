import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token
    const userData = user as any;
    const token = generateToken((userData?._id as any)?.toString() || userData?._id);

    // Return user and token
    const userResponse = {
      id: (userData?._id as any)?.toString() || userData?._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      location: user.location,
      lastLocation: user.lastLocation,
      emailNotifications: user.emailNotifications,
      emailVerified: user.emailVerified ?? false, // Include email verification status
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
      token,
    });
  } catch (error: unknown) {
    console.error('Error in login API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to login', details: errorMessage },
      { status: 500 }
    );
  }
}

