import { getCassandraClient } from "../services/cassandra";
import { getTimestampFromSnowflake } from "../utils/timestampFromSnowflake";

export async function getGroupChatMessage(groupId: string): Promise<
  {
    messageId: string;
    from: string;
    text: string;
    timestamp: string;
  }[]
> {
  if (!groupId) {
    throw new Error("Group ID is required to fetch chat history");
  }

  const cassandraClient = getCassandraClient();
  if (!cassandraClient) {
    throw new Error("Cassandra client is not available");
  }

  const query =
    "SELECT message_id, message_from, message_text FROM group_message_by_group_id WHERE group_id = ? ORDER BY message_id ASC";

  try {
    const result = await cassandraClient.execute(query, [groupId], {
      prepare: true,
    });

    const messages = result.rows.map((row) => {
      const rawText = row.message_text || "";
      let parsedContent: any = rawText;

      try {
        parsedContent = JSON.parse(rawText);
      } catch {
        parsedContent = rawText;
      }

      const message: any = {
        messageId: row.message_id?.toString() || "",
        from: row.message_from || "",
        timestamp: getTimestampFromSnowflake(
          row.message_id?.toString() || ""
        ).toString(),
      };

      if (parsedContent && parsedContent.type === "file") {
        message.fileUrl = parsedContent.url;
        message.fileName = parsedContent.fileName;
        message.mimeType = parsedContent.mimeType;
        message.fileSize = parsedContent.fileSize;
        message.caption = parsedContent.caption;
      } else {
        message.text = String(parsedContent || "");
      }

      return message;
    });

    console.log(`Retrieved ${messages.length} messages for chat ${groupId}`);
    return messages;
  } catch (error) {
    console.error("Cassandra query error in getGroupChatMessage:", {
      groupId,
      error,
    });
    throw new Error("Failed to retrieve chat history from database");
  }
}
