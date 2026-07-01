// Base message interface
export interface BaseMessage {
  type: string;
}

// Incoming message types
export interface NewOneToOneChatMessage extends BaseMessage {
  type: "NEW_ONE_TO_ONE_CHAT";
  from: string;
  to: string;
}

export interface OneToOneChatMessage extends BaseMessage {
  type: "ONE_TO_ONE_CHAT";
  from: string;
  to: string;
  content: string;
  chatId: string;
}

export interface GetOneToOneChatHistoryMessage extends BaseMessage {
  type: "GET_ONE_TO_ONE_HISTORY";
  from: string;
  to: string;
  chatId: string;
}

export interface CreateGroupChatMessage extends BaseMessage {
  type: "CREATE_GROUP_CHAT";
  groupName: string;
  by: string;
  members?: string[];
  iconImageId?: string;
}

export interface JoinGroupChatMessage extends BaseMessage {
  type: "JOIN_GROUP_CHAT";
  groupId: string;
  username: string;
}

export interface GroupChatMessage extends BaseMessage {
  type: "GROUP_CHAT";
  from: string;
  to: string; // groupId
  content: string;
}

export interface GetGroupChatHistoryMessage extends BaseMessage {
  type: "GET_GROUP_CHAT_HISTORY";
  groupId: string;
}

export interface OfflineMessagesAckMessage extends BaseMessage {
  type: "OFFLINE_MESSAGES_ACK";
}

export interface DisconnectMessage extends BaseMessage {
  type: "DISCONNECT";
}

export interface FetchFriendsMetaMessage extends BaseMessage {
  type: "FETCH_FRIENDS_META";
}

export interface FetchFriendRequestsMessage extends BaseMessage {
  type: "FETCH_FRIEND_REQUESTS";
  username: string;
}

export interface SearchOneToOneChatHistoryMessage extends BaseMessage {
  type: "SEARCH_ONE_TO_ONE_HISTORY";
  from: string;
  to: string;
  chatId: string;
  searchTerm: string;
}

export interface SearchGroupChatHistoryMessage extends BaseMessage {
  type: "SEARCH_GROUP_CHAT_HISTORY";
  groupId: string;
  searchTerm: string;
}

export interface FileMessage extends BaseMessage {
  type: "FILE_MESSAGE";
  from: string;
  to: string;
  chatId: string;
  fileName: string;
  fileType: string;
  fileBase64: string;
  caption?: string;
}

export interface GroupFileMessage extends BaseMessage {
  type: "GROUP_FILE_MESSAGE";
  from: string;
  groupId: string;
  fileName: string;
  fileType: string;
  fileBase64: string;
  caption?: string;
}

// Union type for all incoming messages
export type IncomingMessage =
  | NewOneToOneChatMessage
  | OneToOneChatMessage
  | GetOneToOneChatHistoryMessage
  | CreateGroupChatMessage
  | JoinGroupChatMessage
  | GroupChatMessage
  | GetGroupChatHistoryMessage
  | OfflineMessagesAckMessage
  | DisconnectMessage
  | FetchFriendsMetaMessage
  | FetchFriendRequestsMessage
  | SearchOneToOneChatHistoryMessage
  | SearchGroupChatHistoryMessage
  | FileMessage
  | GroupFileMessage;
