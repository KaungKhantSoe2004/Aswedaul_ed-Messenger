import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    theme:   {
    primary: "#3FA7A3",
    secondary: "#6C63FF",
    accent: "#2ECC71",
    dark: "#1E293B",
    light: "#64748B",
    background: "#F8FAFC",
    white: "#FFFFFF",
    lightGray: "#E2E8F0",
  }
};
const themeSlice = createSlice({
    name: "theme",
    initialState, 
    reducers: {
       setTheme: (state, action)=> {
         console.log(action.payload)
       }
    }
});

export default themeSlice.reducer;