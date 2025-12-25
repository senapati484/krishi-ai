import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    length: 6,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired OTPs
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for faster lookups
OTPSchema.index({ userId: 1, email: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

