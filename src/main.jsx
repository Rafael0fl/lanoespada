/* ==========================================================================
 * main.jsx
 * --------------------------------------------------------------------------
 * Punto de entrada de la app. Orden de providers:
 *
 *   <AuthProvider>        -> Contexto de autenticacion (sesion/rol/token).
 *     <ToastProvider>     -> Sistema de notificaciones (toasts).
 *       <BrowserRouter>   -> Router de React (v7, API compatible v6).
 *         <App />         -> Definicion de rutas protegidas por rol.
 *
 * El orden importa: App y sus paginas necesitan useAuth() ya disponible.
 * BrowserRouter usa la History API del navegador (URLs limpias, sin '#').
 * ========================================================================== */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)