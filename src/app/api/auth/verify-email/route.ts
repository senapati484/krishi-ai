import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { sendVerificationCode } from '@/lib/emailVerification';

// Generate and send verification code
export async function POST (request: NextRequest) {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTPs for this user and email
    await OTP.deleteMany({ userId, email: email.toLowerCase() });

    // Create new OTP
    const otp = new OTP({
      userId,
      email: email.toLowerCase(),
      code,
      expiresAt,
    });

    await otp.save();

    // Update user email (if different)
    if (user.email !== email.toLowerCase()) {
      await User.updateOne(
        { _id: userId },
        { $set: { email: email.toLowerCase(), emailVerified: false } },
        { runValidators: false }
      );
    }

    // Send verification email
    try {
      await sendVerificationCode(email, code, user.language);
    } catch (emailError) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please check your email configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
    });
  } catch (error: unknown) {
    console.error('Error in POST verify-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send verification code', details: errorMessage },
      { status: 500 }
    );
  }
}

// Verify the code
export async function PUT (request: NextRequest) {
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

    // Validate code format (6 digits)
    const codeStr = String(code).trim();
    console.log(`[Email Verification] Attempting to verify code: ${codeStr} for user: ${userId}`);

    if (!/^\d{6}$/.test(codeStr)) {
      console.log(`[Email Verification] Invalid code format: ${codeStr}`);
      return NextResponse.json(
        { error: 'Invalid code format. Code must be 6 digits.' },
        { status: 400 }
      );
    }

    // Find the OTP with better error handling
    console.log(`[Email Verification] Searching for OTP with userId=${userId}, code=${codeStr}`);

    const otp = await OTP.findOne({
      userId,
      code: codeStr,
      expiresAt: { $gt: new Date() }, // Not expired
    }).sort({ createdAt: -1 }); // Get the most recent one

    console.log(`[Email Verification] OTP search result:`, otp ? 'FOUND' : 'NOT FOUND');

    if (!otp) {
      // Check if OTP exists but expired
      const expiredOtp = await OTP.findOne({ userId, code: codeStr });

      if (expiredOtp) {
        console.log(`[Email Verification] OTP found but EXPIRED. Expires at: ${expiredOtp.expiresAt}, Now: ${new Date()}`);
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      console.log(`[Email Verification] No OTP found with code ${codeStr}`);

      // List all OTPs for this user for debugging
      const allOtps = await OTP.find({ userId }).sort({ createdAt: -1 }).limit(5);
      console.log(`[Email Verification] Recent OTPs for user ${userId}:`, allOtps.map(o => ({
        code: o.code,
        expiresAt: o.expiresAt,
        isExpired: o.expiresAt < new Date()
      })));

      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    console.log(`✅ OTP verified for user ${userId}, email: ${otp.email}`);

    // Update user email and mark as verified
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          email: otp.email,
          emailVerified: true,
        },
      },
      { runValidators: false }
    );

    // Delete the used OTP
    await OTP.deleteOne({ _id: otp._id });

    // Fetch updated user
    const updatedUser = await User.findById(userId);

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    }

    const updatedUserData = updatedUser as any;
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: (updatedUserData?._id as any)?.toString() || updatedUserData?._id,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error: unknown) {
    console.error('Error in PUT verify-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to verify email', details: errorMessage },
      { status: 500 }
    );
  }
}
