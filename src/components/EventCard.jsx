import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { arrayUnion, arrayRemove } from "firebase/firestore";
import { useState } from "react"; 
import EventForm from "./EventForm"; 

export default function EventCard({ event, activeTab }) {
    const { user } = useAuth();

    // 1. Safety check for attendees array
    const isAttending = event?.attendees?.includes(user?.uid) ?? false;
    
    const [isEditing, setIsEditing] = useState(false);

    const isOwner = user?.uid && event?.createdBy === user.uid;
    const canManage = isOwner && activeTab === 'created';

    // Format date and time for display
    // Safe Date Formatting
    const eventDate = event?.date?.toDate ? event.date.toDate() : null;
    const displayDateTime = eventDate
        ? eventDate.toLocaleDateString() + ' at ' + eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "Date TBD";

    const toggleRSVP = async (e) => {
        e.stopPropagation();
        const ref = doc(db, "events", event.id);
        await updateDoc(ref, {
            attendees: isAttending ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                const eventRef = doc(db, "events", event.id);
                await deleteDoc(eventRef);
            } catch (error) {
                console.error("Error deleting event: ", error);
                alert("Failed to delete event.");
            }
        }
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
            <img src={event?.image || "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500"}
             className="list-thumb" alt={event?.title || "Event"} loading="lazy" />
            
            <div className="list-info">
                <div className="list-title">{event?.title ?? "Untitled Event"}</div>
                <div className="list-author">{(event?.venue ?? "No venue")} • {displayDateTime}</div>

                <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-muted)', 
                    marginTop: '8px',
                    lineHeight: '1.4' 
                }}>
                    {event?.description ?? "No description available."}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Hosted by: {event?.host ?? "Unknown"}
                </div>
            </div>

            <div className="list-actions">

                {/* Show Edit button only if user is the creator */}
                {canManage && (
                    <>
                        <button 
                            className="btn btn-sm btn-ghost" 
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </button>
                        <button 
                            className="btn btn-sm btn-danger" 
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </>
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
