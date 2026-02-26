import React from 'react'
import './styles/global.css'
import MainRoutes from './routes/MainRoutes'
import { Toaster } from 'sonner'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { ThemeProvider } from './components/ThemeProvider'

const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ems-theme">
      <Toaster position="bottom-right" richColors />
      <PWAInstallPrompt />
      <MainRoutes/>
    </ThemeProvider>
  )
}

export default App
