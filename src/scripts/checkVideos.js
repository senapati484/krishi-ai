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

async function checkVideos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const videos = await VideoTutorial.find({});
    console.log("\n=== Videos in Database ===\n");
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Language: ${video.language}`);
      console.log(`   URL: ${video.videoUrl}`);
      console.log(`   Thumbnail: ${video.thumbnailUrl}`);
      console.log(`   Duration: ${video.duration}s`);
      console.log(`   Views: ${video.views}, Likes: ${video.likes}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

checkVideos();
