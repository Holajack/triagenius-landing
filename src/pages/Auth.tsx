
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "@/components/auth/AuthForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromStartFocusing = location.state?.source === "start-focusing";
  const initialMode = location.state?.mode || "login";
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // If already authenticated, redirect to appropriate page
      if (data.session) {
        if (isFromStartFocusing) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    };
    
    checkAuth();
  }, [navigate, isFromStartFocusing]);
  
  if (isAuthenticated) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/30 flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Button>
        
        <div className="max-w-md mx-auto">
          {isFromStartFocusing ? (
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
              <p className="text-sm text-triage-purple bg-purple-50 p-3 rounded-lg">
                Create an account to start your focus journey and track your progress
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold mb-6 text-center">
              {initialMode === "login" ? "Welcome Back" : "Join The Triage System"}
            </h1>
          )}
          
          <Tabs defaultValue={isFromStartFocusing ? "signup" : initialMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <AuthForm mode="login" source={location.state?.source} />
            </TabsContent>
            
            <TabsContent value="signup">
              <AuthForm mode="signup" source={location.state?.source} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
