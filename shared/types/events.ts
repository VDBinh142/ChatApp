export type UserCreated = {
  id: string;
  username: string;
  email?: string;
};

export type MessageSent = {
  id: string;
  fromUserId: string;
  toId: string; // user or group id
  content: string;
  timestamp: string;
};
