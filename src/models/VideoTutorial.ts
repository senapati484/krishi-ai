import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoTutorial extends Document {
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    language: 'hi' | 'bn' | 'en';
    crop?: string;
    disease?: string;
    treatmentType?: 'organic' | 'chemical' | 'prevention' | 'general';
    duration?: number; // in seconds
    uploadedBy?: mongoose.Types.ObjectId; // User ID if community uploaded
    isCommunityUpload: boolean;
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

const VideoTutorialSchema = new Schema<IVideoTutorial>({
    title: {
        type: String,
        required: true,
    },
    description: String,
    videoUrl: {
        type: String,
        required: true,
    },
    thumbnailUrl: String,
    language: {
        type: String,
        enum: ['hi', 'bn', 'en'],
        required: true,
    },
    crop: String,
    disease: String,
    treatmentType: {
        type: String,
        enum: ['organic', 'chemical', 'prevention', 'general'],
    },
    duration: Number,
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isCommunityUpload: {
        type: Boolean,
        default: false,
    },
    views: {
        type: Number,
        default: 0,
    },
    likes: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.VideoTutorial || mongoose.model<IVideoTutorial>('VideoTutorial', VideoTutorialSchema);


