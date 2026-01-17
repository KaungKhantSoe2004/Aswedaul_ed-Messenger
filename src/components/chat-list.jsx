"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiChevronLeft,
} from "react-icons/fi"
import { TbMessageCircle } from "react-icons/tb"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import { setReduxRooms } from "../assets/slice/roomsSlice"
import { setReduxInitializedUsers } from "../assets/slice/uninitializedUsersSlice"
import { setSelectedUser } from "../assets/slice/selectedUserSlice"
import { emptySelectedChat } from "../assets/slice/selectedChatSlice"
import { chatListService } from "../assets/socket-service"

export default function ChatList({
  isMessageSent,
  isMessageReceived,
  onSelectRoom,
  onSelectUser,
  onMobileClose = null,
}) {
  const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME || ""
  const navigate = useNavigate()
  const theme = useSelector(store => store.theme.theme)
  const dispatch = useDispatch()
  const rooms = useSelector(store => store.rooms.rooms)
  const ReduxUninitializedUsers = useSelector(store => store.uninitializedUsers)
  // const [rooms, setRooms] = useState(ReduxRooms.rooms);
  console.log(rooms, 'rooms in chat list')
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState(null)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [error, setError] = useState(null)
  const [uninitializedUsers, setUninitializedUsers] = useState(ReduxUninitializedUsers.uninitializedusers)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const selectedChat = useSelector(store => store.selectedChat.selectedChat)
  const currentUser = useSelector((store) => store.currentUser.currentUser)

  const fetchRooms = async () => {
    try {
      setIsLoadingRooms(true)
      setIsRefreshing(true)
      setError(null)
      console.log(currentUser.id, 'is currentUser bro')
      const response = await axios.get(`https://socket.z256600-ll9lz.ps02.zwhhosting.com/api/rooms/${currentUser.id}`)
      console.log(response, 'is response')  
      let roomsData = []
      let uninitializedUsersData = []
      if (response.status === 200 && response.data) {
        roomsData = response.data.data || []
        uninitializedUsersData = response.data.users || []
      }
      // setRooms(roomsData)
      dispatch(setReduxRooms(roomsData))
      setUninitializedUsers(uninitializedUsersData)
      dispatch(setReduxInitializedUsers(uninitializedUsersData))

      if (!selectedChat && roomsData.length > 0 && onSelectRoom) {
        onSelectRoom(roomsData[0]._id)
      }

      return roomsData
    } catch (error) {
      console.error("Failed to fetch user rooms:", error)
      setError("Failed to load conversations.")
      setUninitializedUsers([])
    } finally {
      setIsLoadingRooms(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [currentUser.id])

  useEffect(() => {
    const handleNewMessage = (data) => {
      // setRooms(prevRooms => {
      //   const roomExists = prevRooms.some(r => r._id === data.roomId)
      //   if (!roomExists) {
      //     fetchRooms()
      //     return prevRooms
      //   }
        
      //   return prevRooms.map(room => {
      //     if (room._id === data.roomId) {
      //       const isFromCurrentUser = data.senderId === currentUser.id
      //       return {
      //         ...room,
      //         last_message: data.message.content || data.message,
      //         display_last_message: isFromCurrentUser 
      //           ? `You: ${data.message.content || data.message}`
      //           : data.message.content || data.message,
      //         updated_at: new Date().toISOString(),
      //         _moveToTop: true
      //       }
      //     }
      //     return room
      //   }).sort((a, b) => {
      //     if (a._moveToTop && !b._moveToTop) return -1
      //     if (!a._moveToTop && b._moveToTop) return 1
      //     return new Date(b.updated_at) - new Date(a.updated_at)
      //   })
      // })
    }

    if (currentUser.id) {
      chatListService.onNewMessage(handleNewMessage)
    }

    return () => {
      if (currentUser.id) {
        chatListService.offNewMessage(handleNewMessage)
      }
    }
  }, [currentUser.id])

  const getFriendInfo = (room) => {
    if (!room || !room.participants || !Array.isArray(room.participants)) {
      return null
    }

    const friend = room.participants.find((p) => p.user_id !== currentUser.id)

    if (friend) {
      const avatarUrl = friend.profile ? `${backend_domain_name}uploads/${friend.profile}` : null
      return {
        id: friend.user_id,
        name: friend.user_name || friend.name || `User ${friend.user_id}`,
        avatar: avatarUrl || friend.avatar_url,
        role: friend.role || "user",
        status: friend.status || "offline",
      }
    }

    return null
  }

  const getRoomDisplayName = (room) => {
    if (!room) return "Unknown"
    if (room.type === "private") {
      const friend = getFriendInfo(room)
      return friend?.name || "Private Chat"
    }
    return room.name || "Group Chat"
  }

  const getRoomAvatar = (room) => {
    if (!room) return "??"
    if (room.type === "private") {
      const friend = getFriendInfo(room)
      if (friend?.avatar) return friend.avatar
      if (friend?.name) {
        const nameParts = friend.name.split(" ")
        if (nameParts.length >= 2) return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
        return friend.name.slice(0, 2).toUpperCase()
      }
      return "??"
    }
    if (room.name) {
      const nameParts = room.name.split(" ")
      if (nameParts.length >= 2) return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
      return room.name.slice(0, 2).toUpperCase()
    }
    return "GC"
  }

  const getRoomStatus = (room) => {
    if (room.type === "private") {
      const friend = getFriendInfo(room)
      return friend?.status || "offline"
    }
    return "group"
  }

  const getUserAvatar = (user) => {
    if (user.profile) return `${backend_domain_name}uploads/${user.profile}`
    if (user.name) {
      const nameParts = user.name.split(" ")
      if (nameParts.length >= 2) return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
      return user.name.slice(0, 2).toUpperCase()
    }
    return "??"
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const roomResults = rooms.filter((room) => {
        const searchTerm = searchQuery.toLowerCase()
        if (room.type === "private") {
          const friend = getFriendInfo(room)
          if (friend?.name?.toLowerCase().includes(searchTerm)) return true
        }
        if (room.name?.toLowerCase().includes(searchTerm)) return true
        if (room.last_message?.toLowerCase().includes(searchTerm)) return true
        return false
      })

      const userResults = uninitializedUsers.filter((user) => {
        const searchTerm = searchQuery.toLowerCase()
        if (user.name?.toLowerCase().includes(searchTerm)) return true
        if (user.role?.toLowerCase().includes(searchTerm)) return true
        if (user.grade?.toString().includes(searchTerm)) return true
        return false
      })

      setSearchResults({ rooms: roomResults, users: userResults })
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setSearchResults(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) handleSearch()
  }

  const handleRoomClick = (roomId) => {
    if (onSelectRoom) onSelectRoom(roomId)
    setSearchResults(null)
    setSearchQuery("")
    if (onMobileClose) onMobileClose()
  }

  const handleStartNewChat = (user) => {
    if (onSelectUser) onSelectUser(user)
    dispatch(emptySelectedChat())
  }

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return ""
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString()
  }

  const getUnreadCount = (room) => {
    if (!room.unread_counts || !room.unread_counts[currentUser.id]) return 0
    return room.unread_counts[currentUser.id]
  }

  const displayData = searchResults !== null ? searchResults : { rooms: rooms, users: uninitializedUsers }
  const totalRooms = rooms.length
  const unreadRooms = rooms.filter((r) => getUnreadCount(r) > 0).length

  return (
    <div className="w-full md:w-96 flex flex-col h-full bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {onMobileClose && (
              <button onClick={onMobileClose} className="p-2 hover:bg-gray-100 rounded-full mr-2 md:hidden transition-colors">
                <FiChevronLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                <TbMessageCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{ color: theme.dark }}>ASWEDAUL_EDCHAT</h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white p-3 mb-3 border border-blue-100">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
              <img src={currentUser.profile ? `${backend_domain_name}uploads/${currentUser.profile}` : "/placeholder.svg"} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{currentUser.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{currentUser.role}</span>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>Active Now
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={handleKeyPress} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300" />
            {searchQuery.trim() && (
              <button onClick={handleClearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">×</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoadingRooms ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: theme.primary }}></div>
            <p className="mt-3 text-gray-500 text-sm">Loading messages...</p>
          </div>
        ) : displayData.rooms.length > 0 ? (
          <div>
            {displayData.rooms.map((room) => {
              const displayName = getRoomDisplayName(room)
              const avatar = getRoomAvatar(room)
              const isSelected = selectedChat === room._id
              const unreadCount = getUnreadCount(room)
              const timeAgo = getTimeAgo(room.updated_at)
              const isAvatarUrl = typeof avatar === "string" && avatar.startsWith("http")
              const isOnline = getRoomStatus(room) === 'online'
              const isGroup = room.type === 'group'

              return (
                <button key={room._id} onClick={() => handleRoomClick(room._id)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${isSelected ? "bg-blue-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {isAvatarUrl ? <img src={avatar || "/placeholder.svg"} alt={displayName} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                            <span className="text-white font-medium">{avatar}</span>
                          </div>
                        )}
                      </div>
                      {isOnline && !isGroup && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>}
                      {isGroup && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: theme.secondary }}></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timeAgo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">{room.last_message || "Say hello!"}</p>
                        {unreadCount > 0 && <div className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{unreadCount > 9 ? "9+" : unreadCount}</div>}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <TbMessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm">Your conversations will appear here</p>
          </div>
        )}

        {!searchResults && uninitializedUsers.length > 0 && (
          <div className="border-t border-gray-200 mt-2">
            <div className="px-4 py-3"><h3 className="font-medium text-gray-700">Suggested</h3></div>
            {uninitializedUsers.map((user, index) => {
              const displayName = user.name || `User ${user.userid}`
              const avatar = getUserAvatar(user)
              const isAvatarUrl = typeof avatar === "string" && avatar.startsWith("http")

              return (
                <button key={`available_${user.userid || index}`} onClick={() => handleStartNewChat(user)} disabled={isCreatingRoom} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {isAvatarUrl ? <img src={avatar || "/placeholder.svg"} alt={displayName} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                            <span className="text-white font-medium">{avatar}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm">
                        <FiPlus className="w-2.5 h-2.5" style={{ color: theme.primary }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{displayName}</h3>
                          <p className="text-sm text-gray-500">{user.role || "User"}</p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Message</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {searchResults !== null && (
          <div>
            {displayData.rooms.length > 0 && <div className="px-4 py-3 border-t border-gray-200"><h3 className="font-medium text-gray-700">Conversations</h3></div>}
            {displayData.rooms.map((room) => {
              const displayName = getRoomDisplayName(room)
              const avatar = getRoomAvatar(room)
              const isSelected = selectedChat === room._id
              const unreadCount = getUnreadCount(room)
              const timeAgo = getTimeAgo(room.updated_at)
              const isAvatarUrl = typeof avatar === "string" && avatar.startsWith("http")

              return (
                <button key={room._id} onClick={() => handleRoomClick(room._id)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${isSelected ? "bg-blue-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {isAvatarUrl ? <img src={avatar || "/placeholder.svg"} alt={displayName} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                            <span className="text-white font-medium">{avatar}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timeAgo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">{room.last_message || "Say hello!"}</p>
                        {unreadCount > 0 && <div className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{unreadCount > 9 ? "9+" : unreadCount}</div>}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            {displayData.users.length > 0 && <div className="px-4 py-3 border-t border-gray-200"><h3 className="font-medium text-gray-700">People</h3></div>}
            {displayData.users.map((user, index) => {
              const displayName = user.name || `User ${user.userid}`
              const avatar = getUserAvatar(user)
              const isAvatarUrl = typeof avatar === "string" && avatar.startsWith("http")

              return (
                <button key={`search_user_${user.userid || index}`} onClick={() => handleStartNewChat(user)} disabled={isCreatingRoom} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {isAvatarUrl ? <img src={avatar || "/placeholder.svg"} alt={displayName} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                            <span className="text-white font-medium">{avatar}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-white flex items-center justify-center shadow-sm">
                        <FiPlus className="w-2.5 h-2.5" style={{ color: theme.primary }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{displayName}</h3>
                          <p className="text-sm text-gray-500">{user.role || "User"}</p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Message</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-500">{totalRooms} conversations • {unreadRooms} unread</div>
          <div className="text-gray-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>
  )
}