import React from 'react'
import './styles/global.css'
import MainRoutes from './routes/MainRoutes'
import { Toaster } from 'sonner'
import PWAInstallPrompt from './components/PWAInstallPrompt'

const App = () => {
  return (
    <>
     <Toaster position="bottom-right" richColors />
     <PWAInstallPrompt />
    <MainRoutes/>
    </>
  )
}

export default App
