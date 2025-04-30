import { useEffect } from "react";
import { useLocation } from "wouter";

interface RedirectProps {
  to: string;
}

export const Redirect = ({ to }: RedirectProps) => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  
  return null;
};

export default Redirect;