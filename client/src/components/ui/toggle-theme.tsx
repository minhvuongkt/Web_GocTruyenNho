import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "./theme-provider";

export function ToggleTheme({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={className}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </Button>
  );
}
