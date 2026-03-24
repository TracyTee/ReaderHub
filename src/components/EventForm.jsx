import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { EVENT_IMAGES } from "../pages/Events";
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function EventForm({ onClose, eventToEdit }) {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState({
        title: eventToEdit?.title || '',
        dateTime: eventToEdit ? new Date(eventToEdit.date.toDate().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
        venue: eventToEdit?.venue || '',
        description: eventToEdit?.description || '',
        image: eventToEdit?.image || EVENT_IMAGES[0]
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const eventData = {
            ...formData,
            date: Timestamp.fromDate(new Date(formData.dateTime)),
        };

        if (eventToEdit) {
            // Update logic
            const eventRef = doc(db, "events", eventToEdit.id);
            await updateDoc(eventRef, eventData);
        } else {
            // Create logic
            await addDoc(collection(db, "events"), {
                ...eventData,
                createdBy: user.uid,
                host: profile?.name || user.email,
                attendees: [user.uid]
            });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
                {eventToEdit ? "Edit Event" : "Create Event"}
            </h3>
            <div className="form-group">
                <label className="form-label">Event Name</label>
                <input className="form-input"
                 required 
                 value={formData.title}
                 onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input type="datetime-local" className="form-input" required
                value={formData.dateTime}
                onChange={e => setFormData({...formData, dateTime: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Venue</label>
                <input className="form-input" required
                value={formData.venue}
                onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" required
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Select Cover Image</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' }}>
                    {EVENT_IMAGES.map((url, index) => (
                        <img 
                            key={index}
                            src={url} 
                            alt={`Option ${index}`}
                            onClick={() => setFormData({...formData, image: url})}
                            style={{ 
                                width: '100%', 
                                aspectRatio: '1', 
                                objectFit: 'cover', 
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                border: formData.image === url ? '3px solid var(--accent)' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">{eventToEdit ? "Save Changes" : "Publish Event"}</button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
        </form>
    );
}
