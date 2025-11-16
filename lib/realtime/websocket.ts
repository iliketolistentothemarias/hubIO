/**
 * WebSocket Service
 * 
 * Handles real-time communication using Socket.io
 */

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

export interface SocketUser {
  userId: string
  socketId: string
  connectedAt: Date
}

export class WebSocketService {
  private io: SocketIOServer | null = null
  private connectedUsers: Map<string, SocketUser> = new Map()

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
      },
      path: '/api/realtime/socket.io',
    })

    this.io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id)

      // Handle user authentication
      socket.on('authenticate', (data: { userId: string }) => {
        if (data.userId) {
          this.connectedUsers.set(socket.id, {
            userId: data.userId,
            socketId: socket.id,
            connectedAt: new Date(),
          })
          socket.emit('authenticated', { success: true })
        }
      })

      // Handle join room (for notifications, messaging, etc.)
      socket.on('join-room', (room: string) => {
        socket.join(room)
        socket.emit('joined-room', { room })
      })

      // Handle leave room
      socket.on('leave-room', (room: string) => {
        socket.leave(room)
        socket.emit('left-room', { room })
      })

      // Handle typing indicators
      socket.on('typing', (data: { conversationId: string; userId: string }) => {
        socket.to(data.conversationId).emit('user-typing', {
          userId: data.userId,
          conversationId: data.conversationId,
        })
      })

      socket.on('stop-typing', (data: { conversationId: string; userId: string }) => {
        socket.to(data.conversationId).emit('user-stopped-typing', {
          userId: data.userId,
          conversationId: data.conversationId,
        })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
        this.connectedUsers.delete(socket.id)
      })
    })

    return this.io
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return

    this.connectedUsers.forEach((user, socketId) => {
      if (user.userId === userId) {
        this.io!.to(socketId).emit(event, data)
      }
    })
  }

  /**
   * Send message to room
   */
  sendToRoom(room: string, event: string, data: any): void {
    if (!this.io) return
    this.io.to(room).emit(event, data)
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    if (!this.io) return
    this.io.emit(event, data)
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    for (const user of this.connectedUsers.values()) {
      if (user.userId === userId) {
        return true
      }
    }
    return false
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null

export function getWebSocketService(): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService()
  }
  return websocketService
}

