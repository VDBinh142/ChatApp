// Base response interface
export interface BaseResponse {
  type: string;
}

// Standard response types
export interface ErrorResponse extends BaseResponse {
  type: "ERROR";
  msg: string;
}

export interface InfoResponse extends BaseResponse {
  type: "INFO";
  msg: string;
}

export interface SuccessResponse extends BaseResponse {
  type: "SUCCESS";
  msg: string;
}

// Specific response types
export interface GroupInfo {
  groupId: string;
  groupName: string;
  createdBy: string;
  iconImageId?: string | null;
  iconImage?: any | null;
  members?: string[];
}

export interface InitDataResponse extends BaseResponse {
  type: "INIT_DATA";
  chatIds: string[];
  groups: GroupInfo[];
  offlineMessages: Array<{
    partitionKey: string;
    count: number;
    messageType: string;
    from?: string; // For ONE_TO_ONE messages
    groupName?: string; // For GROUP messages
  }>;
}

export interface NewOneToOneChatApprovalResponse extends BaseResponse {
  type: "NEW_ONE_TO_ONE_CHAT_AP";
  from?: string;
  to?: string;
  msg?: string;
  chatId?: string;
}

export interface MessageResponse extends BaseResponse {
  type: "MESSAGE";
  from: string;
  content?: string;
  chatId: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
}

export interface OneToOneChatHistoryResponse extends BaseResponse {
  type: "ONE_TO_ONE_CHAT_HISTORY";
  messages: ChatMessage[];
  isOnline: boolean;
  lastSeenTime?: string | null; // Optional, for displaying last seen time
}

export interface SearchChatHistoryResponse extends BaseResponse {
  type: "SEARCH_CHAT_HISTORY_RESULTS";
  messages: ChatMessage[] | GroupMessage[];
  chatId?: string;
  groupId?: string;
  searchTerm: string;
}

export interface GroupChatCreatedResponse extends BaseResponse {
  type: "GROUP_CHAT_CREATED";
  groupId: string;
  group?: GroupInfo;
}

export interface GroupMemberJoinedResponse extends BaseResponse {
  type: "GROUP_MEMBER_JOINED";
  groupId: string;
  username: string;
}

export interface GroupChatHistoryResponse extends BaseResponse {
  type: "GROUP_CHAT_HISTORY";
  messages: GroupMessage[];
  members: string[];
}

export interface GroupChatResponse extends BaseResponse {
  type: "GROUP_CHAT";
  from: string;
  groupId: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
}

export interface FriendRequestNotificationResponse extends BaseResponse {
  type: "FRIEND_REQUEST_RECEIVED";
  from: string;
  to: string;
  status: "PENDING";
}

export interface FriendRequestResponse extends BaseResponse {
  type: "FRIEND_REQUEST_RESPONSE";
  from: string;
  to: string;
  accepted: boolean;
  chatId?: string;
}

export interface FetchFriendRequestsResponse extends BaseResponse {
  type: "FETCH_FRIEND_REQUESTS_RESPONSE";
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
}

export interface FriendsMetaResponse extends BaseResponse {
  type: "FETCH_FRIENDS_META_RESPONSE";
  friends: string[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
}

export interface StatusChangeResponse extends BaseResponse {
  type: "STATUS_CHANGE";
  username: string;
  status: "ONLINE" | "OFFLINE";
}

export interface FriendEventResponse extends BaseResponse {
  type: "FRIEND_EVENT";
  eventType:
    | "FRIEND_REQUEST_RECEIVED"
    | "FRIEND_REQUEST_ACCEPTED"
    | "FRIEND_REQUEST_DECLINED"
    | "FRIEND_REMOVED";
  [key: string]: unknown;
}

// Union type for all outgoing responses
export type OutgoingResponse =
  | ErrorResponse
  | InfoResponse
  | SuccessResponse
  | InitDataResponse
  | NewOneToOneChatApprovalResponse
  | MessageResponse
  | OneToOneChatHistoryResponse
  | SearchChatHistoryResponse
  | GroupChatCreatedResponse
  | GroupMemberJoinedResponse
  | GroupChatHistoryResponse
  | GroupChatResponse
  | FriendRequestNotificationResponse
  | FriendRequestResponse
  | FetchFriendRequestsResponse
  | FriendsMetaResponse
  | StatusChangeResponse
  | FriendEventResponse;

// Data model types
export interface ChatMessage {
  id?: string;
  from: string;
  to: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
  chatId?: string;
}

export interface GroupMessage {
  id?: string;
  from: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  caption?: string;
  timestamp: string;
  groupId?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  content: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: Date;
  respondedAt: Date | null;
}

export interface Friendship {
  id: string;
  user: string;
  friend: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdAt: Date;
  members?: GroupMembership[];
}

export interface GroupMembership {
  id: string;
  group: string;
  user: string;
  joinedAt: Date;
}
