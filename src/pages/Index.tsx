
import { HowItWorks } from "@/components/HowItWorks";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AnimatedIcon } from "@/components/AnimatedIcon";
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";

const Index = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/onboarding");
    } else {
      navigate("/auth/sign-in");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AnimatedIcon />
            <h1 className="text-xl font-bold text-gray-800">FocusFlow</h1>
          </div>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Hi, {user.firstName || user.username}</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Achieve Deep Focus and Maximize Productivity
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Create your personalized focus environment in minutes. Customize your workspace
            to match your ideal environment, sound preferences, and work style.
          </p>
          
          <Button 
            onClick={handleGetStarted}
            className="bg-triage-purple hover:bg-triage-purple/90 text-white px-8 py-6 text-lg rounded-lg"
            size="lg"
          >
            Start Focusing
          </Button>
          
          <div className="mt-16">
            <HowItWorks />
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} FocusFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
