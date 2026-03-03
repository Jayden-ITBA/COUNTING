import { describe, it, expect, vi } from 'vitest';
import { createNotification } from '../notifications';
import { addDoc, collection } from 'firebase/firestore';

describe('Notification Service', () => {
    it('creates a notification with correct data', async () => {
        const coupleId = 'couple123';
        const recipientId = 'user456';
        const type = 'test_type';
        const message = 'Test message';

        await createNotification(coupleId, recipientId, type, message);

        expect(addDoc).toHaveBeenCalledWith(
            expect.anything(), // collection reference
            expect.objectContaining({
                couple_id: coupleId,
                recipient_id: recipientId,
                type,
                message,
                read: false
            })
        );
    });
});
