import { getOrInitializeCassandraClient, executeCql, getAstraDb } from "../services/cassandra";
import { getTimestampFromSnowflake } from "../utils/timestampFromSnowflake";

export async function getOneToOneChatHistory(chatId: string): Promise<
  {
    messageId: string;
    from: string;
    to: string;
    text: string;
    timestamp: string;
  }[]
> {
  if (!chatId) {
    throw new Error("Chat ID is required to fetch chat history");
  }

  const cassandraClient = await getOrInitializeCassandraClient();

  const query =
    "SELECT message_id, message_from, message_text, message_to FROM one_to_one_message_by_chat_id WHERE chat_id = ? ORDER BY message_id ASC";

  try {
    const astraDb = getAstraDb();
    let rows: any[] = [];

    if (astraDb) {
      rows = await astraDb
        .table("one_to_one_message_by_chat_id")
        .find({ chat_id: chatId })
        .toArray();
    } else {
      const result = await executeCql(query, [chatId]);
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
        to: row.message_to || "",
        timestamp: getTimestampFromSnowflake(
          row.message_id?.toString() || ""
        ).toString(),
      };

      if (parsedContent && parsedContent.type === "file") {
        message.content = parsedContent.caption || "";
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

    console.log(`Retrieved ${messages.length} messages for chat ${chatId}`);
    return messages;
  } catch (error) {
    console.error("Cassandra query error in getOneToOneChatHistory:", {
      chatId,
      error,
    });
    throw new Error("Failed to retrieve chat history from database");
  }
}
