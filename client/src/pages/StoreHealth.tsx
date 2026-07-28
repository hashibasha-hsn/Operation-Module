import { useEffect } from "react";
import { useLocation } from "wouter";

/** Legacy route — redirects to the live Store Health & Compliance executive dashboard. */
export default function StoreHealth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/executive-dashboard");
  }, [setLocation]);

  return (
    <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
      Redirecting to Store Health & Compliance...
    </div>
  );
}
