"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  FiSend,
  FiMoreVertical,
  FiPhone,
  FiVideo,
  FiSmile,
  FiImage,
  FiFile,
  FiMic,
  FiCheckCircle,
  FiCalendar,
  FiChevronLeft,
  FiTrash2,
  FiMessageCircle,
  FiEdit2,
  FiX,
  FiSave,
  FiUsers,
  FiChevronRight,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiSettings,
  FiBell,
} from "react-icons/fi"
import { BsThreeDotsVertical } from "react-icons/bs"
import { IoMdAttach } from "react-icons/io"
import { useSelector } from "react-redux"
import { emptyCurrentUser } from "../assets/slice/currentUserSlice"
import { current } from "@reduxjs/toolkit"
import { chatRoomService, socketService } from "../assets/socket-service"
import { reSortingRooms } from "../assets/slice/roomsSlice"
import { useDispatch } from "react-redux"

export default function ChatRoom({
  isMessageSent,
  isMessageReceived,
  currentUser,
  setIsMessageSent,
  setIsMessageReceived,
  onBack = null,
  isMobile = false,
  onMobileMenu = null,
  onLogout = null,
}) {
  const roomId = useSelector(state => state.selectedChat.selectedChat)
  const uninitializedUser = useSelector(state => state.selectedUser.selectedUser)

  if (roomId) {
    return (
      <ChatRoomWithRoom
        isMessageSent={isMessageSent}
        isMessageReceived={isMessageReceived}
        currentUser={currentUser}
        setIsMessageSent={setIsMessageSent}
        setIsMessageReceived={setIsMessageReceived}
        onBack={onBack}
        isMobile={isMobile}
        onMobileMenu={onMobileMenu}
        onLogout={onLogout}
        roomId={roomId}
      />
    )
  } else if (uninitializedUser) {
    return (
      <StartConversationView
        currentUser={currentUser}
        uninitializedUser={uninitializedUser}
        isMobile={isMobile}
        onBack={onBack}
        onMobileMenu={onMobileMenu}
        onLogout={onLogout}
      />
    )
  } else {
    return (
      <EmptyChatState
        isMobile={isMobile}
        onBack={onBack}
        onMobileMenu={onMobileMenu}
        currentUser={currentUser}
        onLogout={onLogout}
      />
    )
  }
}

function ChatRoomWithRoom({
  isMessageSent,
  isMessageReceived,
  currentUser,
  setIsMessageSent,
  setIsMessageReceived,
  onBack,
  isMobile,
  onMobileMenu,
  onLogout,
  roomId,
}) {
  const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME || ""
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [userTyping, setUserTyping] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [roomDetails, setRoomDetails] = useState(null)
  const [error, setError] = useState(null)
  const dispatch = useDispatch();
  const [isOnline, setIsOnline] = useState(true)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeMessageMenu, setActiveMessageMenu] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [messageReactions, setMessageReactions] = useState({})
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const theme = useSelector(store => store.theme.theme)
  const typingTimeoutRef = useRef(null)
  const messageInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const userDropdownRef = useRef(null)
  const socket_domain_name = import.meta.env.VITE_SOCKET_DOMAIN_NAME || "http://localhost:4000/"

  const getOtherUser = () => {
    if (!roomDetails || roomDetails.type !== "private") return null
    return roomDetails.participants?.find((p) => p.user_id !== currentUser.id)
  }

  const getSenderInfo = (senderId) => {
    if (senderId === currentUser.id) {
      return {
        name: currentUser.name,
        profile: currentUser.profile,
        avatar: getInitials(currentUser.name),
      }
    }

    if (roomDetails?.type === "private") {
      const otherUser = getOtherUser()
      return {
        name: otherUser?.user_name || otherUser?.name || `User ${senderId}`,
        profile: otherUser?.profile,
        avatar: getInitials(otherUser?.user_name || otherUser?.name || `User ${senderId}`),
      }
    }

    const participant = roomDetails?.participants?.find((p) => p.user_id === senderId)
    return {
      name: participant?.user_name || participant?.name || `User ${senderId}`,
      profile: participant?.profile,
      avatar: getInitials(participant?.user_name || participant?.name || `User ${senderId}`),
    }
  }

  const getInitials = (name) => {
    if (!name) return "??"
    const nameParts = name.split(" ")
    if (nameParts.length >= 2) return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      return ""
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ""
    try {
      const date = new Date(timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) return "Today"
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      })
    } catch (e) {
      return ""
    }
  }

  const getRoomName = () => {
    if (!roomDetails) return "Loading..."
    if (roomDetails.type === "private") {
      const otherUser = getOtherUser()
      return otherUser?.user_name || otherUser?.name || "Private Chat"
    }
    return roomDetails.name || "Group Chat"
  }

  const getRoomProfile = () => {
    if (!roomDetails) return null
    if (roomDetails.type === "private") {
      const otherUser = getOtherUser()
      if (otherUser?.profile) return otherUser.profile
    }
    return null
  }

  const renderProfile = (profileUrl, fallbackInitials, className = "", isOwn = false) => {
    if (profileUrl) {
      return (
        <img
          src={`${backend_domain_name}uploads/${profileUrl}`}
          alt="Profile"
          className={`${className} object-cover`}
          onError={(e) => { e.target.style.display = "none" }}
        />
      )
    }
    return (
      <div
        className={`${className} flex items-center justify-center font-semibold`}
        style={{ backgroundColor: isOwn ? theme.primary : theme.secondary, color: theme.white }}
      >
        {fallbackInitials}
      </div>
    )
  }

  const fetchRoomData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await axios.get(`${socket_domain_name}api/getRoomWithMessages/${roomId}`)
      if (response.data) {
        const data = response.data.data
        if (data) {
          setRoomDetails(data.room)
          setMessages(data.messages || [])
        } else if (data.data) {
          setRoomDetails(data.data)
          setMessages(data.data.messages || [])
        } else {
          setRoomDetails(data)
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch room:", error)
      setError("Failed to load conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageReceived = (incomingMsg) => {
    if (incomingMsg.room_id === roomId || incomingMsg.chat_id === roomId) {
      setMessages((prev) => {
        const filteredMessages = prev.filter(msg => {
          if (msg._id && msg._id.startsWith("temp_")) {
            const isOurTempMessage = msg.sender_id === currentUser.id
            const hasSameContent = msg.content === incomingMsg.content
            if (isOurTempMessage && hasSameContent) return false
          }
          // setIsMessageReceived(prev => !prev)
          return true
        })
        const alreadyExists = filteredMessages.some(msg => msg._id === incomingMsg._id)
        if (alreadyExists) return filteredMessages
        return [...filteredMessages, incomingMsg]
      })

      dispatch(reSortingRooms({room_id: incomingMsg.room_id, message: incomingMsg.content}));
    }
  }

  const handleUserTyping = (data) => {
    if (data.roomId === roomId && data.userId !== currentUser.id) {
      const senderInfo = getSenderInfo(data.userId)
      setUserTyping(senderInfo.name)
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setUserTyping(null), 2000)
    }
  }

  const handleUserStoppedTyping = (data) => {
    if (data.roomId === roomId && data.userId !== currentUser.id) {
      setUserTyping(null)
    }
  }

  const handleMessageUpdated = (data) => {
    if (data.roomId === roomId) {
      setMessages((prev) => prev.map((msg) => 
        msg._id === data.messageId ? { ...msg, content: data.content, updated_at: data.updated_at } : msg
      ))
    }
  }

  const handleMessageDeleted = (data) => {
    if (data.roomId === roomId) {
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId))
    }
  }

  const handleReactionUpdated = (data) => {
    if (data.roomId === roomId) {
      setMessageReactions(prev => ({ ...prev, [data.messageId]: data.reactions }))
    }
  }

  const handleRoomError = (data) => {
    console.error("Room error:", data)
    setError(data.error || "Room error occurred")
  }

  const handleMessageError = (data) => {
    console.error("Message error:", data)
    setError(data.error || "Failed to send message")
  }

  const handleJoinError = (data) => {
    console.error("Join error:", data)
    setError(data.error || "Failed to join room")
  }

  const handleSocketConnected = () => {
    console.log("✅ Socket connected")
    setIsOnline(true)
    if (roomId) chatRoomService.joinRoom(roomId, currentUser.id)
  }

  const handleSocketDisconnected = () => {
    console.log("❌ Socket disconnected")
    setIsOnline(false)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !roomId) return
    const messageData = {
      room_id: roomId,
      sender_id: currentUser.id,
      content: newMessage.trim(),
      type: "text",
      attachments: [],
    }
    chatRoomService.sendMessage(messageData);
    console.log("memssage sent")
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      ...messageData,
      createdAt: new Date().toISOString(),
      status: "sending",
    }
    setMessages((prev) => [...prev, tempMessage])
    setIsMessageSent(prev => !prev)
    setNewMessage("")
    chatRoomService.sendStopTyping(roomId, currentUser.id)
  }

  const updateMessage = (messageId) => {
    if (!editContent.trim() || !roomId) return
    chatRoomService.updateMessage(roomId, messageId, editContent.trim(), currentUser.id)
    setEditingMessage(null)
    setEditContent("")
  }

  const deleteMessage = (messageId) => {
    if (!roomId) return
    chatRoomService.deleteMessage(roomId, messageId, currentUser.id)
    setActiveMessageMenu(null)
  }

  const startEditing = (message) => {
    setEditingMessage(message._id)
    setEditContent(message.content)
    setActiveMessageMenu(null)
  }

  const cancelEditing = () => {
    setEditingMessage(null)
    setEditContent("")
  }

  const handleFileUpload = (fileType) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = fileType === "image" ? "image/*" : fileType === "video" ? "video/*" : fileType === "audio" ? "audio/*" : ".pdf,.doc,.docx,.txt"
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file && roomId) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("room_id", roomId)
        formData.append("sender_id", currentUser.id)
        formData.append("type", fileType)
        try {
          const response = await axios.post(`${socket_domain_name}/api/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          if (response.data?.url) {
            const messageData = {
              room_id: roomId,
              sender_id: currentUser.id,
              content: `[${fileType.toUpperCase()}] ${file.name}`,
              type: fileType,
              attachments: [{ url: response.data.url, name: file.name, type: fileType }],
            }
            chatRoomService.sendMessage(messageData)
            const tempMsg = {
              _id: `temp_file_${Date.now()}`,
              ...messageData,
              createdAt: new Date().toISOString(),
              status: "sending",
            }
            setMessages((prev) => [...prev, tempMsg])
          }
        } catch (error) {
          console.error("Upload failed:", error)
          setError("Failed to upload file")
        }
      }
    }
    input.click()
    setShowAttachmentMenu(false)
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    if (e.target.value.trim() && roomId) {
      chatRoomService.sendTyping(roomId, currentUser.id)
    } else if (roomId) {
      chatRoomService.sendStopTyping(roomId, currentUser.id)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (editingMessage) updateMessage(editingMessage)
      else sendMessage()
    }
  }

  const addReaction = (messageId, reaction) => {
    chatRoomService.addReaction(roomId, messageId, currentUser.id, reaction)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (messageInputRef.current) messageInputRef.current.focus()
  }, [])
useEffect(() => {
  fetchRoomData()
  chatRoomService.joinRoom(roomId, currentUser.id)
  
  const unsubscribeConnection = socketService.onConnectionStatus((isConnected) => {
    if(isConnected){
      console.log('true')
    }else{
      console.log("false")
    }
    if (isConnected) handleSocketConnected()
    else handleSocketDisconnected()
  })
  
  const unsubscribeMessageReceived = chatRoomService.onMessageReceived(handleMessageReceived)
  const unsubscribeUserTyping = chatRoomService.onUserTyping(handleUserTyping)
  const unsubscribeUserStoppedTyping = chatRoomService.onUserStoppedTyping(handleUserStoppedTyping)
  const unsubscribeMessageUpdated = chatRoomService.onMessageUpdated(handleMessageUpdated)
  const unsubscribeMessageDeleted = chatRoomService.onMessageDeleted(handleMessageDeleted)
  const unsubscribeReactionUpdated = chatRoomService.onReactionUpdated(handleReactionUpdated)
  const unsubscribeRoomError = chatRoomService.onRoomError(handleRoomError)
  const unsubscribeMessageError = chatRoomService.onMessageError(handleMessageError)
  const unsubscribeJoinError = chatRoomService.onJoinError(handleJoinError)

  return () => {
    chatRoomService.leaveRoom(roomId, currentUser.id)
    
    // Call the unsubscribe functions if they exist
    unsubscribeConnection && unsubscribeConnection()
    unsubscribeMessageReceived && unsubscribeMessageReceived()
    unsubscribeUserTyping && unsubscribeUserTyping()
    unsubscribeUserStoppedTyping && unsubscribeUserStoppedTyping()
    unsubscribeMessageUpdated && unsubscribeMessageUpdated()
    unsubscribeMessageDeleted && unsubscribeMessageDeleted()
    unsubscribeReactionUpdated && unsubscribeReactionUpdated()
    unsubscribeRoomError && unsubscribeRoomError()
    unsubscribeMessageError && unsubscribeMessageError()
    unsubscribeJoinError && unsubscribeJoinError()
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }
}, [roomId])

  const quickReactions = [
    { emoji: "👍", label: "thumbs up" },
    { emoji: "❤️", label: "heart" },
    { emoji: "😂", label: "laughing" },
    { emoji: "😮", label: "wow" },
    { emoji: "😢", label: "sad" },
    { emoji: "🔥", label: "fire" },
  ]

  return (
    <ChatRoomUI
      isMobile={isMobile}
      onBack={onBack}
      onMobileMenu={onMobileMenu}
      currentUser={currentUser}
      onLogout={onLogout}
      theme={theme}
      showUserDropdown={showUserDropdown}
      setShowUserDropdown={setShowUserDropdown}
      userDropdownRef={userDropdownRef}
      roomDetails={roomDetails}
      getRoomName={getRoomName}
      getRoomProfile={getRoomProfile}
      renderProfile={renderProfile}
      isOnline={isOnline}
      userTyping={userTyping}
      getInitials={getInitials}
      isLoading={isLoading}
      messages={messages}
      messagesEndRef={messagesEndRef}
      getSenderInfo={getSenderInfo}
      formatDate={formatDate}
      formatTime={formatTime}
      activeMessageMenu={activeMessageMenu}
      setActiveMessageMenu={setActiveMessageMenu}
      editingMessage={editingMessage}
      editContent={editContent}
      setEditContent={setEditContent}
      updateMessage={updateMessage}
      cancelEditing={cancelEditing}
      deleteMessage={deleteMessage}
      startEditing={startEditing}
      messageReactions={messageReactions}
      quickReactions={quickReactions}
      addReaction={addReaction}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      messageInputRef={messageInputRef}
      handleTyping={handleTyping}
      handleKeyPress={handleKeyPress}
      sendMessage={sendMessage}
      showAttachmentMenu={showAttachmentMenu}
      setShowAttachmentMenu={setShowAttachmentMenu}
      handleFileUpload={handleFileUpload}
      showEmojiPicker={showEmojiPicker}
      setShowEmojiPicker={setShowEmojiPicker}
      scrollToBottom={scrollToBottom}
      backend_domain_name={backend_domain_name}
    />
  )
}

function StartConversationView({
  currentUser,
  uninitializedUser,
  isMobile,
  onBack,
  onMobileMenu,
  onLogout,
}) {
  const theme = useSelector(store => store.theme.theme)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef(null)
  const socket_domain_name = import.meta.env.VITE_SOCKET_DOMAIN_NAME || "http://localhost:4000/"

  const getInitials = (name) => {
    if (!name) return "??"
    const nameParts = name.split(" ")
    if (nameParts.length >= 2) return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const renderProfile = (profileUrl, fallbackInitials, className = "", isOwn = false) => {
    const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME || ""
    if (profileUrl) {
      return (
        <img src={`${backend_domain_name}uploads/${profileUrl}`} alt="Profile" className={`${className} object-cover`} onError={(e) => { e.target.style.display = "none" }} />
      )
    }
    return (
      <div className={`${className} flex items-center justify-center font-semibold`} style={{ backgroundColor: isOwn ? theme.primary : theme.secondary, color: theme.white }}>
        {fallbackInitials}
      </div>
    )
  }

  const handleStartConversation = async() => {
    const participants  = [ { user_id: currentUser.id }, { user_id: uninitializedUser.userid }]
    const response = await axios.post(`${socket_domain_name}api/createRoom`, {
      sender_id: currentUser.id,
      participants,
      type: "private",
      name: `Chat between ${currentUser.name} and ${uninitializedUser.name}`, 
    })
    if(response.status == 200) window.location.reload()
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');.orbitron{font-family:'Orbitron',sans-serif;letter-spacing:0.5px;}`}</style>
      <ChatHeader isMobile={isMobile} onBack={onBack} onMobileMenu={onMobileMenu} currentUser={currentUser} showUserDropdown={showUserDropdown} setShowUserDropdown={setShowUserDropdown} userDropdownRef={userDropdownRef} theme={theme} renderProfile={renderProfile} getInitials={getInitials} title={uninitializedUser.name} showStatus={false} showCallButtons={false} />
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-md w-full">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-3xl bg-white flex items-center justify-center mx-auto shadow-lg border">
              {renderProfile(uninitializedUser.profile, getInitials(uninitializedUser.name), "w-full h-full rounded-3xl")}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg border">
              <FiMessageCircle className="w-6 h-6" style={{ color: theme.primary }} />
            </div>
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold orbitron mb-2" style={{ color: theme.primary }}>{uninitializedUser.name}</h1>
            {uninitializedUser.role && <p className="text-gray-600 mb-1"><span className="font-medium">Role:</span> {uninitializedUser.role}</p>}
            {uninitializedUser.grade && <p className="text-gray-600 mb-1"><span className="font-medium">Grade:</span> {uninitializedUser.grade}</p>}
            <div className="mt-4"><div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-sm text-blue-700 font-medium">Ready to chat</span></div></div>
          </div>
          <button onClick={handleStartConversation} className="px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow mx-auto" style={{ background: theme.primary, color: theme.white }}>
            <FiMessageCircle className="inline mr-2" size={20} />Start Conversation With Hi!
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyChatState({ isMobile, onBack, onMobileMenu, currentUser, onLogout }) {
  const theme = useSelector(store => store.theme.theme)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef(null)
  const getInitials = (name) => {
    if (!name) return "??"
    const nameParts = name.split(" ")
    if (nameParts.length >= 2) return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  const renderProfile = (profileUrl, fallbackInitials, className = "", isOwn = false) => {
    const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME || ""
    if (profileUrl) return <img src={`${backend_domain_name}uploads/${profileUrl}`} alt="Profile" className={`${className} object-cover`} onError={(e) => { e.target.style.display = "none" }} />
    return <div className={`${className} flex items-center justify-center font-semibold`} style={{ backgroundColor: isOwn ? theme.primary : theme.secondary, color: theme.white }}>{fallbackInitials}</div>
  }
  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <ChatHeader isMobile={isMobile} onBack={onBack} onMobileMenu={onMobileMenu} currentUser={currentUser} showUserDropdown={showUserDropdown} setShowUserDropdown={setShowUserDropdown} userDropdownRef={userDropdownRef} theme={theme} renderProfile={renderProfile} getInitials={getInitials} title="Messages" showStatus={false} showCallButtons={false} />
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="relative mb-8"><div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto shadow"><FiMessageCircle className="w-16 h-16" style={{ color: theme.primary }} /></div></div>
          <h1 className="text-3xl font-bold orbitron mb-4" style={{ color: theme.primary }}>Start a Conversation</h1>
          <p className="text-gray-500 mb-8 text-lg">Select a chat from the sidebar or create a new conversation to get started</p>
        </div>
      </div>
    </div>
  )
}

function ChatHeader({
  isMobile,
  onBack,
  onMobileMenu,
  currentUser,
  showUserDropdown,
  setShowUserDropdown,
  userDropdownRef,
  theme,
  renderProfile,
  getInitials,
  title,
  subtitle,
  isOnline = true,
  userTyping = null,
  roomDetails = null,
  showStatus = true,
  showCallButtons = true,
  getRoomProfile = null,
  getRoomName = null,
}) {
  return (
    <>
      {isMobile && (
        <div className="px-4 py-3 bg-white shadow flex items-center gap-3 border-b flex-shrink-0">
          <button onClick={onMobileMenu} className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200" style={{ color: theme.primary }}><FiChevronLeft size={20} /></button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden shadow">
                {getRoomProfile && getRoomName ? renderProfile(getRoomProfile(), getInitials(getRoomName()), "w-full h-full") : <div className="w-full h-full flex items-center justify-center bg-gray-200"><FiUser size={20} className="text-gray-400" /></div>}
              </div>
              {showStatus && <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"} shadow-sm`} />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base orbitron truncate" style={{ color: theme.dark }}>{title}</h2>
              {showStatus && <p className="text-xs flex items-center gap-1 text-gray-500 truncate"><span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />{userTyping ? <span className="text-xs" style={{ color: theme.primary }}>{userTyping} is typing...</span> : roomDetails?.type === "group" ? `${roomDetails.participants?.length || 0} members` : isOnline ? "Online" : "Offline"}</p>}
            </div>
          </div>
          {showCallButtons && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200" style={{ color: theme.primary }}><FiPhone size={18} /></button>
              <button className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200" style={{ color: theme.primary }}><FiVideo size={18} /></button>
            </div>
          )}
        </div>
      )}
      {!isMobile && (
        <div className="px-6 py-4 bg-white shadow flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && <button onClick={onBack} className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: theme.primary }}><FiChevronLeft size={22} /></button>}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden shadow">
                  {getRoomProfile && getRoomName ? renderProfile(getRoomProfile(), getInitials(getRoomName()), "w-full h-full") : <div className="w-full h-full flex items-center justify-center bg-gray-200"><FiUser size={24} className="text-gray-400" /></div>}
                </div>
                {showStatus && <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"} shadow-sm`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-xl orbitron truncate" style={{ color: theme.dark }}>{title}</h2>
                  {roomDetails?.type === "group" && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded shadow-sm whitespace-nowrap"><FiUsers size={10} className="inline mr-1" />Group</span>}
                </div>
                {showStatus && <p className="text-sm flex items-center gap-2 text-gray-500 truncate">
                  {userTyping ? <span className="flex items-center gap-2" style={{ color: theme.primary }}><span className="flex gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span><span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.1s" }}></span><span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.2s" }}></span></span><span className="truncate">{userTyping} is typing...</span></span> : <span className="flex items-center gap-2 truncate"><span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />{roomDetails?.type === "group" ? `${roomDetails.participants?.length || 0} members` : isOnline ? "Online" : "Offline"}</span>}
                </p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {showCallButtons && (
                <>
                  <button className="p-3 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: theme.primary }}><FiPhone size={20} /></button>
                  <button className="p-3 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: theme.primary }}><FiVideo size={20} /></button>
                </>
              )}
              <div className="relative" ref={userDropdownRef}>
                <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: theme.primary }}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden">{renderProfile(currentUser.profile, getInitials(currentUser.name), "w-full h-full", true)}</div>
                  <FiChevronDown className={`transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} size={16} />
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border z-50 py-2">
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">{renderProfile(currentUser.profile, getInitials(currentUser.name), "w-full h-full", true)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate" style={{ color: theme.dark }}>{currentUser.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{currentUser.email || "User"}</p>
                          <div className="flex items-center gap-1 mt-1"><span className={`w-2 h-2 rounded-full ${true ? 'bg-green-500' : 'bg-gray-400'}`}></span><span className="text-xs text-gray-500">{true ? 'Online' : 'Offline'}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setShowUserDropdown(false)}><FiUser size={16} style={{ color: theme.primary }} /><span>My Profile</span></button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setShowUserDropdown(false)}><FiSettings size={16} style={{ color: theme.primary }} /><span>Settings</span></button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors" onClick={() => setShowUserDropdown(false)}><FiBell size={16} style={{ color: theme.primary }} /><span>Notifications</span></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ChatRoomUI({
  isMobile,
  onBack,
  onMobileMenu,
  currentUser,
  onLogout,
  theme,
  showUserDropdown,
  setShowUserDropdown,
  userDropdownRef,
  renderProfile,
  getInitials,
  roomDetails,
  getRoomName,
  getRoomProfile,
  isOnline,
  userTyping,
  isLoading,
  messages,
  messagesEndRef,
  getSenderInfo,
  formatDate,
  formatTime,
  activeMessageMenu,
  setActiveMessageMenu,
  editingMessage,
  editContent,
  setEditContent,
  updateMessage,
  cancelEditing,
  deleteMessage,
  startEditing,
  messageReactions,
  quickReactions,
  addReaction,
  newMessage,
  setNewMessage,
  messageInputRef,
  handleTyping,
  handleKeyPress,
  sendMessage,
  showAttachmentMenu,
  setShowAttachmentMenu,
  handleFileUpload,
  showEmojiPicker,
  setShowEmojiPicker,
  scrollToBottom,
  backend_domain_name,
}) {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        .orbitron{font-family:'Orbitron',sans-serif;letter-spacing:0.5px;}
        .orbitron-bold{font-family:'Orbitron',sans-serif;font-weight:800;letter-spacing:1px;}
        .chat-messages-container{scrollbar-width:thin;scrollbar-color:#5F9EA0 #f1f5f9;}
        .chat-messages-container::-webkit-scrollbar{width:4px;}
        .chat-messages-container::-webkit-scrollbar-track{background:#f1f5f9;border-radius:2px;}
        .chat-messages-container::-webkit-scrollbar-thumb{background:#5F9EA0;border-radius:2px;}
        .chat-messages-container::-webkit-scrollbar-thumb:hover{background:#4682B4;}
        .no-horizontal-scroll{overflow-x:hidden!important;max-width:100vw!important;}
        .message-content{word-break:break-word;overflow-wrap:break-word;max-width:100%;}
      `}</style>
      <ChatHeader isMobile={isMobile} onBack={onBack} onMobileMenu={onMobileMenu} currentUser={currentUser} showUserDropdown={showUserDropdown} setShowUserDropdown={setShowUserDropdown} userDropdownRef={userDropdownRef} theme={theme} renderProfile={renderProfile} getInitials={getInitials} title={getRoomName()} isOnline={isOnline} userTyping={userTyping} roomDetails={roomDetails} getRoomProfile={getRoomProfile} getRoomName={getRoomName} showStatus={true} showCallButtons={true} />
      <div className="chat-messages-container no-horizontal-scroll flex-1 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="h-full flex items-center justify-center p-4"><div className="text-center"><div className="w-16 h-16 rounded-xl bg-gray-100 animate-pulse mx-auto mb-3"></div><p className="text-gray-500 text-sm">Loading messages...</p></div></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="relative mb-6 max-w-full px-4">
              <div className={`${isMobile ? "w-32 h-32" : "w-40 h-40"} rounded-xl bg-gray-100 flex items-center justify-center mx-auto shadow max-w-full`}>
                <div className="relative"><FiMessageCircle className={`${isMobile ? "w-20 h-20" : "w-24 h-24"}`} style={{ color: theme.primary }} /><div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow"><FiSend className="w-5 h-5" style={{ color: theme.primary }} /></div></div>
              </div>
            </div>
            <h3 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold orbitron mb-3 text-center px-4`} style={{ color: theme.primary }}>Start chatting with {getRoomName()}</h3>
            <p className="text-gray-500 text-center mb-6 px-4 max-w-full">No messages yet. Send your first message to begin the conversation!</p>
            <button onClick={() => setNewMessage("Hello! 👋 How are you doing?")} className="px-5 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:shadow transition-all duration-300 shadow border mx-auto" style={{ borderColor: theme.primary }}><FiMessageCircle className="inline mr-2" size={16} />Say Hello!</button>
          </div>
        ) : (
          <div className={`${isMobile ? "p-2" : "p-4"} w-full ml-2 max-w-full overflow-x-hidden`}>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUser.id
              const senderInfo = getSenderInfo(message.sender_id)
              const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt)
              return (
                <div key={message._id || index} className="relative mt-5 w-full max-w-full">
                  {showDate && <div className="sticky top-2 z-10 flex justify-center my-3 w-full"><div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 shadow max-w-full"><FiCalendar className="inline mr-1" size={10} /><span className="truncate">{formatDate(message.createdAt)}</span></div></div>}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 w-full max-w-full`}>
                    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""} w-full max-w-full`}>
                      {!isOwn && <div className={`${isMobile ? "w-9 h-9" : "w-8 h-8"} rounded-lg overflow-hidden flex-shrink-0 shadow`}>{renderProfile(senderInfo.profile, senderInfo.avatar, "w-full h-full", isOwn)}</div>}
                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[85%] ${isMobile ? "max-w-[82%]" : ""}`}>
                        {!isOwn && roomDetails?.type === "group" && <span className={`font-medium mb-0.5 text-gray-500 ${isMobile ? "text-xs" : "text-xs"} truncate max-w-full`}>{senderInfo.name}</span>}
                        <div className={`relative group/message px-3 py-2 rounded-lg ${isOwn ? "rounded-tr-sm" : "rounded-tl-sm"} shadow hover:shadow-md transition-all duration-200 w-full max-w-full`} style={{ background: isOwn ? theme.primary : theme.white, color: isOwn ? theme.white : theme.dark }} onContextMenu={(e) => { e.preventDefault(); setActiveMessageMenu(message._id) }}>
                          {editingMessage === message._id ? (
                            <div className="w-full">
                              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-transparent resize-none outline-none text-sm" rows={2} autoFocus onKeyPress={handleKeyPress} style={{ color: isOwn ? "white" : "inherit" }} />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={cancelEditing} className="p-1 rounded hover:bg-white/20"><FiX size={14} /></button>
                                <button onClick={() => updateMessage(message._id)} className="p-1 rounded hover:bg-white/20"><FiSave size={14} /></button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed break-words message-content">{message.content}</p>
                              {!isMobile && (
                                <div className={`flex gap-1 mt-2 opacity-0 group-hover/message:opacity-100 transition-opacity ${isOwn ? "justify-end" : "justify-start"} flex-wrap`}>
                                  {quickReactions.map((reaction) => (
                                    <button key={reaction.emoji} onClick={() => addReaction(message._id, reaction.emoji)} className="w-6 h-6 rounded-full bg-white/30 hover:bg-white/40 flex items-center justify-center text-xs transition-transform hover:scale-110 shadow" style={{ backdropFilter: "blur(4px)" }} title={reaction.label}>{reaction.emoji}</button>
                                  ))}
                                </div>
                              )}
                              {messageReactions[message._id] && (
                                <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>
                                  {messageReactions[message._id].map((reaction, idx) => (
                                    <span key={idx} className="text-xs bg-white/30 px-1.5 py-0.5 rounded-full shadow" style={{ backdropFilter: "blur(4px)" }}>{reaction}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          {activeMessageMenu === message._id && (
                            <div className={`absolute top-full mt-1 bg-white rounded-lg shadow-xl z-20 min-w-[140px] ${isOwn ? "right-0" : "left-0"}`}>
                              {isOwn && <button className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full rounded-t-lg" onClick={() => startEditing(message)}><FiEdit2 size={12} /> Edit</button>}
                              {isOwn && <button className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-500 w-full rounded-b-lg" onClick={() => deleteMessage(message._id)}><FiTrash2 size={12} /> Delete</button>}
                            </div>
                          )}
                          {!isMobile && <button onClick={() => setActiveMessageMenu(message._id)} className={`absolute top-1 opacity-0 group-hover/message:opacity-100 transition-opacity ${isOwn ? "left-1" : "right-1"} p-1 rounded hover:bg-white/20`}><BsThreeDotsVertical size={12} /></button>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 px-1">
                          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                          {isOwn && <span className="text-xs">{message.status === "sending" ? <span className="text-gray-400">Sending...</span> : <FiCheckCircle size={10} className="text-green-500" />}</span>}
                        </div>
                      </div>
                      {isOwn && !isMobile && <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow">{renderProfile(currentUser.profile, getInitials(currentUser.name), "w-full h-full", true)}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <MessageInputArea isMobile={isMobile} newMessage={newMessage} setNewMessage={setNewMessage} messageInputRef={messageInputRef} handleTyping={handleTyping} handleKeyPress={handleKeyPress} sendMessage={sendMessage} showAttachmentMenu={showAttachmentMenu} setShowAttachmentMenu={setShowAttachmentMenu} handleFileUpload={handleFileUpload} showEmojiPicker={showEmojiPicker} setShowEmojiPicker={setShowEmojiPicker} theme={theme} userTyping={userTyping} scrollToBottom={scrollToBottom} messages={messages} getRoomName={getRoomName} />
    </div>
  )
}

function MessageInputArea({
  isMobile,
  newMessage,
  setNewMessage,
  messageInputRef,
  handleTyping,
  handleKeyPress,
  sendMessage,
  showAttachmentMenu,
  setShowAttachmentMenu,
  handleFileUpload,
  showEmojiPicker,
  setShowEmojiPicker,
  theme,
  userTyping,
  scrollToBottom,
  messages,
  getRoomName,
}) {
  return (
    <div className={`${isMobile ? "px-3 py-2" : "px-4 py-3"} bg-gray-200 shadow border-t flex-shrink-0 no-horizontal-scroll`}>
      {showAttachmentMenu && (
        <div className={`absolute ${isMobile ? "bottom-14 left-3 right-3" : "bottom-16 left-4 right-4 md:left-auto md:right-4 md:w-72"} bg-white rounded-lg shadow-lg z-10 border`}>
          <div className="grid grid-cols-4 gap-2 p-3">
            {[{ type: "image", icon: FiImage, label: "Photo" }, { type: "video", icon: FiVideo, label: "Video" }, { type: "document", icon: FiFile, label: "File" }, { type: "audio", icon: FiMic, label: "Audio" }].map((item) => (
              <button key={item.type} className="flex flex-col items-center p-2 hover:bg-gray-50 rounded transition-all duration-200 active:scale-95" onClick={() => handleFileUpload(item.type)}>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-1"><item.icon size={18} style={{ color: theme.primary }} /></div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {userTyping && (
        <div className={`absolute ${isMobile ? "-top-8 left-3" : "-top-5 left-0"} text-xs font-medium animate-pulse px-2`} style={{ color: theme.primary }}>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <span className="flex gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span><span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.1s" }}></span><span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.2s" }}></span></span>
            <span className="truncate">{userTyping} is typing...</span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg shadow-sm w-full">
        <button className={`p-3 rounded-lg transition-all duration-200 active:scale-95 flex-shrink-0 ${showAttachmentMenu ? "bg-gray-200" : "hover:bg-gray-200"}`} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} style={{ color: theme.primary }}><IoMdAttach size={isMobile ? 18 : 20} /></button>
        <div className="flex-1 relative min-w-0">
          <textarea ref={messageInputRef} value={newMessage} onChange={handleTyping} onKeyPress={handleKeyPress} placeholder={`Message ${getRoomName ? getRoomName() : "..."}`} className="w-full bg-transparent resize-none outline-none text-sm min-h-[40px] py-2 px-3 rounded-lg" style={{ color: theme.dark }} rows="1" />
        </div>
        <button className="p-3 rounded-lg hover:bg-gray-200 transition-colors active:scale-95 flex-shrink-0" style={{ color: theme.primary }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FiSmile size={isMobile ? 18 : 20} /></button>
        <button onClick={sendMessage} disabled={!newMessage.trim()} className={`p-3 rounded-lg transition-all duration-300 active:scale-95 flex-shrink-0 ${newMessage.trim() ? "hover:shadow" : "cursor-not-allowed"}`} style={{ background: newMessage.trim() ? theme.primary : theme.lightGray, color: newMessage.trim() ? theme.white : theme.light }}><FiSend size={isMobile ? 16 : 18} /></button>
      </div>
      {!newMessage.trim() && !isMobile && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-horizontal-scroll">
          {["Hello! 👋", "How are you?", "Can we schedule a call?", "Thanks! 😊"].map((text) => (
            <button key={text} onClick={() => setNewMessage(text)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-all whitespace-nowrap shadow-sm active:scale-95 flex-shrink-0">{text}</button>
          ))}
        </div>
      )}
      {messages.length > 5 && isMobile && (
        <button onClick={scrollToBottom} className="absolute bottom-20 right-400 bg-white rounded-full shadow-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: theme.primary }}><FiChevronDown size={16} style={{ color: theme.primary }} /></button>
      )}
    </div>
  )
}