import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    uninitializedusers: []
}


const UninitializedUsersSlice = createSlice({
    name: "uninitiazlizedUsers",
    initialState,
    reducers: {
        setReduxInitializedUsers: (state, action)=> {
            state.uninitializedusers = action.payload
        }
    }
})

export const { setReduxInitializedUsers} = UninitializedUsersSlice.actions;
export default UninitializedUsersSlice.reducer;