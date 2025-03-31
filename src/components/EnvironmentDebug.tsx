
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import EnvironmentDebugPanel from "./debug/EnvironmentDebugPanel";
import EnvironmentSync from "./debug/EnvironmentSync";

// Debug flag should match ThemeContext.tsx
const DEBUG_ENV = true;

const EnvironmentDebug = () => {
  const { user } = useUser();
  
  if (!DEBUG_ENV || !user?.id) {
    return <EnvironmentSync />;
  }
  
  return (
    <div className="fixed bottom-2 right-2 z-50 max-w-sm">
      <EnvironmentSync />
      <EnvironmentDebugPanel userId={user.id} />
    </div>
  );
};

export default EnvironmentDebug;
