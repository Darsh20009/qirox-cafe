import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SessionStore = MemoryStore(session);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI environment variable is not set");
  process.exit(1);
}

// Track database connection status
let isDbConnected = false;
let isInitializing = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// Connect to MongoDB with robust error handling and retries
async function connectDatabase() {
  if (isInitializing) return;
  isInitializing = true;
  
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
  };

  try {
    console.log(`🔌 Attempting MongoDB connection (Attempt ${connectionRetries + 1})...`);
    await mongoose.connect(MONGODB_URI!, options);
    isDbConnected = true;
    connectionRetries = 0;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    isDbConnected = false;
    console.error("❌ MongoDB connection error:", error);
    
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
      console.log(`🔄 Retrying in ${delay / 1000}s...`);
      setTimeout(() => {
        isInitializing = false;
        connectDatabase();
      }, delay);
    } else {
      console.error("❌ Max retries reached. Database functionality will be unavailable.");
    }
  } finally {
    isInitializing = false;
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('📡 MongoDB disconnected. Attempting to reconnect...');
  isDbConnected = false;
  connectDatabase();
});

mongoose.connection.on('error', (err) => {
  console.error('📡 MongoDB error:', err);
  isDbConnected = false;
});

// Start database connection in background
connectDatabase();

// Scheduled task: Clean up expired table reservations and send notifications
let isMaintenanceRunning = false;
setInterval(async () => {
  if (isMaintenanceRunning || !isDbConnected) return;
  
  isMaintenanceRunning = true;
  try {
    const { TableModel, CustomerModel, BusinessConfigModel } = await import("@shared/schema");
    const { sendReservationExpiryWarningEmail } = await import("./mail-service");

    const businessConfig = await BusinessConfigModel.findOne({ tenantId: 'demo-tenant' });
    const businessName = businessConfig?.tradeNameAr || 'كيروكس كافيه';

    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);

    // 1. Check for expired reservations
    const expiredTables = await TableModel.find({
      'reservedFor.status': { $in: ['pending', 'confirmed'] },
      'reservedFor.autoExpiryTime': { $lt: now }
    });

    let expiredCount = 0;
    for (const table of expiredTables) {
      if (table.reservedFor) {
        table.reservedFor.status = 'expired';
        await table.save();
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🔄 Cleaned ${expiredCount} expired reservations`);
    }

    // 2. Send expiry warnings (15 minutes before expiry)
    const warningTables = await TableModel.find({
      'reservedFor.status': { $in: ['pending', 'confirmed'] },
      'reservedFor.autoExpiryTime': {
        $gte: now,
        $lte: fifteenMinutesFromNow
      },
      'reservedFor.emailNotificationSent': { $ne: true }
    });

    for (const table of warningTables) {
      if (table.reservedFor && table.reservedFor.autoExpiryTime) {
        try {
          const customer = await CustomerModel.findOne({
            phone: table.reservedFor.customerPhone
          });

          if (customer && customer.email) {
            const emailSent = await sendReservationExpiryWarningEmail(
              customer.email,
              table.reservedFor.customerName,
              table.tableNumber,
              table.reservedFor.autoExpiryTime.toString()
            );

            if (emailSent) {
              table.reservedFor.emailNotificationSent = true;
              await table.save();
              console.log(`📧 Expiry warning sent to ${customer.email}`);
            }
          }
        } catch (error) {
          console.error(`Failed to send expiry warning for table ${table.tableNumber}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Maintenance task error:", error);
  } finally {
    isMaintenanceRunning = false;
  }
}, 60000); // Run every 60 seconds (1 minute)

const app = express();

// Enable gzip compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Trust proxy - required for Render, Replit, and other reverse proxy services
app.set('trust proxy', 1);

// Configure allowed hosts for Replit and Render
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  next();
});

// Disable X-Powered-By header for security
app.disable('x-powered-by');

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false, 
    name: 'cluny.sid', // custom cookie name
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: "/",
    },
  })
);

// Debug middleware to log session state
app.use((req, res, next) => {
  if (req.path.startsWith('/api/orders') || req.path.startsWith('/api/employees/login')) {
    console.log(`  - Session ID:`, req.sessionID);
    console.log(`  - Employee:`, req.session?.employee ? 'EXISTS' : 'MISSING');
    console.log(`  - Cookie:`, req.headers.cookie ? 'PRESENT' : 'MISSING');
  }
  next();
});

// Health check endpoint for Render and other hosting services
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState
  });
});

// Middleware to ensure DB connection for API routes
app.use('/api', (req, res, next) => {
  if (!isDbConnected && mongoose.connection.readyState !== 1) {
    console.error(`🚨 API Request failed: Database not connected (State: ${mongoose.connection.readyState})`);
    // Attempt to reconnect in background
    connectDatabase();
    return res.status(503).json({ 
      message: "خدمة قاعدة البيانات غير متوفرة حالياً، يرجى المحاولة مرة أخرى خلال ثوانٍ.",
      retryAfter: 5
    });
  }
  next();
});

// IMPORTANT: Ensure /api, /attached_assets, and health routes are handled BEFORE SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/attached_assets') || 
      req.path === '/healthz' || 
      req.path === '/health') {
    return next();
  }
  next();
});

// Serve attached assets for both development and production
app.use('/attached_assets', express.static(path.resolve(__dirname, '..', 'attached_assets'), {
  setHeaders: (res, filePath) => {
    res.set('Cache-Control', 'public, max-age=3600');
    // Ensure correct content type for images
    if (filePath.endsWith('.png')) res.set('Content-Type', 'image/png');
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) res.set('Content-Type', 'image/jpeg');
  }
}));

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", async () => {
    log(`serving on port ${port}`);
    
    // Verify Mail Service on startup
    try {
      const { testEmailConnection } = await import("./mail-service");
      console.log("📧 Performing startup email connection test...");
      const success = await testEmailConnection();
      if (success) {
        console.log("✅ Mail service verified and ready on startup");
      } else {
        console.error("❌ Mail service failed verification on startup. Check credentials and connectivity.");
      }
    } catch (err) {
      console.error("❌ Error during mail service startup test:", err);
    }
  });
})();
