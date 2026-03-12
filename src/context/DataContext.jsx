import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [couple, setCouple] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile = () => {};
        let unsubscribeCouple = () => {};
        let unsubscribeNotifications = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            
            if (currentUser) {
                // Initial profile listener
                unsubscribeProfile = onSnapshot(doc(db, 'profiles', currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = { id: docSnap.id, ...docSnap.data() };
                        setProfile(profileData);
                        
                        // If paired, listen to couple data
                        if (profileData.couple_id) {
                            unsubscribeCouple();
                            unsubscribeCouple = onSnapshot(doc(db, 'couples', profileData.couple_id), (coupleSnap) => {
                                if (coupleSnap.exists()) {
                                    setCouple({ id: coupleSnap.id, ...coupleSnap.data() });
                                }
                            });

                            // Listen to notifications
                            unsubscribeNotifications();
                            const q = query(
                                collection(db, 'notifications'),
                                where('recipient_id', '==', currentUser.uid),
                                orderBy('created_at', 'desc')
                            );
                            unsubscribeNotifications = onSnapshot(q, (snapshot) => {
                                setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                            });
                        } else {
                            setCouple(null);
                            setNotifications([]);
                        }
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Profile listener error:", error);
                    setLoading(false);
                });
            } else {
                setProfile(null);
                setCouple(null);
                setNotifications([]);
                setLoading(false);
                unsubscribeProfile();
                unsubscribeCouple();
                unsubscribeNotifications();
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProfile();
            unsubscribeCouple();
            unsubscribeNotifications();
        };
    }, []);

    const value = {
        user,
        profile,
        couple,
        notifications,
        loading: authLoading || loading,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
