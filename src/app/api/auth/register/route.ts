import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, phone, language } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      language: language || 'hi',
      emailNotifications: true,
    });

    await user.save();

    // Return user without password
    const userData = user as any;
    const userResponse = {
      id: (userData?._id as any)?.toString() || userData?._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      location: user.location,
      lastLocation: user.lastLocation,
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error: unknown) {
    console.error('Error in register API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to register user', details: errorMessage },
      { status: 500 }
    );
  }
}

