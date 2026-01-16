// socket-service.js
import { io } from "socket.io-client"

let socket = null
let listeners = {}
let isInitialized = false

const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
}

// Initialize socket connection
export const initializeSocket = (url = "https://socket.z256600-ll9lz.ps02.zwhhosting.com", userId) => {
  if (socket && socket.connected) {
    return socket
  }
  socket = io(url, {
    ...SOCKET_CONFIG,
    auth: {
      userId: userId 
    }
  })
  
  isInitialized = true

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id)
    emitToListeners("connect", socket.id)
  })

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason)
    emitToListeners("disconnect", reason)
  })

  socket.on("error", (error) => {
    console.error("Socket error:", error)
    emitToListeners("error", error)
  })

  socket.on("reconnect", (attemptNumber) => {
    console.log("Socket reconnected, attempt:", attemptNumber)
    emitToListeners("reconnect", attemptNumber)
  })

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("Reconnection attempt:", attemptNumber)
    emitToListeners("reconnect_attempt", attemptNumber)
  })

  setupChatListeners()

  return socket
}
// Get socket instance
export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket() first.")
  }
  return socket
}

// Check if socket is connected
export const isSocketConnected = () => {
  return socket && socket.connected
}

// Emit an event
export const emitEvent = (eventName, data) => {
  if (!socket) {
    console.error("Cannot emit event: Socket not initialized")
    return false
  }

  try {
    socket.emit(eventName, data)
    return true
  } catch (error) {
    console.error("Error emitting event:", error)
    return false
  }
}

// Register a listener for an event
export const registerListener = (eventName, callback) => {
  if (!socket) {
    console.error("Cannot register listener: Socket not initialized")
    return
  }

  if (!listeners[eventName]) {
    listeners[eventName] = []
  }

  if (!listeners[eventName].includes(callback)) {
    listeners[eventName].push(callback)
    // Only set up the socket listener once per event type
    if (listeners[eventName].length === 1) {
      socket.on(eventName, (data) => {
        emitToListeners(eventName, data)
      })
    }
  }
}

// Remove a specific listener
export const removeListener = (eventName, callback) => {
  if (listeners[eventName]) {
    const index = listeners[eventName].indexOf(callback)
    if (index > -1) {
      listeners[eventName].splice(index, 1)
    }
    
    // If no more listeners for this event, remove from socket
    if (listeners[eventName].length === 0) {
      if (socket) {
        socket.off(eventName)
      }
      delete listeners[eventName]
    }
  }
}

// Remove all listeners for an event
export const removeAllListeners = (eventName) => {
  if (socket) {
    socket.off(eventName)
  }
  delete listeners[eventName]
}

// Clean up all listeners and disconnect
export const cleanup = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  listeners = {}
  isInitialized = false
}

// Setup chat-specific listeners
const setupChatListeners = () => {
  if (!socket) return

  // Common chat events that might be used by multiple components
  const chatEvents = [
    'receive_message',
    'new-message',
    'user_typing',
    'user_stopped_typing',
    'message_updated',
    'message_deleted',
    'reaction_updated',
    'room_error',
    'message_error',
    'join_error'
  ]

  chatEvents.forEach(event => {
    socket.on(event, (data) => {
      if(event == "receive_message"){
        alert("Message Received ")
      }
      emitToListeners(event, data)
    })
  })
}

// Private helper to emit to all registered listeners
const emitToListeners = (eventName, data) => {
  if (listeners[eventName]) {
    listeners[eventName].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in listener for ${eventName}:`, error)
      }
    })
  }
}

// Chat Room specific methods
export const chatRoomService = {
  // Join a room
  joinRoom: (roomId, userId) => {
    return emitEvent("join_room", { roomId, userId })
  },

  // Leave a room
  leaveRoom: (roomId, userId) => {
    return emitEvent("leave_room", { roomId, userId })
  },

  // Send a message
  sendMessage: (messageData) => {
    return emitEvent("send_message", messageData)
  },

  // Typing indicator
  sendTyping: (roomId, userId) => {
    return emitEvent("typing", { roomId, userId })
  },

  // Stop typing indicator
  sendStopTyping: (roomId, userId) => {
    return emitEvent("stop_typing", { roomId, userId })
  },

  // Update a message
  updateMessage: (roomId, messageId, content, userId) => {
    return emitEvent("update_message", { roomId, messageId, content, userId })
  },

  // Delete a message
  deleteMessage: (roomId, messageId, userId) => {
    return emitEvent("delete_message", { roomId, messageId, userId })
  },

  // Add reaction
  addReaction: (roomId, messageId, userId, reaction) => {
    return emitEvent("add_reaction", { roomId, messageId, userId, reaction })
  },

  // Register message listener
  onMessageReceived: (callback) => {
    registerListener("receive_message", callback);
  },

  // Register typing listener
  onUserTyping: (callback) => {
    registerListener("user_typing", callback)
  },

  // Register stop typing listener
  onUserStoppedTyping: (callback) => {
    registerListener("user_stopped_typing", callback)
  },

  // Register message update listener
  onMessageUpdated: (callback) => {
    registerListener("message_updated", callback)
  },

  // Register message delete listener
  onMessageDeleted: (callback) => {
    registerListener("message_deleted", callback)
  },

  // Register reaction update listener
  onReactionUpdated: (callback) => {
    registerListener("reaction_updated", callback)
  },

  // Register error listener
  onRoomError: (callback) => {
    registerListener("room_error", callback)
  },

  // Register message error listener
  onMessageError: (callback) => {
    registerListener("message_error", callback)
  },

  // Register join error listener
  onJoinError: (callback) => {
    registerListener("join_error", callback)
  }
}

// Chat List specific methods
export const chatListService = {
  // Register new message listener (for updating chat list)
  onNewMessage: (callback) => {
    registerListener("new-message", callback)
  },

  // Remove new message listener
  offNewMessage: (callback) => {
    removeListener("new-message", callback)
  }
}

// General socket methods
export const socketService = {
  // Connection status
  onConnect: (callback) => {
    registerListener("connect", callback)
  },

  onDisconnect: (callback) => {
    registerListener("disconnect", callback)
  },

  onConnectionStatus: (callback) => {
    registerListener("connect", () => callback(true))
    registerListener("disconnect", () => callback(false))
  },

  // Get socket ID
  getSocketId: () => {
    return socket?.id
  },

  // Manual reconnection
  reconnect: () => {
    if (socket) {
      socket.connect()
    }
  },

  // Disconnect manually
  disconnect: () => {
    if (socket) {
      socket.disconnect()
    }
  }
}

export default {
  initializeSocket,
  getSocket,
  isSocketConnected,
  emitEvent,
  registerListener,
  removeListener,
  removeAllListeners,
  cleanup,
  chatRoomService,
  chatListService,
  socketService
}