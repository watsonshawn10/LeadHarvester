import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
    // Set NODE_ENV to production if not set for deployment
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
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
      try {
        serveStatic(app);
        log("Static files configured for production", "production");
      } catch (staticError: unknown) {
        const errorMessage = staticError instanceof Error ? staticError.message : String(staticError);
        log(`Static file setup error: ${errorMessage}`, "error");
        // Add fallback for missing static files
        app.use("*", (_req, res) => {
          res.status(404).json({ message: "Application is starting up, please try again in a moment" });
        });
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
