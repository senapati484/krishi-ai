import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import VideoTutorial from "@/models/VideoTutorial";

const DEMO_VIDEOS = [
    {
        title: "Tomato Early Blight - Quick Remedy",
        description: "Identify early blight and apply copper fungicide safely.",
        videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
        language: "en",
        crop: "tomato",
        disease: "Early Blight",
        treatmentType: "organic",
        duration: 95,
        isCommunityUpload: false,
        views: 1200,
        likes: 230,
    },
    {
        title: "ধানে পাতাজ্বলা রোগ প্রতিকার",
        description: "ধানের পাতাজ্বলা দ্রুত শনাক্ত ও প্রতিকার পদ্ধতি।",
        videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
        language: "bn",
        crop: "rice",
        disease: "Leaf Blight",
        treatmentType: "chemical",
        duration: 110,
        isCommunityUpload: false,
        views: 800,
        likes: 150,
    },
    {
        title: "गेहूँ में रतुआ रोग की रोकथाम",
        description: "रस्ट रोग पहचानें और बचाव के सरल तरीके।",
        videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0",
        language: "hi",
        crop: "wheat",
        disease: "Rust",
        treatmentType: "prevention",
        duration: 130,
        isCommunityUpload: true,
        views: 640,
        likes: 120,
    },
];

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CRON_SECRET || process.env.SEED_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        const existing = await VideoTutorial.countDocuments();
        if (existing === 0) {
            await VideoTutorial.insertMany(DEMO_VIDEOS);
        }

        const videos = await VideoTutorial.find({}).sort({ createdAt: -1 }).limit(20).lean();

        return NextResponse.json({ success: true, inserted: existing === 0 ? DEMO_VIDEOS.length : 0, total: videos.length, videos });
    } catch (error: unknown) {
        console.error("Error seeding videos:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to seed videos", details: message }, { status: 500 });
    }
}
