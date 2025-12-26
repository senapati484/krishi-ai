import mongoose, { Schema, Document } from 'mongoose';

export interface IFarm extends Document {
  userId: mongoose.Types.ObjectId;
  farmSize?: number; // in acres
  crops?: Array<{
    name: string;
    plantedDate?: Date;
    variety?: string;
    status?: 'healthy' | 'monitoring' | 'diseased';
    lastCheck?: Date;
  }>;
  soilType?: string;
  irrigationType?: string;
  createdAt: Date;
}

const FarmSchema = new Schema<IFarm>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  farmSize: Number,
  crops: [{
    name: String,
    plantedDate: Date,
    variety: String,
    status: {
      type: String,
      enum: ['healthy', 'monitoring', 'diseased'],
      default: 'healthy',
    },
    lastCheck: Date,
  }],
  soilType: String,
  irrigationType: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Farm || mongoose.model<IFarm>('Farm', FarmSchema);

