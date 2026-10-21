import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-embroidery.jpg";

const Hero = () => (
  <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
    {/* Background with luxury couture textile */}
    <div className="absolute inset-0 z-0">
      <img
        src={heroImage}
        alt="Haute couture embroidery craftsmanship"
        className="w-full h-full object-cover object-center opacity-25 scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
    </div>

    {/* Content */}
    <div className="relative z-10 container mx-auto px-6 text-center max-w-3xl pt-16">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-gold/30 bg-gold/5 text-gold text-[10px] tracking-[0.25em] uppercase mb-8">
        <Sparkles className="w-3 h-3" />
        <span>Haute Couture AI Atelier</span>
      </div>

      <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-foreground font-normal tracking-tight leading-[1.1] mb-6">
        Where Artistry Meets
        <span className="block italic text-gold font-light mt-1">Timeless Elegance</span>
      </h1>

      <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed font-light">
        Generate bespoke couture embroidery motifs and production-ready designs powered by bespoke AI intelligence.
      </p>

      <Button variant="elegant" size="xl" asChild className="group h-14 px-10 text-xs tracking-[0.2em] shadow-soft">
        <Link to="/studio" className="inline-flex items-center gap-3">
          <span>Enter Design Studio</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  </section>
);

export default Hero;
