import { useEffect } from "react";
import { useLocation } from "wouter";

/** Legacy route — redirect to the Reporting & Insights hub */
export default function StandardReports() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/reporting");
  }, [setLocation]);

  return null;
}
