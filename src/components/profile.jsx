"use client"

import { FiMail, FiPhone, FiMapPin, FiUser, FiCalendar, FiAward, FiArrowLeft } from "react-icons/fi"
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"
import { emptyCurrentUser, setCurrentUser } from "../assets/slice/currentUserSlice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";


export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useSelector((state)=> state.currentUser);
  const currentUser = store.currentUser;
  const [userProfile, setUserProfile] = useState(store.currentUser || emptyCurrentUser);
  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  const backend_domain_name = import.meta.env.VITE_BACKEND_DOMAIN_NAME;
  const admin_backend_domain_name = import.meta.env.ADMIN_BACKEND_DOMAIN_NAME || "http://localhost:2000/";  

  const handleLogout = async() => {
    const response = await axios.post(`${backend_domain_name}api/user/chatLogout`, {}, {
      withCredentials:true
    });
    if(response.status == 200){
         navigate("/login")
    }
 
  }

  
  const fetchData = async () => {
    try {
      const response = await axios.get(`${admin_backend_domain_name}api/chat/me`, {
        withCredentials: true
      })
      console.log(response, 'is response');
      
      if (response.status != 200) {
        navigate("/login")
      }else{
        console.log(response.data.user);
        dispatch(setCurrentUser(response.data.user))
        setUserProfile(response.data.user);
      
      
        return
      }
    } catch (error) {
      navigate("/login")
      console.log("User not authenticated", error)
    }
  }


  useEffect(()=> {
    fetchData();
  }, [])
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        
        .orbitron {
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 0.5px;
        }
        
        .orbitron-bold {
          font-family: 'Orbitron', sans-serif;
          font-weight: 800;
          letter-spacing: 1.5px;
        }
      `}</style>

      {/* Header with Back Button and Logout */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div
           onClick={()=> {
            navigate("/")
           }}
            className="inline-flex items-center gap-2 text-sm font-medium border-2 bg-black border-gray-400 p-3 rounded-md text-white hover:text-gray-300 hover:bg-black transition-colors cursor-pointer"
          >
            <FiArrowLeft size={18} />
            Back to Chat
          </div>
          
          {/* Logout Button */}
          <button
            onClick={() => {
             handleLogout()
           
            }}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-sm"
          >
            <svg 
              className="w-4 h-4 group-hover:scale-110 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                <img
                  src={
                    userProfile.profile ? `${backend_domain_name}/uploads/${userProfile.profile}` : "/placeholder.svg?height=144&width=144"
                  }
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                Active
              </div>
            </div>

            {/* Name and Role */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 orbitron-bold mb-2">{userProfile.name}</h1>
              <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-1.5 rounded-full font-semibold text-sm mb-4">
                <FiAward size={14} />
                {userProfile.role.toUpperCase()}
              </div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600 mt-3">
                <div className="flex items-center gap-2">
                  <FiCalendar size={14} className="text-gray-400" />
                  <span>Joined {formatDate(userProfile.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUser size={14} className="text-gray-400" />
                  <span>
                    {userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}, {userProfile.age} years
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Contact Information Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-gray-900 orbitron mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <FiMail size={14} className="text-gray-700" />
              </div>
              Contact Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FiMail size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Email</p>
                  <p className="text-sm text-gray-900 break-all">{userProfile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiPhone size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Phone</p>
                  <p className="text-sm text-gray-900">{userProfile.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Location</p>
                  <p className="text-sm text-gray-900">{userProfile.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-gray-900 orbitron mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <FiAward size={14} className="text-gray-700" />
              </div>
              Academic Info
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Academic Year</p>
                <p className="text-2xl font-bold text-gray-900 orbitron">{userProfile.academic_year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Grade</p>
                <p className="text-2xl font-bold text-gray-900 orbitron">Grade {userProfile.grade}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Class</p>
                <p className="text-sm text-gray-900">{userProfile.class || "Not assigned"}</p>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-gray-900 orbitron mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <FiUser size={14} className="text-gray-700" />
              </div>
              Account Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">User ID</p>
                <p className="text-sm text-gray-900 font-mono">#{userProfile.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Account Created</p>
                <p className="text-sm text-gray-900">{formatDate(userProfile.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Last Updated</p>
                <p className="text-sm text-gray-900">{formatDate(userProfile.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Guardian Information Card (Optional) */}
          {(userProfile.guardianName || userProfile.guardianPhone || userProfile.father_name) && (
            <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-bold text-gray-900 orbitron mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FiUser size={14} className="text-gray-700" />
                </div>
                Guardian Info
              </h3>
              <div className="space-y-3">
                {userProfile.father_name && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Father's Name</p>
                    <p className="text-sm text-gray-900">{userProfile.father_name}</p>
                  </div>
                )}
                {userProfile.guardianName && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Guardian Name</p>
                    <p className="text-sm text-gray-900">{userProfile.guardianName}</p>
                  </div>
                )}
                {userProfile.guardianPhone && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Guardian Phone</p>
                    <p className="text-sm text-gray-900">{userProfile.guardianPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal Information Card */}
          <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
            <h3 className="text-base font-bold text-gray-900 orbitron mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <FiUser size={14} className="text-gray-700" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Full Name</p>
                <p className="text-sm text-gray-900 font-semibold">{userProfile.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Age</p>
                <p className="text-sm text-gray-900 font-semibold">{userProfile.age} years old</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Gender</p>
                <p className="text-sm text-gray-900 font-semibold capitalize">{userProfile.gender}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Location</p>
                <p className="text-sm text-gray-900 font-semibold">{userProfile.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}