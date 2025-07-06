const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number },        // Size in bytes
  duration: { type: Number },    // Duration in seconds
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true,
  },
  captionsReady: { type: Boolean, default: false },
});

module.exports = mongoose.model("Video", videoSchema);
