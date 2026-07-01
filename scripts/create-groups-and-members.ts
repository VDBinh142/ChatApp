import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import WebSocket from "ws";

dotenv.config();

export const testGroups = [
  {
    name: "group1",
    creator: "new_user1",
    members: [
      "new_user1",
      "new_user2",
      "new_user3",
      "new_user4",
      "new_user5",
      "new_user6",
      "new_user7",
      "new_user8",
      "new_user9",
      "new_user10",
    ],
  },
  {
    name: "group2",
    creator: "new_user11",
    members: [
      "new_user11",
      "new_user12",
      "new_user13",
      "new_user14",
      "new_user15",
      "new_user16",
      "new_user17",
      "new_user18",
      "new_user19",
      "new_user20",
    ],
  },
  {
    name: "group3",
    creator: "new_user21",
    members: [
      "new_user21",
      "new_user22",
      "new_user23",
      "new_user24",
      "new_user25",
      "new_user26",
      "new_user27",
      "new_user28",
      "new_user29",
      "new_user30",
    ],
  },
  {
    name: "group4",
    creator: "new_user31",
    members: [
      "new_user31",
      "new_user32",
      "new_user33",
      "new_user34",
      "new_user35",
      "new_user36",
      "new_user37",
      "new_user38",
      "new_user39",
      "new_user40",
    ],
  },
  {
    name: "group5",
    creator: "new_user41",
    members: [
      "new_user41",
      "new_user42",
      "new_user43",
      "new_user44",
      "new_user45",
      "new_user46",
      "new_user47",
      "new_user48",
      "new_user49",
      "new_user50",
    ],
  },
  {
    name: "group6",
    creator: "new_user51",
    members: [
      "new_user51",
      "new_user52",
      "new_user53",
      "new_user54",
      "new_user55",
      "new_user56",
      "new_user57",
      "new_user58",
      "new_user59",
      "new_user60",
    ],
  },
  {
    name: "group7",
    creator: "new_user61",
    members: [
      "new_user61",
      "new_user62",
      "new_user63",
      "new_user64",
      "new_user65",
      "new_user66",
      "new_user67",
      "new_user68",
      "new_user69",
      "new_user70",
    ],
  },
  {
    name: "group8",
    creator: "new_user71",
    members: [
      "new_user71",
      "new_user72",
      "new_user73",
      "new_user74",
      "new_user75",
      "new_user76",
      "new_user77",
      "new_user78",
      "new_user79",
      "new_user80",
    ],
  },
  {
    name: "group9",
    creator: "new_user81",
    members: [
      "new_user81",
      "new_user82",
      "new_user83",
      "new_user84",
      "new_user85",
      "new_user86",
      "new_user87",
      "new_user88",
      "new_user89",
      "new_user90",
    ],
  },
  {
    name: "group10",
    creator: "new_user91",
    members: [
      "new_user91",
      "new_user92",
      "new_user93",
      "new_user94",
      "new_user95",
      "new_user96",
      "new_user97",
      "new_user98",
      "new_user99",
      "new_user100",
    ],
  },
  // Cross-team groups for more interaction
  {
    name: "group11",
    creator: "new_user1",
    members: [
      "new_user1",
      "new_user11",
      "new_user21",
      "new_user31",
      "new_user41",
      "new_user51",
      "new_user61",
      "new_user71",
      "new_user81",
      "new_user91",
    ],
  },
  {
    name: "group12",
    creator: "new_user2",
    members: [
      "new_user5",
      "new_user15",
      "new_user25",
      "new_user35",
      "new_user45",
      "new_user55",
      "new_user65",
      "new_user75",
      "new_user85",
      "new_user95",
    ],
  },
];
interface TestClient {
  username: string;
  ws: WebSocket;
  isReady: boolean;
  createdGroups: string[];
  joinedGroups: string[];
  authToken: string;
}

interface AuthResponse {
  token?: string;
  username?: string;
  error?: string;
  message?: string;
}

// Authentication helper function
async function authenticateUser(
  username: string,
  password: string = "password"
): Promise<string | null> {
  try {
    console.log(`🔐 Authenticating ${username}...`);

    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = (await response.json()) as AuthResponse;

    if (response.ok && data.token) {
      console.log(`✅ Authentication successful for ${username}`);
      return data.token;
    } else {
      console.log(
        `❌ Authentication failed for ${username}: ${
          data.error || "Unknown error"
        }`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Authentication error for ${username}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

// Storage for created group IDs
const createdGroupIds: string[] = [];

async function createGroupsAndMembersViaWebSocket() {
  try {
    console.log("🚀 Starting group and membership creation via WebSocket...");

    const clients: TestClient[] = [];
    let groupSuccessCount = 0;
    let groupErrorCount = 0;
    let memberSuccessCount = 0;
    let memberSkipCount = 0;
    let memberErrorCount = 0;

    console.log(`📝 Creating ${testGroups.length} groups...`);

    // Function to create authenticated WebSocket client
    const createClient = (
      username: string,
      authToken: string
    ): Promise<TestClient> => {
      return new Promise((resolve, reject) => {
        // Create WebSocket connection with JWT token in Authorization header
        const ws = new WebSocket(`ws://localhost:4000`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const client: TestClient = {
          username,
          ws,
          isReady: false,
          createdGroups: [],
          joinedGroups: [],
          authToken,
        };

        const timeout = setTimeout(() => {
          reject(new Error(`Connection timeout for ${username}`));
        }, 10000);

        ws.on("open", () => {
          console.log(`✅ ${username} connected with authentication`);
        });

        ws.on("message", (data) => {
          const message = JSON.parse(data.toString());

          if (message.type === "INIT_DATA") {
            client.isReady = true;
            clearTimeout(timeout);
            resolve(client);
          } else if (message.type === "GROUP_CHAT_CREATED") {
            client.createdGroups.push(message.groupId);
            createdGroupIds.push(message.groupId); // Save to our global array
            groupSuccessCount++;
            console.log(`✅ Group created by ${username}: ${message.groupId}`);
          } else if (message.type === "SUCCESS") {
            if (message.msg && message.msg.includes("joined the group")) {
              memberSuccessCount++;
              console.log(`   ✅ ${username} joined group successfully`);
            }
          } else if (message.type === "GROUP_MEMBER_JOINED") {
            if (message.username === username) {
              client.joinedGroups.push(message.groupId);
            }
          } else if (message.type === "ERROR") {
            if (message.msg && message.msg.includes("already a member")) {
              memberSkipCount++;
              console.log(`   ⏭️  ${username} already in group`);
            } else if (message.msg && message.msg.includes("does not exist")) {
              memberErrorCount++;
              console.log(
                `   ❌ ${username} doesn't exist or group doesn't exist`
              );
            } else {
              console.log(`❌ Error for ${username}: ${message.msg}`);
            }
          }
        });

        ws.on("error", (error) => {
          clearTimeout(timeout);
          console.error(`❌ WebSocket error for ${username}:`, error);
          reject(error);
        });

        ws.on("close", (code, reason) => {
          clearTimeout(timeout);
          if (code === 1008) {
            reject(
              new Error(`Authentication failed for ${username}: ${reason}`)
            );
          }
        });
      });
    };

    // Get all unique users from groups
    const allUsers = new Set<string>();
    testGroups.forEach((group) => {
      allUsers.add(group.creator);
      group.members.forEach((member) => allUsers.add(member));
    });

    const usernames = Array.from(allUsers);
    console.log(`🔐 Authenticating ${usernames.length} users...`);

    // Authenticate all users first
    const authPromises = usernames.map(async (username) => {
      const token = await authenticateUser(username);
      return { username, token };
    });

    const authResults = await Promise.allSettled(authPromises);
    const authenticatedUsers: { username: string; token: string }[] = [];

    authResults.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.token) {
        authenticatedUsers.push({
          username: result.value.username,
          token: result.value.token,
        });
      } else {
        console.log(`❌ Failed to authenticate ${usernames[index]}`);
      }
    });

    console.log(
      `✅ Successfully authenticated ${authenticatedUsers.length}/${usernames.length} users`
    );
    console.log(`🔌 Connecting ${authenticatedUsers.length} users...`);

    // Connect authenticated users in batches
    const batchSize = 20;
    for (let i = 0; i < authenticatedUsers.length; i += batchSize) {
      const batch = authenticatedUsers.slice(i, i + batchSize);
      const batchClients = await Promise.allSettled(
        batch.map(({ username, token }) => createClient(username, token))
      );

      batchClients.forEach((result, index) => {
        if (result.status === "fulfilled") {
          clients.push(result.value);
        } else {
          console.log(
            `❌ Failed to connect ${batch[index].username}: ${result.reason.message}`
          );
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `🎯 Connected ${clients.length}/${authenticatedUsers.length} users`
    );

    // Wait for all clients to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create groups
    console.log("\n👥 Creating groups...");

    for (const group of testGroups) {
      const creator = clients.find((c) => c.username === group.creator);

      if (!creator || !creator.isReady) {
        groupErrorCount++;
        console.log(`❌ Creator ${group.creator} not found or not ready`);
        continue;
      }

      try {
        creator.ws.send(
          JSON.stringify({
            type: "CREATE_GROUP_CHAT",
            groupName: group.name,
            by: group.creator,
          })
        );

        console.log(`🔄 Creating group: ${group.name} by ${group.creator}`);

        // Wait a bit between group creations
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        groupErrorCount++;
        console.log(`❌ Failed to create group ${group.name}:`, error);
      }
    }

    // Wait for group creation responses
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Add members to groups
    console.log("\n👥 Adding members to groups...");

    for (let i = 0; i < testGroups.length; i++) {
      const group = testGroups[i];
      const creator = clients.find((c) => c.username === group.creator);

      // Use the group ID from the creator's created groups (in order)
      const createdGroupId =
        creator?.createdGroups[
          creator.createdGroups.length - (testGroups.length - i)
        ] || creator?.createdGroups[0]; // fallback to first created group

      if (!createdGroupId) {
        console.log(
          `⏭️  Skipping members for ${group.name} - group not created`
        );
        continue;
      }

      console.log(
        `👥 Adding ${group.members.length} members to ${group.name}...`
      );

      for (const memberUsername of group.members) {
        const memberClient = clients.find((c) => c.username === memberUsername);

        if (!memberClient || !memberClient.isReady) {
          memberErrorCount++;
          console.log(`   ❌ Member ${memberUsername} not found or not ready`);
          continue;
        }

        try {
          memberClient.ws.send(
            JSON.stringify({
              type: "JOIN_GROUP_CHAT",
              groupId: createdGroupId,
              username: memberUsername,
            })
          );

          console.log(`   🔄 Adding ${memberUsername} to group`);

          // Small delay between member additions
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          memberErrorCount++;
          console.log(`   ❌ Failed to add ${memberUsername} to group:`, error);
        }
      }

      // Wait between groups
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Wait for all member join responses
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Close all connections
    clients.forEach((client) => {
      try {
        client.ws.send(JSON.stringify({ type: "DISCONNECT" }));
        client.ws.close();
      } catch (error) {
        // Ignore close errors
      }
    });

    // Save group IDs to file after all operations
    const groupIdsFilePath = path.join(
      __dirname,
      "..",
      "benchmark",
      "created-group-ids.json"
    );
    const groupIdsData = {
      groupIds: createdGroupIds,
      timestamp: new Date().toISOString(),
      totalGroups: createdGroupIds.length,
    };

    fs.writeFileSync(groupIdsFilePath, JSON.stringify(groupIdsData, null, 2));
    console.log(
      `💾 Saved ${createdGroupIds.length} group IDs to ${groupIdsFilePath}`
    );

    console.log("\n📊 Group Creation Summary:");
    console.log(`✅ Successfully created: ${groupSuccessCount} groups`);
    console.log(`❌ Failed: ${groupErrorCount} groups`);
    console.log(
      `🎯 Total groups processed: ${groupSuccessCount + groupErrorCount}/${
        testGroups.length
      }`
    );

    console.log("\n👥 Membership Creation Summary:");
    console.log(`✅ Successfully added: ${memberSuccessCount} memberships`);
    console.log(`⏭️  Skipped (already exist): ${memberSkipCount} memberships`);
    console.log(`❌ Failed: ${memberErrorCount} memberships`);
  } catch (error) {
    console.error("❌ Error creating groups and memberships:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createGroupsAndMembersViaWebSocket()
    .then(() => {
      console.log("🎉 Group and membership creation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { createGroupsAndMembersViaWebSocket };
