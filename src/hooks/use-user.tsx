
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
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
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const clearError = () => setError(null);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }
      
      if (!authUser) {
        setUser(null);
        setIsLoading(false);
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, email, avatar_url')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        // Check if profile doesn't exist yet
        if (profileError.code === 'PGRST116') {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              username: authUser.email?.split('@')[0] || null
            });
            
          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
          
          // Update with default data
          setUser({
            id: authUser.id,
            email: authUser.email,
            username: authUser.email?.split('@')[0] || null,
            avatarUrl: null,
            isLoading: false,
          });
        } else {
          console.error("Error fetching profile:", profileError);
          setUser(prev => prev ? { ...prev, isLoading: false } : null);
        }
        setIsLoading(false);
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
      
    } catch (error: any) {
      console.error("Failed to fetch user data:", error);
      setError(error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUserData();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <UserContext.Provider value={{ 
      user, 
      refreshUser: fetchUserData, 
      isLoading,
      error,
      clearError
    }}>
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
