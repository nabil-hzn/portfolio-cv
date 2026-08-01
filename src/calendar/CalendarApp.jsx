import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import CalendarGrid from './CalendarGrid'
import EventSidebar from './EventSidebar'
import AddEventModal from './AddEventModal'

const EVENTS_COL = 'events'

// Shown only if Firestore config hasn't been filled in yet
function ConfigBanner() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-900/90 border border-yellow-600 text-yellow-200 text-xs px-4 py-2 rounded-lg shadow-lg max-w-md text-center">
      Firebase not configured — events are saving locally only.{' '}
      <span className="font-medium">Fill in your config in src/calendar/firebase.js</span>
    </div>
  )
}

const FIREBASE_CONFIGURED = !import.meta.env.VITE_FIREBASE_UNCONFIGURED

function isConfigured() {
  // If projectId is still the placeholder, Firestore won't work
  try {
    return db && db.app.options.projectId !== 'REPLACE_ME'
  } catch {
    return false
  }
}

const STORAGE_KEY = 'calendar-events-local'

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
    location: "Manager's Office",
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
  const configured = isConfigured()

  // Local fallback state (used when Firestore not configured)
  const [localEvents, setLocalEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : SAMPLE_EVENTS
    } catch {
      return SAMPLE_EVENTS
    }
  })

  // Firestore state
  const [firestoreEvents, setFirestoreEvents] = useState(null) // null = loading
  const [fsError, setFsError] = useState(null)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [modalInitialDate, setModalInitialDate] = useState(null)

  // Sync local events to localStorage
  useEffect(() => {
    if (!configured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localEvents))
    }
  }, [localEvents, configured])

  // Subscribe to Firestore in real time
  useEffect(() => {
    if (!configured) return
    const q = query(collection(db, EVENTS_COL), orderBy('date'))
    const unsub = onSnapshot(
      q,
      snap => {
        setFirestoreEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setFsError(null)
      },
      err => {
        console.error('Firestore error:', err)
        setFsError(err.message)
      },
    )
    return () => unsub()
  }, [configured])

  const events = configured
    ? (firestoreEvents ?? [])
    : localEvents

  const loading = configured && firestoreEvents === null && !fsError

  // --- CRUD ---

  const addEvent = async eventData => {
    if (configured) {
      await addDoc(collection(db, EVENTS_COL), eventData)
    } else {
      setLocalEvents(prev => [...prev, { ...eventData, id: Date.now().toString() }])
    }
  }

  const updateEvent = async updatedEvent => {
    if (configured) {
      const { id, ...data } = updatedEvent
      await updateDoc(doc(db, EVENTS_COL, id), data)
    } else {
      setLocalEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))
    }
  }

  const deleteEvent = async id => {
    if (configured) {
      await deleteDoc(doc(db, EVENTS_COL, id))
    } else {
      setLocalEvents(prev => prev.filter(e => e.id !== id))
    }
  }

  const openAddModal = (date = null) => {
    setModalInitialDate(date || selectedDate)
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const openEditModal = event => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleSave = async eventData => {
    if (editingEvent) {
      await updateEvent({ ...eventData, id: editingEvent.id })
    } else {
      await addEvent(eventData)
    }
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
          {configured && (
            <span className="text-xs text-green-400 border border-green-800 bg-green-950/50 px-2 py-0.5 rounded-full">
              ● Cloud sync
            </span>
          )}
          {!configured && (
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">
              Local only
            </span>
          )}
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Add Event
        </button>
      </header>

      {/* Firestore error banner */}
      {fsError && (
        <div className="bg-red-900/40 border-b border-red-800 text-red-300 text-xs px-6 py-2 text-center">
          Firestore error: {fsError}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading events…
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
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
      )}

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSave}
        initialDate={modalInitialDate}
        editEvent={editingEvent}
      />

      {!configured && <ConfigBanner />}
    </div>
  )
}
