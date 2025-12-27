import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Diagnosis from '@/models/Diagnosis';
import User from '@/models/User';
import { analyzeCropImage, generateAdvice, processVoiceQuery } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { image, voiceTranscript, textQuery, userId, inputType, language = 'hi' } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let analysisResult;
        let adviceResult;
        const imageUrl = '';

        if (inputType === 'image' && image) {
            // Process image
            const base64Data = image.split(',')[1] || image;
            analysisResult = await analyzeCropImage(base64Data);

            // Guard: if not a crop / unknown image, reject with clear message
            const cropName = analysisResult?.crop?.toString().trim().toLowerCase();
            if (!cropName || cropName === 'unknown' || cropName === 'not a crop') {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            'Image not recognized as a crop. I am trained only for crop diagnosis. Please upload a clear photo of the affected crop.',
                    },
                    { status: 400 }
                );
            }

            // Generate advice based on analysis
            adviceResult = await generateAdvice(
                analysisResult,
                user.location,
                language || user.language,
                getCurrentSeason()
            );
        } else if (inputType === 'voice' && voiceTranscript) {
            // Process voice query
            const voiceAnalysis = await processVoiceQuery(voiceTranscript, language || user.language);

            // For voice queries, we might need an image or can provide general advice
            analysisResult = {
                crop: voiceAnalysis.crop || 'Unknown',
                disease: null,
                symptoms: [],
            };

            // Generate general advice based on query
            if (voiceAnalysis.needsImage) {
                adviceResult = {
                    immediate: ['कृपया अपनी फसल की तस्वीर अपलोड करें (Please upload a photo of your crop)'],
                    treatment: [],
                    prevention: [],
                    expertConsultNeeded: false,
                };
            } else {
                adviceResult = await generateAdvice(
                    analysisResult,
                    user.location,
                    language || user.language,
                    getCurrentSeason()
                );
            }
        } else if (inputType === 'text' && textQuery) {
            // Process text query
            const textAnalysis = await processVoiceQuery(textQuery, language || user.language);

            analysisResult = {
                crop: textAnalysis.crop || 'Unknown',
                disease: null,
                symptoms: [],
            };

            adviceResult = await generateAdvice(
                analysisResult,
                user.location,
                language || user.language,
                getCurrentSeason()
            );
        } else {
            return NextResponse.json({ error: 'Invalid input type or missing data' }, { status: 400 });
        }

        // Check if this is a follow-up diagnosis (same crop + disease)
        let progressionId = null;
        if (analysisResult.disease) {
            const existingDiagnosis = await Diagnosis.findOne({
                userId,
                crop: analysisResult.crop,
                'disease.name': analysisResult.disease.name,
            }).sort({ timestamp: -1 });

            if (existingDiagnosis) {
                // Link to existing progression
                progressionId = existingDiagnosis.progressionId || existingDiagnosis._id;
            }
        }

        // Save diagnosis to database
        const diagnosis = new Diagnosis({
            userId,
            imageUrl,
            inputType,
            inputData: voiceTranscript || textQuery || '',
            crop: analysisResult.crop,
            disease: analysisResult.disease,
            advice: adviceResult,
            language: language || user.language,
            timestamp: new Date(),
            progressionId,
        });

        await diagnosis.save();

        // If this is the first diagnosis in a progression, set it as the root
        if (!diagnosis.progressionId && analysisResult.disease) {
            diagnosis.progressionId = diagnosis._id;
            await diagnosis.save();
        }

        const diagnosisData = diagnosis as any;
        return NextResponse.json({
            success: true,
            diagnosis: {
                id: (diagnosisData?._id as any)?.toString() || diagnosisData?._id,
                crop: analysisResult.crop,
                disease: analysisResult.disease,
                advice: adviceResult,
                symptoms: analysisResult.symptoms,
                affectedArea: analysisResult.affectedArea,
                timestamp: diagnosis.timestamp,
                progressionId: diagnosisData.progressionId?.toString() || (diagnosisData?._id as any)?.toString() || diagnosisData?._id,
            },
        });
    } catch (error: unknown) {
        console.error('Error in diagnose API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to process diagnosis', details: errorMessage },
            { status: 500 }
        );
    }
}

function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'Summer';
    if (month >= 6 && month <= 9) return 'Monsoon';
    if (month >= 10 && month <= 11) return 'Autumn';
    return 'Winter';
}

