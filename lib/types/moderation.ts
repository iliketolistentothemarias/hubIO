/**
 * Moderation Types
 */

export interface ModerationAction {
  id: string
  type: 'resource' | 'post' | 'comment' | 'campaign' | 'event'
  itemId: string
  action: 'approve' | 'reject' | 'flag' | 'delete' | 'edit'
  adminId: string
  adminName: string
  reason?: string
  automated: boolean
  createdAt: Date
}

export interface ContentFlag {
  id: string
  type: 'resource' | 'post' | 'comment' | 'campaign' | 'event'
  itemId: string
  reportedBy: string
  reportedByName: string
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface ModerationRule {
  id: string
  name: string
  type: 'keyword' | 'pattern' | 'spam' | 'profanity' | 'custom'
  pattern: string
  action: 'flag' | 'auto-reject' | 'auto-approve' | 'notify'
  enabled: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

