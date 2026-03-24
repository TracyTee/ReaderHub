import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { EVENT_IMAGES } from "../pages/Events";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function EventForm({ onClose }) {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState({
        title: '', dateTime: '', venue: '', description: '', image: EVENT_IMAGES[0]
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "events"), {
            ...formData,
            date: Timestamp.fromDate(new Date(formData.dateTime)),
            createdBy: user.uid,
            host: profile?.name || user.email,
            attendees: [user.uid]
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', marginBottom: '32px' }}>
            <div className="form-group">
                <label className="form-label">Event Name</label>
                <input className="form-input" required onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input type="datetime-local" className="form-input" required onChange={e => setFormData({...formData, dateTime: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Venue</label>
                <input className="form-input" required onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" required onChange={e => setFormData({...formData, description: e.target.value})} />
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
                <button type="submit" className="btn btn-primary">Publish Event</button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
        </form>
    );
}
