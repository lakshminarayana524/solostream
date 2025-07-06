//models/Folder
const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video"
    }
  ]
});

module.exports = mongoose.model("Folder", folderSchema);
