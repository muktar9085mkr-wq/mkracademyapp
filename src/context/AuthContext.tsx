import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, ADMIN_EMAIL, testConnection } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  clearError: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = () => setAuthError(null);

  // Check admin privileges via email or admin document
  const checkIsAdmin = async (currentUser: User | null): Promise<boolean> => {
    if (!currentUser || !currentUser.email) return false;

    // Hardcoded authoritative bootstrap admin email
    if (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return true;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminDoc.exists()) {
        return true;
      }
    } catch {
      // Ignore if document not accessible
    }

    return false;
  };

  // Sync profile from Firestore
  const syncProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const isUserAdmin = await checkIsAdmin(firebaseUser);
      setIsAdmin(isUserAdmin);

      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);
      } else {
        // Create initial profile in Firestore
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Student',
          email: firebaseUser.email || '',
          phoneNumber: firebaseUser.phoneNumber || '',
          role: isUserAdmin ? 'admin' : 'student',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }

      // If user is verified admin, ensure admin doc exists in admins collection
      if (isUserAdmin) {
        try {
          await setDoc(doc(db, 'admins', firebaseUser.uid), {
            email: firebaseUser.email,
            addedAt: new Date().toISOString(),
            role: 'superadmin'
          }, { merge: true });
        } catch (e) {
          console.warn('Could not bootstrap admins collection doc:', e);
        }
      }
    } catch (err: any) {
      console.error('Error syncing profile:', err);
    }
  };

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const message = getFriendlyErrorMessage(err.code);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateFirebaseProfile(res.user, { displayName: name.trim() });

      const isUserAdmin = res.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const newProfile: UserProfile = {
        uid: res.user.uid,
        displayName: name.trim(),
        email: email.trim(),
        phoneNumber: cleanedPhone,
        role: isUserAdmin ? 'admin' : 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', res.user.uid), newProfile);
      setProfile(newProfile);
      setIsAdmin(isUserAdmin);
    } catch (err: any) {
      const message = getFriendlyErrorMessage(err.code) || err.message;
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await syncProfile(res.user);
    } catch (err: any) {
      const message = getFriendlyErrorMessage(err.code);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const message = getFriendlyErrorMessage(err.code);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const userRef = doc(db, 'users', user.uid);
      const updated = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updated);
      setProfile(prev => prev ? { ...prev, ...updated } : null);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        authError,
        clearError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        updateProfileData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getFriendlyErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please login instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    default:
      return 'Authentication failed. Please verify your details and try again.';
  }
}
