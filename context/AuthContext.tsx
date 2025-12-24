import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail,
    User
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
    currentUser: User | null;
    signup: (email: string, pass: string, name: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    googleSignIn: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signup = async (email: string, pass: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        // Force refresh user to get updated displayName
        setCurrentUser({ ...userCredential.user, displayName: name });
    };

    const login = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const logout = () => {
        return signOut(auth);
    };

    const googleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const resetPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email);
    };

    const value = {
        currentUser,
        signup,
        login,
        logout,
        googleSignIn,
        resetPassword,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
