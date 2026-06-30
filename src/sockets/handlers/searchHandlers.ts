import { WebSocket } from "ws";
import { getGroupChatMessage } from "../../cassandra/get_group_chat_message";
import { getOneToOneChatHistory } from "../../cassandra/get_one_to_one_chat_history_by_chat_id";
import { WsResponse } from "../../utils/wsResponse";
import {
  SearchGroupChatHistoryMessage,
  SearchOneToOneChatHistoryMessage,
} from "../../types/messageTypes";

function matchesSearchTerm(message: any, searchTerm: string): boolean {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) return false;

  const fields = [
    message.text,
    message.content,
    message.caption,
    message.fileName,
    message.mimeType,
  ];

  return fields.some((field) =>
    typeof field === "string" && field.toLowerCase().includes(normalized),
  );
}

export async function searchOneToOneChatHistoryHandler(
  ws: WebSocket,
  parsed: SearchOneToOneChatHistoryMessage,
): Promise<void> {
  const { chatId, searchTerm } = parsed;

  if (!chatId || !searchTerm) {
    WsResponse.error(ws, "Chat ID and search term are required.");
    return;
  }

  try {
    const history = await getOneToOneChatHistory(chatId);
    const filtered = history.filter((message) =>
      matchesSearchTerm(message, searchTerm),
    );

    WsResponse.custom(ws, {
      type: "SEARCH_CHAT_HISTORY_RESULTS",
      messages: filtered,
      chatId,
      searchTerm,
    });
  } catch (error) {
    console.error("Error searching one-to-one history:", error);
    WsResponse.error(ws, "Failed to search chat history.");
  }
}

export async function searchGroupChatHistoryHandler(
  ws: WebSocket,
  parsed: SearchGroupChatHistoryMessage,
): Promise<void> {
  const { groupId, searchTerm } = parsed;

  if (!groupId || !searchTerm) {
    WsResponse.error(ws, "Group ID and search term are required.");
    return;
  }

  try {
    const history = await getGroupChatMessage(groupId);
    const filtered = history.filter((message) =>
      matchesSearchTerm(message, searchTerm),
    );

    WsResponse.custom(ws, {
      type: "SEARCH_CHAT_HISTORY_RESULTS",
      messages: filtered,
      groupId,
      searchTerm,
    });
  } catch (error) {
    console.error("Error searching group chat history:", error);
    WsResponse.error(ws, "Failed to search group chat history.");
  }
}
