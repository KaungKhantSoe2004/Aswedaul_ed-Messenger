import { createSlice } from "@reduxjs/toolkit"

export const emptyCurrentUser =  {
        id: "",
        name: "John Doe",
        role: "",
        gender: "",
        age: "",
        phone: "",
        email: "",
        city: "",
        academic_year: "",
        grade: "",
        class: "",
        created_at: "",
        updated_at: "",
        guardianName: "",
        guardianPhone: "",
        father_name: "",

    }

const initialState = {
    currentUser:emptyCurrentUser
}

const currentUserSlice = createSlice({
    name: "currentUser",
    initialState, 
    reducers: {
     setCurrentUser: (state,action )=> {
        state.currentUser = action.payload;
     },
     removeCurrentUser: (state, action)=> {
        if(action.payload == "logout"){
            state.currentUser = emptyCurrentUser
        }
     }

    }
})
export const { setCurrentUser, removeCurrentUser} = currentUserSlice.actions;
export default  currentUserSlice.reducer;