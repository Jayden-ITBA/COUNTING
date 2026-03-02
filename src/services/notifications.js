import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createNotification = async (coupleId, recipientId, type, message) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            couple_id: coupleId,
            recipient_id: recipientId,
            type,
            message,
            read: false,
            created_at: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
