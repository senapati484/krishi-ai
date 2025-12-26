const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/krishi-ai");

// Define the schema and model
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

// YouTube Video - Only one demo video
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
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/krishi-ai");
    console.log("Connected to MongoDB");

    const existing = await VideoTutorial.countDocuments();

    if (existing === 0) {
      console.log("Inserting demo videos...");
      await VideoTutorial.insertMany(DEMO_VIDEOS);
      console.log(`Inserted ${DEMO_VIDEOS.length} demo videos.`);
    } else {
      console.log(`Skipping insert; collection already has ${existing} documents.`);
    }

    const total = await VideoTutorial.countDocuments();
    console.log(`Total videos in database: ${total}`);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seed();
