
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

const SignIn = () => {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-triage-purple">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue your productivity journey</p>
          </div>
          <ClerkSignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
                formButtonPrimary: "bg-triage-purple hover:bg-triage-purple/90",
              },
            }}
            routing="path"
            path="/auth/sign-in"
            signUpUrl="/auth/sign-up"
            redirectUrl="/onboarding"
          />
        </div>
      </div>
    </AuthGuard>
  );
};

export default SignIn;
