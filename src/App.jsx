import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Chat from './components/chat'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './components/login'
import ProfilePage from './components/profile'

function App() {
  const [count, setCount] = useState(0)
  
  return (
<BrowserRouter>
<Routes>
<Route path='login' element={<LoginPage />} />
<Route path='/' element={<Chat />} />
<Route path="/profile" element={<ProfilePage />} />


</Routes>

</BrowserRouter>
  )
}

export default App
