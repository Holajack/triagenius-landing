
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isLoading: boolean;
}

interface UserContextType {
  user: UserData | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  
  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        return;
      }
      
      // Set initial user data
      setUser({
        id: authUser.id,
        email: authUser.email,
        username: null,
        avatarUrl: null,
        isLoading: true,
      });
      
      // Fetch profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, email, avatar_url')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        setUser(prev => prev ? { ...prev, isLoading: false } : null);
        return;
      }
      
      // Update with profile data
      setUser({
        id: authUser.id,
        email: profileData.email || authUser.email,
        username: profileData.username || authUser.email?.split('@')[0] || null,
        avatarUrl: profileData.avatar_url,
        isLoading: false,
      });
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUserData();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <UserContext.Provider value={{ user, refreshUser: fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
