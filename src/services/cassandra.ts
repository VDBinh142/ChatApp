import { Client } from "cassandra-driver";
import fs from "fs";
import path from "path";
import { DataAPIClient } from "@datastax/astra-db-ts";

let cassandraClient: Client | null = null;
let cassandraEnabled = true;
let astraClient: any = null;
let astraDb: any = null;

export function isCassandraEnabled(): boolean {
  return cassandraEnabled || !!astraDb;
}

export async function initializeCassandraClient(): Promise<Client | null> {
  try {
    if (cassandraClient) {
      return cassandraClient;
    }

    const clientId = process.env.ASTRA_DB_CLIENT_ID;
    const clientSecret = process.env.ASTRA_DB_CLIENT_SECRET;
    const appToken = process.env.ASTRA_DB_APPLICATION_TOKEN || process.env.ASTRA_DB_TOKEN;
    const keyspace = process.env.ASTRA_DB_KEYSPACE;
    const secureConnectBundlePath =
      process.env.ASTRA_DB_SECURE_CONNECT_BUNDLE_PATH ||
      path.join(process.cwd(), "secure-connect-my-cassandra-db.zip");

    if (!keyspace) {
      throw new Error(
        "Missing required environment variable: ASTRA_DB_KEYSPACE"
      );
    }

    if (!clientId || !clientSecret) {
      if (!appToken) {
        throw new Error(
          "Missing required Cassandra auth environment variables: either ASTRA_DB_CLIENT_ID + ASTRA_DB_CLIENT_SECRET or ASTRA_DB_APPLICATION_TOKEN/ASTRA_DB_TOKEN"
        );
      }
    }

    if (!fs.existsSync(secureConnectBundlePath)) {
      console.warn(
        `⚠️ Cassandra secure connect bundle not found at ${secureConnectBundlePath}. Attempting Astra Data API fallback.`
      );

      // Try to initialize Astra Data API client if endpoint + token provided
      const apiEndpoint = process.env.ASTRA_DB_API_ENDPOINT;
      const apiToken = process.env.ASTRA_DB_APPLICATION_TOKEN || process.env.ASTRA_DB_TOKEN;
      const keyspaceEnv = keyspace;

      if (apiEndpoint && apiToken && keyspaceEnv) {
        try {
          astraClient = new DataAPIClient(apiToken);
          astraDb = astraClient.db(apiEndpoint, { keyspace: keyspaceEnv, token: apiToken });
          console.log("✅ Astra Data API client initialized as fallback");
          cassandraEnabled = false;
          return null;
        } catch (astraErr) {
          console.error("Failed to initialize Astra Data API client:", astraErr);
          cassandraEnabled = false;
          return null;
        }
      }

      cassandraEnabled = false;
      return null;
    }

    try {
      const credentials = clientId && clientSecret
        ? { username: clientId, password: clientSecret }
        : { username: "token", password: appToken! };

      cassandraClient = new Client({
        cloud: {
          secureConnectBundle: secureConnectBundlePath,
        },
        credentials,
        keyspace,
      });

      await cassandraClient.connect();
      console.log("✅ Cassandra client connected successfully");
      return cassandraClient;
    } catch (connectionError) {
      console.error("Failed to connect to Cassandra:", connectionError);
      cassandraClient = null;
      cassandraEnabled = false;
      throw new Error(
        "Cassandra connection failed. Please check your credentials and secure connect bundle."
      );
    }
  } catch (error) {
    console.error("Error initializing Cassandra client:", error);
    throw error;
  }
}

export async function getOrInitializeCassandraClient(): Promise<Client | null> {
  if (!cassandraClient && cassandraEnabled) {
    await initializeCassandraClient();
  }
  return cassandraClient;
}

export function getAstraDb(): any | null {
  return astraDb;
}

export async function executeCql(query: string, params: any[] = []): Promise<any> {
  // If native cassandra client available, use it
  if (cassandraClient) {
    return cassandraClient.execute(query, params, { prepare: true });
  }

  // If Astra Data API db available, use its command API
  if (astraDb) {
    // For Data API use table/collection helper commands when possible
    // Fallback: try command, but many Data API endpoints do not support arbitrary CQL
    try {
      const command = { executeCql: { cql: query, parameters: params } };
      const resp = await astraDb.command(command);
      return resp;
    } catch (error) {
      console.warn("Astra Data API does not support executeCql; caller should use table APIs.", (error as any)?.message || error);
      throw error;
    }
  }

  throw new Error("No Cassandra client available");
}

export function getCassandraClient(): Client {
  if (!cassandraClient) {
    throw new Error(
      "Cassandra client not initialized. Call initializeCassandraClient() first."
    );
  }
  return cassandraClient;
}

export async function closeCassandraClient(): Promise<void> {
  try {
    if (cassandraClient) {
      await cassandraClient.shutdown();
      cassandraClient = null;
      console.log("📴 Cassandra client disconnected");
    }
  } catch (error) {
    console.error("Error closing Cassandra client:", error);
    cassandraClient = null;
    throw error;
  }
}
