import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  language: 'hi' | 'bn' | 'en';
  location?: {
    village?: string;
    district?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  lastLocation?: {
    lat: number;
    lon: number;
    updatedAt: Date;
  };
  emailNotifications?: boolean;
  emailVerified?: boolean;
  emailVerificationCode?: string;
  emailVerificationCodeExpiry?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  language: {
    type: String,
    enum: ['hi', 'bn', 'en'],
    default: 'hi',
  },
  location: {
    village: String,
    district: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  lastLocation: {
    lat: Number,
    lon: Number,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationCode: String,
  emailVerificationCodeExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

