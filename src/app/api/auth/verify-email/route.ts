import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationCode } from '@/lib/emailVerification';

// Generate and send verification code
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    // Update user with verification code
    user.email = email.toLowerCase();
    user.emailVerificationCode = code;
    user.emailVerificationCodeExpiry = expiry;
    user.emailVerified = false;
    await user.save();

    // Send verification email
    try {
      await sendVerificationCode(email, code, user.language);
      console.log(`✅ Verification code sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      // In development, always include code even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
        return NextResponse.json({
          success: true,
          message: 'Verification code generated (email failed, see console)',
          code, // Include code in dev mode even if email fails
        });
      }
      // In production, fail if email can't be sent
      return NextResponse.json(
        { 
          error: 'Failed to send verification email. Please check your email configuration.',
          details: emailError instanceof Error ? emailError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
      // In development, include code for testing
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
  } catch (error: unknown) {
    console.error('Error sending verification code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send verification code', details: errorMessage },
      { status: 500 }
    );
  }
}

// Verify the code
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and code are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if code matches and is not expired
    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== code
    ) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (
      !user.emailVerificationCodeExpiry ||
      new Date() > user.emailVerificationCodeExpiry
    ) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: unknown) {
    console.error('Error verifying email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to verify email', details: errorMessage },
      { status: 500 }
    );
  }
}

