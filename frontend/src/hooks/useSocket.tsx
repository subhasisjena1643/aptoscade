"use client"

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  error: string | null
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection with fallback for development
    const initSocket = () => {
      try {
        // Check if Socket.IO server is available
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

        const socketInstance = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 5000, // Reduced timeout for faster fallback
          forceNew: true,
          autoConnect: false // Don't auto-connect, we'll connect manually
        })

        // Try to connect
        socketInstance.connect()

        socketInstance.on('connect', () => {
          console.log('Socket connected:', socketInstance.id)
          setIsConnected(true)
          setError(null)
        })

        socketInstance.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason)
          setIsConnected(false)
        })

        socketInstance.on('connect_error', (err) => {
          console.warn('Socket connection failed - running in offline mode:', err.message)
          setError('Socket.IO server not available - running in demo mode')
          setIsConnected(false)

          // Don't retry connection in development
          socketInstance.disconnect()
        })

        socketInstance.on('error', (err) => {
          console.error('Socket error:', err)
          setError(err.message)
        })

        socketRef.current = socketInstance
        setSocket(socketInstance)

        return socketInstance
      } catch (err) {
        console.error('Failed to initialize socket:', err)
        setError('Socket.IO not available - demo mode active')
        return null
      }
    }

    const socketInstance = initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return {
    socket,
    isConnected,
    error
  }
}
