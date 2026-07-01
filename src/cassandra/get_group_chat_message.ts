import { getOrInitializeCassandraClient, executeCql, getAstraDb } from "../services/cassandra";
import { getTimestampFromSnowflake } from "../utils/timestampFromSnowflake";

export async function getGroupChatMessage(groupId: string): Promise<
  {
    messageId: string;
    from: string;
    content?: string;
    timestamp: string;
  }[]
> {
  if (!groupId) {
    throw new Error("Group ID is required to fetch chat history");
  }

  const cassandraClient = await getOrInitializeCassandraClient();

  const query =
    "SELECT message_id, message_from, message_text FROM group_message_by_group_id WHERE group_id = ? ORDER BY message_id ASC";

  try {
    const astraDb = getAstraDb();
    let rows: any[] = [];

    if (astraDb) {
      rows = await astraDb
        .table("group_message_by_group_id")
        .find({ group_id: groupId })
        .toArray();
    } else {
      const result = await executeCql(query, [groupId]);
      rows = result?.rows || result?.data || result?.data?.data || [];
    }

    const messages = (rows as any[]).map((row: any) => {
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
        message.content = String(parsedContent || "");
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
