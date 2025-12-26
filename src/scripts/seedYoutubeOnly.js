const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });

const videoTutorialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: { type: String, required: true },
  thumbnailUrl: String,
  language: { type: String, enum: ["en", "hi", "bn"], required: true },
  crop: String,
  disease: String,
  treatmentType: { type: String, enum: ["organic", "chemical", "prevention", "general"] },
  duration: Number,
  isCommunityUpload: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  uploadedBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const VideoTutorial = mongoose.models.VideoTutorial || mongoose.model("VideoTutorial", videoTutorialSchema);

const YOUTUBE_VIDEO = {
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
};

async function seedYoutubeOnly() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");
    
    // Clear existing videos
    console.log("Clearing existing videos...");
    const deleteResult = await VideoTutorial.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} documents`);
    
    // Insert YouTube video
    console.log("Inserting YouTube video...");
    const result = await VideoTutorial.create(YOUTUBE_VIDEO);
    console.log("✓ YouTube video inserted successfully");
    console.log(`  Title: ${result.title}`);
    console.log(`  URL: ${result.videoUrl}`);
    console.log(`  Language: ${result.language}`);

    const total = await VideoTutorial.countDocuments();
    console.log(`\n✓ Total videos in database: ${total}`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedYoutubeOnly();
