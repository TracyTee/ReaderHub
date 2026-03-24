import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; //
import { useAuth } from '../context/AuthContext'; //
import { collection, query, onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove, doc, Timestamp } from 'firebase/firestore';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';

const TABS = [
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'attending', label: 'Attending' },
    { id: 'created', label: 'My Events' },
];


export const EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500", 
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500", 
  "https://images.unsplash.com/photo-1529148482759-b35b25c5f217?w=500", 
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500", 
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500", 
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500", 
  "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500", 
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500", 
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500", 
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500", 
];

export default function Events() {
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('ongoing');
    const { user } = useAuth(); //
    const [showForm, setShowForm] = useState(false);

    // Fetch Events from Firestore
    useEffect(() => {
        const q = query(collection(db, "events"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsubscribe;
    }, []);

    // Filter Logic
    const now = new Date();
    const filteredEvents = events.filter(e => {
        const eventDate = e.date.toDate();
        if (activeTab === 'ongoing') {
            return eventDate.toDateString() === now.toDateString();
        }
        if (activeTab === 'upcoming') {
            return eventDate > now && eventDate.toDateString() !== now.toDateString();
        }
        if (activeTab === 'attending') {
            return e.attendees?.includes(user?.uid);
        }
        if (activeTab === 'created') {
            return e.createdBy === user?.uid;
        }
        return true;
    });

    return (
        <div className="page fade-up">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Book Events</h1>
                    <p className="page-sub">Create and join reading circles</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Close" : "Create Event"}
                </button>
            </header>

            {showForm && <EventForm onClose={() => setShowForm(false)} />}

            {/* Toggle Tabs */}
            <nav className="filters">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`filter-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <section style={{ marginTop: '24px' }}>
                {filteredEvents.length > 0 ? (
                    <ul className="reading-list"> {/* Use reading-list column layout */}
                        {filteredEvents.map(event => (
                            <EventCard key={event.id} event={event} activeTab={activeTab} />
                        ))}
                    </ul>
                ) : (
                    <div className="empty-state">
                        <p className="empty-state-text">No events found in this category.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

function EventSection({ title, items }) {
    if (items.length === 0) return null;
    return (
        <section style={{ marginBottom: '40px' }}>
            <div className="section-heading">
                {title} <div className="section-heading-line" />
            </div>
            <div className="books-grid"> {/* Reusing the grid layout */}
                {items.map(event => <EventCard key={event.id} event={event} />)}
            </div>
        </section>
    );
}