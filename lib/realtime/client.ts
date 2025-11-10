/**
 * WebSocket Client
 * 
 * Client-side WebSocket connection management
 */

'use client'

// Optional socket.io-client import
let io: any = null
let Socket: any = null
try {
  const socketIO = require('socket.io-client')
  io = socketIO.default || socketIO
  Socket = socketIO.Socket
} catch (e) {
  // socket.io-client not installed - will use mock
  console.warn('socket.io-client not installed, using mock realtime client')
  // Create mock io function
  io = () => ({
    on: () => {},
    emit: () => {},
    off: () => {},
    close: () => {},
  })
}

import { useEffect, useRef, useState } from 'react'

export interface UseSocketOptions {
  userId?: string
  autoConnect?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export function useSocket(options: UseSocketOptions = {}) {
  const { userId, autoConnect = true, onConnect, onDisconnect, onError } = options
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (!autoConnect || !io) return

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || '/api/realtime'
    const newSocket = io(socketUrl, {
      path: '/api/realtime/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
      reconnectAttempts.current = 0

      // Authenticate if userId provided
      if (userId) {
        newSocket.emit('authenticate', { userId })
      }

      onConnect?.()
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
      onDisconnect?.()
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      reconnectAttempts.current++
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        onError?.(error)
      }
    })

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [userId, autoConnect, onConnect, onDisconnect, onError])

  const joinRoom = (room: string) => {
    if (socket) {
      socket.emit('join-room', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socket) {
      socket.emit('leave-room', room)
    }
  }

  const emit = (event: string, data: any) => {
    if (socket) {
      socket.emit(event, data)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off,
  }
}

