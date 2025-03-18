
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
  isLoading: boolean;  // Add this property
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // Add loading state
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);  // Set loading to true when fetching
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        setIsLoading(false);  // Set loading to false when done
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
        setIsLoading(false);  // Set loading to false when done with error
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
    } finally {
      setIsLoading(false);  // Always set loading to false in finally block
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
    <UserContext.Provider value={{ user, refreshUser: fetchUserData, isLoading }}>
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
