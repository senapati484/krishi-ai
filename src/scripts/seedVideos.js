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
    videoUrl: "https://sample-vribbon.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
    language: "bn",
    crop: "rice",
    disease: "Leaf Blight",
    treatmentType: "chemical",
    duration: 110,
    isCommunityUpload: false,
    views: 800,
    likes: 150,
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
