// message.ts - Updated to match backend DTOs exactly
export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  senderName: string;
  senderProfilePicture: string | null;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: number;
  guestId: string;
  guestName: string;
  guestProfilePicture: string | null;
  hostId: string;
  hostName: string;
  hostProfilePicture: string | null;
  listingId: number;
  listingTitle: string;
  listingCoverPhoto: string | null;
  lastMessageContent: string | null;
  lastMessageTimestamp: Date | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

export interface ConversationDetail {
  id: number;
  guest: Participant;
  host: Participant;
  listing: ConversationListing;
  messages: Message[];
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  isOnline: boolean;
}

export interface ConversationListing {
  id: number;
  title: string;
  city: string;
  country: string;
  coverPhotoUrl: string | null;
  pricePerNight: number;
}

export interface CreateConversationRequest {
  hostId: string;
  listingId: number;
  initialMessage: string;
}

export interface SendMessageRequest {
  conversationId: number;
  content: string;
}

export interface MarkAsReadRequest {
  messageIds: number[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}