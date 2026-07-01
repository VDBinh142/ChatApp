import { WebSocket } from "ws";
import {
  CreateGroupChatMessage,
  DisconnectMessage,
  FileMessage,
  GetGroupChatHistoryMessage,
  GetOneToOneChatHistoryMessage,
  GroupChatMessage,
  GroupFileMessage,
  IncomingMessage,
  JoinGroupChatMessage,
  NewOneToOneChatMessage,
  OfflineMessagesAckMessage,
  OneToOneChatMessage,
  SearchGroupChatHistoryMessage,
  SearchOneToOneChatHistoryMessage,
  FetchFriendsMetaMessage,
  FetchFriendRequestsMessage,
} from "./messageTypes";

// Generic message handler type
export type MessageHandler<T extends IncomingMessage = IncomingMessage> = (
  ws: WebSocket,
  message: T
) => Promise<void> | void;

// Specific handler types for type safety
export type InitChatHandler = MessageHandler;
export type NewOneToOneChatHandler = MessageHandler<NewOneToOneChatMessage>;
export type OneToOneChatHandler = MessageHandler<OneToOneChatMessage>;
export type GetOneToOneChatHistoryHandler =
  MessageHandler<GetOneToOneChatHistoryMessage>;
export type CreateGroupChatHandler = MessageHandler<CreateGroupChatMessage>;
export type JoinGroupChatHandler = MessageHandler<JoinGroupChatMessage>;
export type GroupChatHandler = MessageHandler<GroupChatMessage>;
export type GetGroupChatHistoryHandler =
  MessageHandler<GetGroupChatHistoryMessage>;
export type FileMessageHandler = MessageHandler<FileMessage>;
export type GroupFileMessageHandler = MessageHandler<GroupFileMessage>;
export type FetchFriendRequestsHandler = MessageHandler<FetchFriendRequestsMessage>;
export type FetchFriendsMetaHandler = MessageHandler<FetchFriendsMetaMessage>;
export type SearchOneToOneChatHistoryHandler =
  MessageHandler<SearchOneToOneChatHistoryMessage>;
export type SearchGroupChatHistoryHandler =
  MessageHandler<SearchGroupChatHistoryMessage>;
export type OfflineMessagesAckHandler =
  MessageHandler<OfflineMessagesAckMessage>;
export type DisconnectHandler = MessageHandler<DisconnectMessage>;

// Message handler map interface
export interface MessageHandlerMap {
  INIT_DATA: InitChatHandler;
  NEW_ONE_TO_ONE_CHAT: NewOneToOneChatHandler;
  GET_ONE_TO_ONE_HISTORY: GetOneToOneChatHistoryHandler;
  ONE_TO_ONE_CHAT: OneToOneChatHandler;
  CREATE_GROUP_CHAT: CreateGroupChatHandler;
  JOIN_GROUP_CHAT: JoinGroupChatHandler;
  GET_GROUP_CHAT_HISTORY: GetGroupChatHistoryHandler;
  GROUP_CHAT: GroupChatHandler;
  FILE_MESSAGE: FileMessageHandler;
  GROUP_FILE_MESSAGE: GroupFileMessageHandler;
  FETCH_FRIEND_REQUESTS: FetchFriendRequestsHandler;
  FETCH_FRIENDS_META: FetchFriendsMetaHandler;
  SEARCH_ONE_TO_ONE_HISTORY: SearchOneToOneChatHistoryHandler;
  SEARCH_GROUP_CHAT_HISTORY: SearchGroupChatHistoryHandler;
  OFFLINE_MESSAGES_ACK: OfflineMessagesAckHandler;
  DISCONNECT: DisconnectHandler;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// WebSocket connection state
export interface WebSocketState {
  username?: string;
  isAuthenticated: boolean;
  connectionTime: Date;
}
