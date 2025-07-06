const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const folderRoutes = require("./routes/folderRoutes");
const videoRoutes = require("./routes/videoRoutes");

app.use(cors({ 
    // origin:"http://localhost:3000",
   origin:process.env.FRONT_API,
    methods:["GET","POST","PUT","DELETE"],
    credentials: true
  }
));

app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

app.use("/api/folders", folderRoutes); // must match frontend
app.use("/api/videos", videoRoutes);   // must match frontend

// Serve uploads publicly
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.log(err));
