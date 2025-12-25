require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { CosmosClient } = require("@azure/cosmos");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
});

// ===============================
// Azure Blob Storage Setup
// ===============================
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerName = "files";

// ===============================
// Azure Cosmos DB Setup
// ===============================
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_URI,
  key: process.env.COSMOS_DB_KEY,
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
const container = database.container(process.env.COSMOS_DB_CONTAINER);

// ===============================
// Health Check API
// ===============================
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// ===============================
// Upload File API
// ===============================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create unique filename to avoid overwrite
    const uniqueFileName = `${Date.now()}-${req.file.originalname}`;

    // Upload to Azure Blob Storage
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(uniqueFileName);

    await blobClient.uploadData(req.file.buffer);

    // Metadata for Cosmos DB
    const metadata = {
      id: Date.now().toString(),
      fileName: uniqueFileName,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      description: description || "",
      blobUrl: blobClient.url,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "demo-user",
    };

    await container.items.create(metadata);

    res.status(200).json({
      message: "File uploaded & metadata saved",
      metadata,
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
});

// ===============================
// Get Uploaded Files API
// ===============================
app.get("/files", async (req, res) => {
  try {
    const { resources } = await container.items
      .query("SELECT * FROM c ORDER BY c.uploadedAt DESC")
      .fetchAll();

    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch files",
      error: error.message,
    });
  }
});

// ===============================
// Server Start (Azure Compatible)
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
