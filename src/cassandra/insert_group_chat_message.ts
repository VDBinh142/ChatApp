import { getOrInitializeCassandraClient, executeCql, getAstraDb } from "../services/cassandra";

export async function insertGroupChatMessage(
  groupId: string,
  from: string,
  content: string,
  messageId: string,
): Promise<void> {
  if (!groupId || !from || !content) {
    const missingFields = [];
    if (!groupId) missingFields.push("groupId");
    if (!from) missingFields.push("from");
    if (!content) missingFields.push("content");
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const cassandraClient = await getOrInitializeCassandraClient();

  const query =
    "INSERT INTO group_message_by_group_id (group_id, message_id, message_from, message_text) VALUES (?, ?, ?, ?)";

  try {
    const astraDb = getAstraDb();
    if (astraDb) {
      await astraDb.table("group_message_by_group_id").insertOne({
        group_id: groupId,
        message_id: BigInt(messageId),
        message_from: from,
        message_text: content,
      });
      console.log(`Message inserted via Astra Data API for group ${groupId}`);
    } else {
      await executeCql(query, [groupId, messageId, from, content]);
      console.log(`Message inserted into Cassandra for group ${groupId}`);
    }
  } catch (error) {
    console.error("Cassandra query error in insertGroupChatMessage:", {
      groupId,
      from,
      error,
    });
    throw new Error("Failed to store message in database");
  }
}
