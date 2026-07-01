import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { PORT, WS_CHAT_PORT, WS_PRESENCE_PORT } from "..";
import { getOfflineQueue } from "../queue/offlineQueue";
import { startEmailWorker } from "../queue/emailWorker";
import { subscribeToChatMessages } from "../redis/chatSubscriber";
import { subscribeToPresenceUpdates } from "../redis/presenceSubscriber";
import { subscribeToFriendEvents } from "../redis/friendEventsSubscriber";
import { createHttpServer } from "../server/http";
import { createWebSocketServer } from "../server/ws";
import { initializeCassandraClient } from "../services/cassandra";
import {
  chatConnectionManager,
  presenceConnectionManager,
} from "../services/connectionService";
import { connectToIoRedis } from "../services/ioredis";
import { prisma } from "../services/prisma";
import { connectToRedis } from "../services/redis";
import { chatHandler } from "../sockets/chatHandler";
import { presenceHandler } from "../sockets/presenceHandler";
import { logger } from "./logger";

export async function startWebSocketServers(): Promise<void> {
  try {
    createWebSocketServer({
      port: WS_CHAT_PORT,
      handler: chatHandler,
      connectionManager: chatConnectionManager,
    });
    logger.info(`🔌 Chat WebSocket server started on port ${WS_CHAT_PORT}`);

    createWebSocketServer({
      port: WS_PRESENCE_PORT,
      handler: presenceHandler,
      connectionManager: presenceConnectionManager,
    });
    logger.info(
      `👁️ Presence WebSocket server started on port ${WS_PRESENCE_PORT}`
    );
  } catch (error) {
    logger.error("❌ Failed to start WebSocket servers:", error);
    throw new Error("WebSocket servers startup failed");
  }
}

export async function initializeDatabases(): Promise<void> {
  logger.info("🔌 Connecting to Cassandra database...");
  const hasKeyspace = !!process.env.ASTRA_DB_KEYSPACE;
  const hasClientIdSecret = !!process.env.ASTRA_DB_CLIENT_ID && !!process.env.ASTRA_DB_CLIENT_SECRET;
  const hasAppToken = !!process.env.ASTRA_DB_APPLICATION_TOKEN || !!process.env.ASTRA_DB_TOKEN;
  const secureConnectBundlePath =
    process.env.ASTRA_DB_SECURE_CONNECT_BUNDLE_PATH ||
    path.join(process.cwd(), "secure-connect-my-cassandra-db.zip");
  const hasSecureConnectBundle = fs.existsSync(secureConnectBundlePath);

  if (!hasKeyspace || (!hasClientIdSecret && !hasAppToken)) {
    logger.warn(
      "⚠️ Cassandra environment variables missing or incomplete; skipping Cassandra initialization"
    );
  } else {
    if (!hasSecureConnectBundle) {
      logger.warn(
        `⚠️ Secure connect bundle missing at ${secureConnectBundlePath}; will try the Astra Data API instead.`
      );
    }
    try {
      await initializeCassandraClient();
      logger.info("✅ Cassandra client connected successfully");
    } catch (error) {
      logger.error("❌ Failed to connect to Cassandra:", error);
      logger.warn(
        "⚠️ Cassandra initialization failed. The server will continue running without Cassandra-backed messaging."
      );
    }
  }

  logger.info("🔌 Connecting to Prisma database...");
  try {
    await prisma.$connect();
    logger.info("✅ Prisma client connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Prisma:", error);
    throw new Error("Prisma connection failed - cannot start server");
  }

  logger.info("🔌 Connecting to Redis...");
  try {
    await connectToRedis();
    logger.info("✅ Redis client connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Redis:", error);
    throw new Error("Redis connection failed - cannot start server");
  }

  logger.info("🔌 Connecting to Io Redis...");
  try {
    await connectToIoRedis();
    logger.info("✅ Redis client connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Redis:", error);
    throw new Error("Redis connection failed - cannot start server");
  }

  logger.info("🔌 Connecting to Offline Messages Queue...");
  try {
    await getOfflineQueue();
    logger.info("✅ Redis client connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Redis:", error);
    throw new Error("Redis connection failed - cannot start server");
  }

  logger.info("🔌 Connecting to Subscriber To Presence Updates...");
  try {
    await subscribeToPresenceUpdates();
    logger.info("✅ Subscriber to presence updates connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Subscriber to presence updates:", error);
    throw new Error("Subscriber to presence updates connection failed - cannot start server");
  }

  logger.info("🔌 Connecting to Chat Messages Subscriber...");
  try {
    await subscribeToChatMessages();
    logger.info("✅ Chat messages subscriber connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Chat messages subscriber:", error);
    throw new Error("Chat messages subscriber connection failed - cannot start server");
  }

  logger.info("🔌 Connecting to Friend Events Subscriber...");
  try {
    await subscribeToFriendEvents();
    logger.info("✅ Friend events subscriber connected successfully");
  } catch (error) {
    logger.error("❌ Failed to connect to Friend events subscriber:", error);
    throw new Error("Friend events subscriber connection failed - cannot start server");
  }

  logger.info("🔌 Starting Email Worker...");
  try {
    await startEmailWorker();
    logger.info("✅ Email worker started successfully");
  } catch (error) {
    logger.error("❌ Failed to start Email worker:", error);
    throw new Error("Email worker startup failed - cannot start server");
  }
}

function openLoginPageInBrowser(): void {
  const url = `http://localhost:${PORT}/login.html`;
  const platform = process.platform;
  let command = "";

  if (platform === "darwin") {
    command = `open ${url}`;
  } else if (platform === "win32") {
    command = `start ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }

  exec(command, (error) => {
    if (error) {
      logger.warn(`Unable to auto-open browser: ${error.message}`);
    } else {
      logger.info(`🔓 Opened login page in browser: ${url}`);
    }
  });
}

export async function startHttpServer(): Promise<void> {
  try {
    const app = createHttpServer();
    const httpServer = app.listen(PORT, () => {
      logger.info(`🌐 HTTP server started on port ${PORT}`);
      openLoginPageInBrowser();
    });

    httpServer.on("error", (error) => {
      logger.error("HTTP Server error:", error);
    });
  } catch (error) {
    logger.error("❌ Failed to start HTTP server:", error);
    throw new Error("HTTP server startup failed");
  }
}
