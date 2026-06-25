import { createRoot } from 'react-dom/client'
import App from './App'
import './renderer.css'

const root = document.getElementById('root')
if (root) createRoot(root).render(<App />)
