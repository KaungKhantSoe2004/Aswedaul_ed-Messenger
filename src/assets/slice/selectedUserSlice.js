import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    selectedUser: null
}

const selectedUserSlice = createSlice({
 name: "selectedUser",
 initialState,
 reducers: {
    setSelectedUser: (state, action)=> {
        state.selectedUser = action.payload
    },
    emptySelectedUser: (state, action)=> {
        state.selectedUser = null
    }
 }
});

export default selectedUserSlice.reducer;
export const { setSelectedUser, emptySelectedUser} = selectedUserSlice.actions;