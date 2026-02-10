import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Допълнителен тип за данните от Firestore
type UserData = {
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  institution: string;
  language: string;
  theme: string;
  status: 'active' | 'pending' | 'rejected';
  isVerified: boolean;
  grade?: string;
  specialty?: string;
  points?: number;
  level?: number;
  teacherCode?: string;
  avatar?: string;
} | null;

type AuthContextType = { 
  user: User | null;
  userData: UserData;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
  refreshUserData: async () => {},
  isAdmin: false
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserData(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (!user) {
      setUserData(null);
      setIsAdmin(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setIsAdmin(data?.role === 'admin');
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Първоначално зареждане на данните
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            setIsAdmin(data?.role === 'admin');
            
            // Ако е администратор, НЕ използвай onSnapshot
            // За администраторите ще използваме getDoc на refresh
            if (data?.role !== 'admin') {
              // Само за не-администратори използваме real-time updates
              const unsubscribeUserData = onSnapshot(
                doc(db, "users", firebaseUser.uid),
                (doc) => {
                  if (doc.exists()) {
                    const newData = doc.data() as UserData;
                    setUserData(newData);
                    setIsAdmin(newData?.role === 'admin');
                  } else {
                    setUserData(null);
                    setIsAdmin(false);
                  }
                },
                (error) => {
                  console.error('Error in user data subscription:', error);
                  // При грешка, опитваме да заредим ръчно
                  refreshUserData();
                }
              );
              
              setLoading(false);
              return () => unsubscribeUserData();
            }
          } else {
            setUserData(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      } else {
        setUserData(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      logout, 
      refreshUserData,
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);