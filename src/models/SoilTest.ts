import mongoose, { Schema, Document } from 'mongoose';

export interface ISoilTest extends Document {
  userId: mongoose.Types.ObjectId;
  farmId?: mongoose.Types.ObjectId;
  testDate: Date;
  pH: number;
  nitrogen?: number; // in kg/ha
  phosphorus?: number; // in kg/ha
  potassium?: number; // in kg/ha
  organicMatter?: number; // percentage
  moisture?: number; // percentage
  texture?: 'sandy' | 'loamy' | 'clay' | 'silty';
  notes?: string;
  recommendations?: string[];
  createdAt: Date;
}

const SoilTestSchema = new Schema<ISoilTest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  farmId: {
    type: Schema.Types.ObjectId,
    ref: 'Farm',
  },
  testDate: {
    type: Date,
    default: Date.now,
  },
  pH: {
    type: Number,
    required: true,
    min: 0,
    max: 14,
  },
  nitrogen: Number,
  phosphorus: Number,
  potassium: Number,
  organicMatter: Number,
  moisture: Number,
  texture: {
    type: String,
    enum: ['sandy', 'loamy', 'clay', 'silty'],
  },
  notes: String,
  recommendations: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SoilTest || mongoose.model<ISoilTest>('SoilTest', SoilTestSchema);


