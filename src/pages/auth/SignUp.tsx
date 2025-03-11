
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

const SignUp = () => {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-triage-purple">Join Us</h1>
            <p className="text-gray-600">Create an account to start your productivity journey</p>
          </div>
          <ClerkSignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
                formButtonPrimary: "bg-triage-purple hover:bg-triage-purple/90",
              },
            }}
            routing="path"
            path="/auth/sign-up"
            signInUrl="/auth/sign-in"
            redirectUrl="/onboarding"
          />
        </div>
      </div>
    </AuthGuard>
  );
};

export default SignUp;
