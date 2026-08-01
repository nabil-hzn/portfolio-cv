import React from 'react'
import ReactDOM from 'react-dom/client'
import CalendarApp from './calendar/CalendarApp.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('calendar-root')).render(
  <React.StrictMode>
    <CalendarApp />
  </React.StrictMode>,
)
