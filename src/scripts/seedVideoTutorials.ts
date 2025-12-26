import mongoose from "mongoose";
import "dotenv/config";
import VideoTutorial from "../models/VideoTutorial";
import connectDB from "../lib/mongodb";

const DEMO_VIDEOS = [
    {
        title: "Sustainable Farming Techniques - Complete Guide",
        description: "Learn modern sustainable farming practices that improve crop yield while protecting the environment. This comprehensive guide covers crop rotation, organic composting, water management, integrated pest management, soil health improvement, and eco-friendly farming techniques. Perfect for farmers looking to increase productivity while maintaining sustainability.",
        videoUrl: "https://www.youtube.com/embed/gE-JOlfwIeo",
        thumbnailUrl: "https://img.youtube.com/vi/gE-JOlfwIeo/maxresdefault.jpg",
        language: "en",
        crop: "general",
        disease: "general",
        treatmentType: "prevention",
        duration: 840,
        isCommunityUpload: false,
        views: 5420,
        likes: 892,
    },
];

async function seed () {
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
