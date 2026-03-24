import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { arrayUnion, arrayRemove } from "firebase/firestore";
import { useState } from "react"; 
import EventForm from "./EventForm"; 

export default function EventCard({ event }) {
    const { user } = useAuth();
    const isAttending = event.attendees?.includes(user?.uid);
    const [isEditing, setIsEditing] = useState(false);
    const isOwner = user?.uid === event.createdBy;

    // Format date and time for display
    const eventDate = event.date.toDate();
    const displayDateTime = eventDate.toLocaleDateString() + ' at ' + 
                            eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const toggleRSVP = async (e) => {
        e.stopPropagation();
        const ref = doc(db, "events", event.id);
        await updateDoc(ref, {
            attendees: isAttending ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };

    if (isEditing) {
        return (
            <li className="list-item-edit" style={{ listStyle: 'none', marginBottom: '16px' }}>
                <EventForm 
                    eventToEdit={event} 
                    onClose={() => setIsEditing(false)} 
                />
            </li>
        );
    }

    return (
        <li className="list-item" style={{ cursor: 'default' }}>
            <img src={event.image} className="list-thumb" alt={event.title} loading="lazy" />
            
            <div className="list-info">
                <div className="list-title">{event.title}</div>
                <div className="list-author">{event.venue} • {displayDateTime}</div>

                <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-muted)', 
                    marginTop: '8px',
                    lineHeight: '1.4' 
                }}>
                    {event.description}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Hosted by: {event.host}
                </div>
            </div>

            <div className="list-actions">

                {/* Show Edit button only if user is the creator */}
                {isOwner && (
                    <button 
                        className="btn btn-sm btn-ghost" 
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </button>
                )}
                <button 
                    className={`btn btn-sm ${isAttending ? 'btn-ghost' : 'btn-primary'}`} 
                    onClick={toggleRSVP}
                    style={{ minWidth: '80px' }}
                >
                    {isAttending ? "Leave" : "RSVP"}
                </button>
            </div>
        </li>
    );
}
