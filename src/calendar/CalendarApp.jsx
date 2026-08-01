import { useState, useEffect } from 'react'
import CalendarGrid from './CalendarGrid'
import EventSidebar from './EventSidebar'
import AddEventModal from './AddEventModal'

const STORAGE_KEY = 'calendar-events'

const SAMPLE_EVENTS = [
  {
    id: 's1',
    title: 'Team Standup',
    date: '2026-08-04',
    startTime: '09:00',
    endTime: '09:30',
    location: 'Zoom',
    description: 'Daily team sync meeting',
    color: 'blue',
  },
  {
    id: 's2',
    title: 'Data Pipeline Review',
    date: '2026-08-06',
    startTime: '14:00',
    endTime: '15:00',
    location: 'Conference Room A',
    description: 'Review Q3 data pipeline performance and bottlenecks',
    color: 'purple',
  },
  {
    id: 's3',
    title: 'Sprint Planning',
    date: '2026-08-10',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Google Meet',
    description: 'Plan tasks for the next two-week sprint',
    color: 'green',
  },
  {
    id: 's4',
    title: 'SQL Workshop',
    date: '2026-08-13',
    startTime: '13:00',
    endTime: '14:30',
    location: 'Training Room',
    description: 'Advanced SQL for analytics — window functions & CTEs',
    color: 'orange',
  },
  {
    id: 's5',
    title: 'Dashboard Demo',
    date: '2026-08-18',
    startTime: '15:00',
    endTime: '16:00',
    location: 'Client Office',
    description: 'Present the new BI dashboard to stakeholders',
    color: 'pink',
  },
  {
    id: 's6',
    title: 'Monthly 1-on-1',
    date: '2026-08-20',
    startTime: '09:00',
    endTime: '09:45',
    location: 'Manager\'s Office',
    description: '',
    color: 'blue',
  },
  {
    id: 's7',
    title: 'Team Outing',
    date: '2026-08-22',
    startTime: '',
    endTime: '',
    location: 'Grand Indonesia',
    description: 'Quarterly team bonding event',
    color: 'red',
  },
  {
    id: 's8',
    title: 'Airflow Migration',
    date: '2026-08-28',
    startTime: '08:00',
    endTime: '17:00',
    location: '',
    description: 'Migrate all DAGs to Airflow 2.9',
    color: 'purple',
  },
]

export default function CalendarApp() {
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : SAMPLE_EVENTS
    } catch {
      return SAMPLE_EVENTS
    }
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [modalInitialDate, setModalInitialDate] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events])

  const addEvent = (eventData) => {
    setEvents(prev => [...prev, { ...eventData, id: Date.now().toString() }])
  }

  const updateEvent = (updatedEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))
  }

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const openAddModal = (date = null) => {
    setModalInitialDate(date || selectedDate)
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const openEditModal = (event) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleSave = (eventData) => {
    if (editingEvent) {
      updateEvent({ ...eventData, id: editingEvent.id })
    } else {
      addEvent(eventData)
    }
    setIsModalOpen(false)
    setEditingEvent(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Calendar</h1>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Event
        </button>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar area */}
        <div className="flex-1 p-5 overflow-auto min-w-0">
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            selectedDate={selectedDate}
            onDayClick={setSelectedDate}
            onMonthChange={setCurrentDate}
            onAddEvent={openAddModal}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-gray-800 flex flex-col overflow-hidden">
          <EventSidebar
            events={events}
            selectedDate={selectedDate}
            onAddEvent={openAddModal}
            onDeleteEvent={deleteEvent}
            onEditEvent={openEditModal}
            onClearSelection={() => setSelectedDate(null)}
          />
        </div>
      </div>

      {/* Modal */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialDate={modalInitialDate}
        editEvent={editingEvent}
      />
    </div>
  )
}
