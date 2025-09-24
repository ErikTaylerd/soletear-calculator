import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./child-iframe-height";

createRoot(document.getElementById("root")!).render(<App />);
