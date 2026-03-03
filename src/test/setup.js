import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    FacebookAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(),
    orderBy: vi.fn(),
    writeBatch: vi.fn(),
}));
