import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionStatic, setupFallbackApp } from "./production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Enhanced environment detection for deployment
    if (!process.env.NODE_ENV) {
      // Detect if we're in a production-like environment
      const isProduction = process.env.REPLIT_DEPLOYMENT || 
                          process.env.RAILWAY_DEPLOYMENT || 
                          process.env.VERCEL_ENV === 'production' ||
                          process.argv.includes('--production') ||
                          process.cwd().includes('/tmp/') ||
                          !process.stdout.isTTY;
      
      process.env.NODE_ENV = isProduction ? 'production' : 'development';
      log(`Environment auto-detected as: ${process.env.NODE_ENV}`, "startup");
    } else {
      log(`Environment set to: ${process.env.NODE_ENV}`, "startup");
    }

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${message}`, "error");
      res.status(status).json({ message });
      
      // Don't throw in production to prevent crashes
      if (process.env.NODE_ENV === "development") {
        throw err;
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      // Production mode - try multiple static file serving approaches
      let staticConfigured = false;
      
      try {
        serveStatic(app);
        staticConfigured = true;
        log("Static files configured for production", "production");
      } catch (staticError: unknown) {
        const errorMessage = staticError instanceof Error ? staticError.message : String(staticError);
        log(`Primary static file setup failed: ${errorMessage}`, "error");
        
        // Try alternative production static file setup
        try {
          staticConfigured = setupProductionStatic(app);
          if (staticConfigured) {
            log("Alternative static file configuration successful", "production");
          }
        } catch (fallbackError: unknown) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          log(`Fallback static file setup failed: ${fallbackMessage}`, "error");
        }
      }
      
      // If all static file approaches failed, setup fallback app
      if (!staticConfigured) {
        log("All static file configurations failed, setting up fallback app", "production");
        setupFallbackApp(app);
      }
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    
    // Handle uncaught exceptions before starting server
    process.on('uncaughtException', (error) => {
      log(`Uncaught Exception: ${error.message}`, "error");
      console.error(error);
      if (process.env.NODE_ENV === "production") {
        // In production, try to gracefully shutdown
        setTimeout(() => process.exit(1), 1000);
      } else {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "error");
      console.error(reason);
    });

    // Start server with error handling
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port} in ${process.env.NODE_ENV} mode`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Server cannot start.`, "error");
        console.error(`Error: Port ${port} is already in use`);
        process.exit(1);
      } else {
        log(`Server error: ${error.message}`, "error");
        console.error(error);
        process.exit(1);
      }
    });

  } catch (startupError: unknown) {
    const errorMessage = startupError instanceof Error ? startupError.message : String(startupError);
    log(`Startup error: ${errorMessage}`, "error");
    console.error("Failed to start server:", startupError);
    process.exit(1);
  }
})();
