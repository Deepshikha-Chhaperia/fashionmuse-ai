import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="py-12 border-t border-border bg-card text-foreground">
    <div className="container mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-6">
      <Link to="/" className="inline-flex flex-col">
        <span className="font-display text-lg tracking-[0.2em] uppercase font-semibold">
          ATELIER
        </span>
        <span className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
          Haute Couture AI
        </span>
      </Link>
      <div className="flex items-center gap-8 text-xs tracking-[0.15em] uppercase text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <Link to="/studio" className="hover:text-foreground transition-colors">Design Studio</Link>
      </div>
      <p className="text-xs text-muted-foreground font-light">
        © {new Date().getFullYear()} Atelier Couture. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
