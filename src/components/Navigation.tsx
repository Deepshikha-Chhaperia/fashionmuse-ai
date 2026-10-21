import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border py-4 shadow-soft"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
        <Link to="/" className="inline-flex flex-col group">
          <span className="font-display text-xl tracking-[0.2em] uppercase text-foreground font-semibold">
            ATELIER
          </span>
          <span className="text-[9px] tracking-[0.35em] uppercase text-muted-foreground font-body">
            Haute Couture AI
          </span>
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <Link
            to="/"
            className={cn(
              "text-xs tracking-[0.18em] uppercase font-body transition-colors",
              location.pathname === "/" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Home
          </Link>
          <Button variant="elegant" size="sm" asChild className="h-9 px-5 text-[11px] tracking-[0.15em]">
            <Link to="/studio" className="inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Design Studio</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
