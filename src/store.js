import { configureStore } from "@reduxjs/toolkit";
import  currentUserSlice from "./assets/slice/currentUserSlice";
import  uninitializedUsersSlice from "./assets/slice/uninitializedUsersSlice";
import roomsSlice from "./assets/slice/roomsSlice";
import themeSlice from "./assets/slice/themeSlice";
import selectedChatSlice from "./assets/slice/selectedChatSlice";
import selectedUserSlice from "./assets/slice/selectedUserSlice";
export const store = configureStore({
    reducer: {
     currentUser:   currentUserSlice,
     rooms: roomsSlice,
     uninitializedUsers: uninitializedUsersSlice,
     theme: themeSlice,
     selectedChat: selectedChatSlice,
     selectedUser: selectedUserSlice
     
    }
})