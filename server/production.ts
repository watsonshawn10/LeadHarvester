import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { log } from "./vite";

/**
 * Alternative static file serving for production deployment
 * This provides fallback options when the main serveStatic function fails
 */
export function setupProductionStatic(app: Express): boolean {
  // Try multiple possible paths for production deployment
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "public")
  ];

  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      log(`Found static files at: ${distPath}`, "production");
      break;
    }
  }

  if (!distPath) {
    log(`No static files found. Searched paths: ${possiblePaths.join(", ")}`, "error");
    return false;
  }

  // Verify index.html exists
  const indexPath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    log(`Index.html not found at: ${indexPath}`, "error");
    return false;
  }

  // Setup static file serving
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    etag: true,
    index: false // Disable automatic index.html serving
  }));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }

    try {
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`Error serving index.html: ${err.message}`, "error");
          res.status(500).json({ message: "Failed to serve application" });
        }
      });
    } catch (error) {
      log(`Unexpected error serving index.html: ${error}`, "error");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  log("Production static file serving configured successfully", "production");
  return true;
}

/**
 * Create a minimal fallback application when static files are not available
 */
export function setupFallbackApp(app: Express) {
  log("Setting up fallback application - static files not available", "production");
  
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(503).json({ 
        message: "Service temporarily unavailable - application is starting up",
        retry: "Please try again in a few moments"
      });
    }

    // Serve a minimal HTML page for non-API routes
    const fallbackHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskNab - Starting Up</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 40px 20px; 
            background: #f9fafb; 
            color: #374151;
            text-align: center;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 { color: #1f2937; margin-bottom: 16px; }
        p { color: #6b7280; line-height: 1.6; }
        .retry-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        .retry-btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>TaskNab is Starting Up</h1>
        <p>Our application is currently initializing. This usually takes just a few moments.</p>
        <p>If this message persists, please try refreshing the page or contact support.</p>
        <button class="retry-btn" onclick="window.location.reload()">Refresh Page</button>
    </div>
    <script>
        // Auto-refresh after 10 seconds
        setTimeout(() => window.location.reload(), 10000);
    </script>
</body>
</html>`;

    res.status(503).send(fallbackHTML);
  });
}