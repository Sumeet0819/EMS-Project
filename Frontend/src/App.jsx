import React from 'react'
import './styles/global.css'
import MainRoutes from './routes/MainRoutes'
import { Toaster } from 'sonner'
const App = () => {
  return (
    <>
     <Toaster position="bottom-right" richColors />
    <MainRoutes/>
    </>
  )
}

export default App
