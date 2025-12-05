import { createRoot } from 'react-dom/client'
import AppTest from './App.test.tsx'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<AppTest />)
} else {
  console.error('Elemento root não encontrado!')
}