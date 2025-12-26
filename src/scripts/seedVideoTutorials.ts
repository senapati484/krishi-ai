import mongoose from "mongoose";
import "dotenv/config";
import VideoTutorial from "@/models/VideoTutorial";
import connectDB from "@/lib/mongodb";

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
        title: "धाने पर पटुआ रोग की रोकथाम",
        description: "धान के पत्तों पर पटुआ रोग पहचानें और उपचार करें।",
        videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
        language: "hi",
        crop: "rice",
        disease: "Leaf Blight",
        treatmentType: "chemical",
        duration: 110,
        isCommunityUpload: false,
        views: 800,
        likes: 150,
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
        views: 820,
        likes: 160,
    },
    {
        title: "गेहूं में रतुआ रोग की रोकथाम",
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

async function seed() {
    try {
        await connectDB();

        const existing = await VideoTutorial.countDocuments();
        if (existing === 0) {
            await VideoTutorial.insertMany(DEMO_VIDEOS);
            console.log(`Inserted ${DEMO_VIDEOS.length} demo videos.`);
        } else {
            console.log(`Skipped insert; collection already has ${existing} docs.`);
        }

        const total = await VideoTutorial.countDocuments();
        console.log(`Total videos: ${total}`);
    } catch (error) {
        console.error("Seed failed:", error);
    } finally {
        await mongoose.connection.close();
    }
}

seed();
