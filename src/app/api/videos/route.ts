import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoTutorial from '@/models/VideoTutorial';

// GET - Get videos by crop, disease, language, etc.
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get('crop');
    const disease = searchParams.get('disease');
    const language = searchParams.get('language') || 'hi';
    const treatmentType = searchParams.get('treatmentType');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { language };
    if (crop) query.crop = crop;
    if (disease) query.disease = disease;
    if (treatmentType) query.treatmentType = treatmentType;

    const videos = await VideoTutorial.find(query)
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .lean() as any[];

    return NextResponse.json({
      success: true,
      videos: videos.map(video => ({
        id: (video?._id as any)?.toString() || video?._id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        language: video.language,
        crop: video.crop,
        disease: video.disease,
        treatmentType: video.treatmentType,
        duration: video.duration,
        views: video.views,
        likes: video.likes,
        isCommunityUpload: video.isCommunityUpload,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching videos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch videos', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Upload a video (community or admin)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      language,
      crop,
      disease,
      treatmentType,
      duration,
      uploadedBy,
      isCommunityUpload = false,
    } = body;

    if (!title || !videoUrl || !language) {
      return NextResponse.json(
        { error: 'Title, video URL, and language are required' },
        { status: 400 }
      );
    }

    const video = new VideoTutorial({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      language,
      crop,
      disease,
      treatmentType,
      duration,
      uploadedBy,
      isCommunityUpload,
    });

    await video.save();

    return NextResponse.json({
      success: true,
      video: {
        id: (video?._id as any)?.toString() || video?._id,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        language: video.language,
        crop: video.crop,
        disease: video.disease,
        treatmentType: video.treatmentType,
      },
    });
  } catch (error: unknown) {
    console.error('Error uploading video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload video', details: errorMessage },
      { status: 500 }
    );
  }
}


