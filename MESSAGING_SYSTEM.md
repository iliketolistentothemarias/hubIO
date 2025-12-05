# Direct Messaging System - Complete Documentation

## Overview

A production-ready, full-featured direct messaging system built with Next.js, Supabase, and real-time capabilities. This system provides Discord/Instagram-like messaging with advanced features including typing indicators, read receipts, file sharing, and more.

## Features

### ✅ Core Messaging
- **Real-time messaging** with Supabase Realtime
- **1-on-1 conversations** with support for future group chats
- **Message history** with infinite scroll pagination
- **Smart auto-scroll** that pauses when user scrolls up
- **Message grouping** for better readability
- **Date dividers** for easy navigation

### ✅ Advanced Features
- **Typing indicators** - See when someone is typing
- **Online status** - Real-time presence tracking
- **Read receipts** - Sent, delivered, and read status
- **Unread counts** - Per-conversation unread message tracking
- **File & image uploads** - Share photos and documents
- **Message search** - Find conversations quickly
- **Notifications** - Browser and in-app notifications

### ✅ User Safety
- **Block users** - Prevent unwanted contact
- **Report system** - Flag inappropriate behavior
- **Secure RLS policies** - Only participants can access messages

### ✅ UI/UX
- **Modern, clean design** - Inspired by Discord/Instagram
- **Fully responsive** - Works on desktop, tablet, and mobile
- **Dark mode support** - Automatic theme switching
- **Smooth animations** - Framer Motion powered
- **Touch gestures** - Mobile-optimized interactions
- **Loading states** - Skeletons and spinners

## Architecture

### Database Schema

```
conversations
├── id (UUID, PK)
├── type (direct | group)
├── name (optional)
├── description (optional)
├── created_by (UUID, FK → users)
├── created_at
└── updated_at

conversation_participants
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── user_id (UUID, FK → users)
├── joined_at
└── last_read_at

messages
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── sender_id (UUID, FK → users)
├── content (TEXT)
├── type (text | image | file | system)
├── attachments (JSONB)
├── created_at
└── updated_at

message_status
├── id (UUID, PK)
├── message_id (UUID, FK → messages)
├── user_id (UUID, FK → users)
├── status (sent | delivered | read)
└── timestamp

typing_indicators
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── user_id (UUID, FK → users)
└── started_at

user_presence
├── user_id (UUID, PK, FK → users)
├── status (online | away | offline)
├── last_seen
└── updated_at

blocked_users
├── id (UUID, PK)
├── blocker_id (UUID, FK → users)
├── blocked_id (UUID, FK → users)
├── reason
└── created_at

user_reports
├── id (UUID, PK)
├── reporter_id (UUID, FK → users)
├── reported_id (UUID, FK → users)
├── conversation_id (UUID, FK → conversations)
├── message_id (UUID, FK → messages)
├── reason
├── description
├── status (pending | reviewed | resolved)
└── created_at

conversation_metadata
├── id (UUID, PK)
├── conversation_id (UUID, FK → conversations)
├── user_id (UUID, FK → users)
├── unread_count
├── last_read_at
├── muted
├── archived
└── pinned
```

### Services

#### MessagingService (`lib/messaging/MessagingService.ts`)
Core messaging functionality:
- `getConversations()` - Fetch user's conversations
- `getOrCreateDirectConversation(userId)` - Start/get DM
- `getMessages(conversationId, options)` - Fetch messages with pagination
- `sendMessage(conversationId, content, type, attachments)` - Send message
- `markAsRead(conversationId, messageIds)` - Mark messages as read
- `startTyping(conversationId)` - Show typing indicator
- `stopTyping(conversationId)` - Hide typing indicator
- `updatePresence(status)` - Update online status
- `blockUser(userId, reason)` - Block a user
- `reportUser(userId, reason, description)` - Report a user
- `subscribeToMessages(conversationId, callback)` - Real-time message updates
- `subscribeToTyping(conversationId, callback)` - Real-time typing updates
- `subscribeToPresence(userIds, callback)` - Real-time presence updates

#### FileUploadService (`lib/messaging/FileUploadService.ts`)
File handling:
- `uploadImage(file)` - Upload image with validation
- `uploadAttachment(file)` - Upload file with validation
- `deleteFile(fileUrl)` - Remove file from storage
- `compressImage(file, maxWidth, maxHeight, quality)` - Client-side compression
- `getFileIcon(fileType)` - Get emoji icon for file type
- `formatFileSize(bytes)` - Human-readable file sizes

#### NotificationService (`lib/messaging/NotificationService.ts`)
Notifications:
- `initialize()` - Request browser notification permission
- `showMessageNotification(sender, content, conversationId)` - Browser notification
- `createInAppNotification(userId, senderId, conversationId, preview)` - Database notification
- `getUnreadCount()` - Get unread notification count
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead()` - Clear all notifications
- `subscribeToNotifications(userId, callback)` - Real-time notification updates
- `playNotificationSound()` - Play sound effect

### Components

#### ConversationList (`components/messaging/ConversationList.tsx`)
- Displays all user conversations
- Search functionality
- Unread counts and badges
- Pin, mute, archive, delete actions
- New conversation button
- Real-time updates

#### ChatWindow (`components/messaging/ChatWindow.tsx`)
- Message display with infinite scroll
- Smart auto-scroll with pause detection
- Message grouping and date dividers
- Typing indicators
- Read receipts (sent/delivered/read)
- File/image attachments
- Voice/video call buttons (UI only)
- Block/report user menu
- Mobile responsive

#### MessagesPage (`app/messages/page.tsx`)
- Main messaging interface
- Conversation list + chat window layout
- New conversation modal
- User search
- Block/report dialogs
- Presence management

### API Routes

#### `GET /api/messages/conversations`
Get all conversations for current user

Response:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "type": "direct",
      "created_at": "2024-01-01T00:00:00Z",
      "participants": [...],
      "last_message": {...},
      "metadata": {...}
    }
  ]
}
```

#### `POST /api/messages/conversations`
Create new conversation

Request:
```json
{
  "participant_ids": ["uuid"],
  "type": "direct",
  "name": "Optional",
  "description": "Optional"
}
```

#### `GET /api/messages/[conversationId]`
Get messages for conversation

Query params:
- `limit` - Number of messages (default: 50)
- `before` - ISO timestamp for pagination

#### `POST /api/messages/[conversationId]`
Send message

Request:
```json
{
  "content": "Message text",
  "type": "text",
  "attachments": []
}
```

#### `POST /api/messages/[conversationId]/read`
Mark messages as read

Request:
```json
{
  "message_ids": ["uuid", "uuid"]
}
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:

1. **Conversations**: Users can only see conversations they're part of
2. **Messages**: Users can only see messages in their conversations
3. **Message Status**: Users can only update their own status
4. **Typing Indicators**: Users can only see typing in their conversations
5. **User Presence**: Public (everyone can see online status)
6. **Blocked Users**: Users can only manage their own blocks
7. **User Reports**: Users can create reports, admins can view all
8. **Conversation Metadata**: Users can only manage their own metadata

### Database Triggers

1. **update_conversation_timestamp**: Updates conversation `updated_at` and `last_message_at` when message is sent
2. **create_conversation_metadata**: Auto-creates metadata for participants when conversation is created
3. **increment_unread_count**: Increments unread count for recipient when message is sent

## Usage

### Starting a Conversation

```typescript
import { messagingService } from '@/lib/messaging/MessagingService'

// Get or create conversation with a user
const conversation = await messagingService.getOrCreateDirectConversation(otherUserId)
```

### Sending a Message

```typescript
await messagingService.sendMessage(
  conversationId,
  'Hello!',
  'text'
)
```

### Real-time Updates

```typescript
// Subscribe to new messages
const unsubscribe = messagingService.subscribeToMessages(
  conversationId,
  (message) => {
    console.log('New message:', message)
  }
)

// Cleanup
unsubscribe()
```

### File Upload

```typescript
import { fileUploadService } from '@/lib/messaging/FileUploadService'

// Upload image
const file = await fileUploadService.uploadImage(imageFile)

// Send message with attachment
await messagingService.sendMessage(
  conversationId,
  'Check this out!',
  'image',
  [file]
)
```

### Notifications

```typescript
import { notificationService } from '@/lib/messaging/NotificationService'

// Initialize (request permission)
await notificationService.initialize()

// Show notification
await notificationService.showMessageNotification(
  'John Doe',
  'Hey, how are you?',
  conversationId,
  avatarUrl
)
```

## Performance Optimizations

1. **Infinite Scroll**: Load messages in batches of 50
2. **Smart Auto-scroll**: Only scroll when user is at bottom
3. **Message Grouping**: Reduce visual clutter
4. **Debounced Typing**: Typing indicators auto-stop after 3s
5. **Optimistic Updates**: Instant UI feedback
6. **Real-time Subscriptions**: Efficient Supabase Realtime
7. **Image Compression**: Client-side before upload
8. **Lazy Loading**: Components load on demand

## Mobile Support

- Fully responsive layout
- Touch-optimized interactions
- Swipe gestures (future enhancement)
- Mobile keyboard handling
- Viewport-aware scrolling
- Adaptive font sizes

## Future Enhancements

- [ ] Group conversations
- [ ] Voice messages
- [ ] Video/voice calls
- [ ] Message reactions (emoji)
- [ ] Message forwarding
- [ ] Message editing
- [ ] Message deletion
- [ ] GIF support
- [ ] Stickers
- [ ] End-to-end encryption
- [ ] Message threads
- [ ] @mentions
- [ ] Rich text formatting
- [ ] Code syntax highlighting
- [ ] Link previews
- [ ] Location sharing
- [ ] Contact sharing
- [ ] Poll creation
- [ ] Scheduled messages
- [ ] Message pinning
- [ ] Conversation folders
- [ ] Multi-device sync
- [ ] Desktop app (Electron)
- [ ] Mobile app (React Native)

## Testing

To test the messaging system:

1. Create two user accounts
2. Navigate to `/messages`
3. Click "New Conversation"
4. Search for the other user
5. Start chatting!

Test scenarios:
- Send text messages
- Upload images/files
- Scroll up to load older messages
- Check typing indicators
- Verify read receipts
- Test block/report functionality
- Check notifications
- Test on mobile devices

## Troubleshooting

### Messages not appearing
- Check browser console for errors
- Verify Supabase Realtime is enabled
- Check RLS policies
- Ensure user is authenticated

### File uploads failing
- Check file size limits (5MB images, 10MB files)
- Verify Supabase Storage bucket exists
- Check file type restrictions
- Ensure proper permissions

### Notifications not working
- Check browser notification permissions
- Verify notification service is initialized
- Check if user has blocked notifications
- Test in different browsers

## Support

For issues or questions:
1. Check console logs
2. Review Supabase dashboard
3. Check database migrations
4. Verify environment variables
5. Test in incognito mode

## License

This messaging system is part of the Communify project.

