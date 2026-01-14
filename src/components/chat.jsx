"use client"

import { useEffect, useRef, useState } from "react"
import ChatRoom from "./chat-room"
import ChatList from "./chat-list"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import { setCurrentUser } from "../assets/slice/currentUserSlice"
import { initializeSocket } from "../assets/socket-service"
import { emptySelectedChat, setSelectedChat } from "../assets/slice/selectedChatSlice"
import { setSelectedUser } from "../assets/slice/selectedUserSlice"

export default function Chat() {
  const socketInitialized = useRef(false)
  const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME || "http://localhost:1500/"
  const admin_backend_domain_name = import.meta.env.ADMIN_BACKEND_DOMAIN_NAME || "http://localhost:2000/"
  const navigate = useNavigate()
  const store = useSelector((state) => state.currentUser)
  const dispatch = useDispatch()
  const [currentUser, setMyCurrentUser] = useState(store.currentUser)
  const selectedChat = useSelector(store => store.selectedChat.selectedChat)
  const selectedUser = useSelector(store => store.selectedUser.selectedUser)
  const [isMobileListOpen, setIsMobileListOpen] = useState(true)
  const [isMessageSent, setIsMessageSent] = useState(false)
  const [isMessageReceived, setIsMessageReceived] = useState(false)
  const theme = useSelector(store => store.theme.theme)

  const fetchData = async () => {
    try {
      const response = await axios.get(`${admin_backend_domain_name}api/chat/me`, {
        withCredentials: true
      })
      
      if (response.status !== 200) {
        navigate("/login")
      } else {
        dispatch(setCurrentUser(response.data.user))
        setMyCurrentUser(response.data.user)
        console.log(response.data.user)
        if (!socketInitialized.current) {
          initializeSocket("http://localhost:4000", response.data.user.id)
          socketInitialized.current = true
        }
      }
    } catch (error) {
      navigate("/login")
      console.log("User not authenticated", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background" style={{ backgroundColor: theme.background }}>
      <div
        className={`
          fixed inset-0 z-50 md:relative md:inset-auto md:z-0
          ${(selectedChat || selectedUser) && !isMobileListOpen ? "hidden md:flex" : "flex"}
          w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300
        `}
      >
        <ChatList
          isMessageSent={isMessageSent}
          isMessageReceived={isMessageReceived}
          onSelectRoom={(id) => {
            dispatch(setSelectedChat(id))
            dispatch(setSelectedUser(null))
            setIsMobileListOpen(false)
          }}
          onSelectUser={(user) => {
            dispatch(setSelectedUser(user))
            dispatch(setSelectedChat(null))
            setIsMobileListOpen(false)
          }}
          onMobileClose={() => setIsMobileListOpen(false)}
        />
      </div>
      <div
        className={`
          flex-1 flex flex-col min-w-0 bg-white transition-all duration-300
          ${!(selectedChat || selectedUser) ? "hidden md:flex" : "flex"}
        `}
      >
        {selectedChat || selectedUser ? (
          <ChatRoom
            isMessageSent={isMessageSent}
            isMessageReceived={isMessageReceived}
            currentUser={currentUser}
            setIsMessageReceived={setIsMessageReceived}
            setIsMessageSent={setIsMessageSent}
            onBack={() => {
              dispatch(emptySelectedChat(null))
              dispatch(setSelectedUser(null))
              setIsMobileListOpen(true)
            }}
            isMobile={true}
            onMobileMenu={() => setIsMobileListOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Select a conversation</h3>
            <p className="text-gray-500 max-w-xs">Choose a contact or group from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  )
}