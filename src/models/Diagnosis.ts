import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosis extends Document {
    userId: mongoose.Types.ObjectId;
    farmId?: mongoose.Types.ObjectId;
    imageUrl?: string;
    inputType: 'image' | 'voice' | 'text';
    inputData?: string; // voice transcript or text query

    // AI Analysis Results
    crop?: string;
    disease?: {
        name: string;
        scientificName?: string;
        confidence: number;
        severity: 'low' | 'moderate' | 'high' | 'critical';
    };

    // Advice
    advice?: {
        immediate: string[];
        treatment: Array<{
            type: 'organic' | 'chemical';
            name: string;
            dosage: string;
            cost: number;
            availability: string;
        }>;
        prevention: string[];
        expertConsultNeeded: boolean;
    };

    language: string;
    timestamp: Date;
    weather?: {
        temp?: number;
        humidity?: number;
        rainfall?: number;
    };
    // Disease progression tracking
    progressionId?: mongoose.Types.ObjectId; // Links related diagnoses
    treatmentEffectiveness?: {
        feedback: 'worked' | 'partial' | 'didnt_work' | null;
        feedbackDate?: Date;
        notes?: string;
    };
}

const DiagnosisSchema = new Schema<IDiagnosis>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    farmId: {
        type: Schema.Types.ObjectId,
        ref: 'Farm',
    },
    imageUrl: String,
    inputType: {
        type: String,
        enum: ['image', 'voice', 'text'],
        required: true,
    },
    inputData: String,
    crop: String,
    disease: {
        name: String,
        scientificName: String,
        confidence: Number,
        severity: {
            type: String,
            enum: ['low', 'moderate', 'high', 'critical'],
        },
    },
    advice: {
        immediate: [String],
        treatment: [{
            type: {
                type: String,
                enum: ['organic', 'chemical'],
            },
            name: String,
            dosage: String,
            cost: Number,
            availability: String,
        }],
        prevention: [String],
        expertConsultNeeded: Boolean,
    },
    language: {
        type: String,
        default: 'hi',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    weather: {
        temp: Number,
        humidity: Number,
        rainfall: Number,
    },
    progressionId: {
        type: Schema.Types.ObjectId,
        ref: 'Diagnosis',
    },
    treatmentEffectiveness: {
        feedback: {
            type: String,
            enum: ['worked', 'partial', 'didnt_work', null],
            default: null,
        },
        feedbackDate: Date,
        notes: String,
    },
});

export default mongoose.models.Diagnosis || mongoose.model<IDiagnosis>('Diagnosis', DiagnosisSchema);

