
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Check authentication status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const handleLoginClick = () => {
    if (isAuthenticated) {
      supabase.auth.signOut().then(() => {
        navigate('/');
      });
    } else {
      navigate('/auth', { state: { mode: 'login' } });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4 ${
        isScrolled ? "glass subtle-shadow" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-triage-indigo to-triage-purple">
            The Triage System
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-white/50 rounded-xl"
          >
            Features
          </Button>
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-white/50 rounded-xl"
          >
            About
          </Button>
          <Button
            className="ml-2 bg-white/90 hover:bg-white text-gray-900 border border-gray-200 rounded-xl subtle-shadow transition-all duration-300"
            onClick={handleLoginClick}
          >
            {isAuthenticated ? "Log Out" : "Log In"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </Button>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 top-16 bg-white/95 backdrop-blur-sm z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        } md:hidden`}
      >
        <div className="flex flex-col p-4 space-y-4">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 w-full justify-start"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </Button>
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 w-full justify-start"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Button>
          <Button
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl subtle-shadow justify-center"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLoginClick();
            }}
          >
            {isAuthenticated ? "Log Out" : "Log In"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
