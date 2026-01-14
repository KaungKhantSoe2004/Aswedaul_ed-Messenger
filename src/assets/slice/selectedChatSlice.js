import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedChat:null
};

const selectedChatSlice = createSlice({
    name: "selectedChat",
    initialState,
    reducers: {
        setSelectedChat: (state, action)=> {
            state.selectedChat = action.payload
        },
        emptySelectedChat: (state, action)=> {
            state.selectedChat = null
        }
    }
});

export default selectedChatSlice.reducer;
export const { setSelectedChat, emptySelectedChat} = selectedChatSlice.actions;
