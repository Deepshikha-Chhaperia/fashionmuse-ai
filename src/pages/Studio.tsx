import { useState, useCallback, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Sparkles, Loader2, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { generateDesigns, type GeneratedDesign } from "@/lib/aiService";
import type { GenerationMode } from "@/lib/prompts";
import { downloadImage } from "@/lib/utils";

const GENERATION_MODES: { value: GenerationMode; label: string; desc: string }[] = [
  { value: "variations", label: "Variations from Reference", desc: "Similar density and flow with new composition" },
  { value: "new-ip", label: "New Original Design", desc: "Original abstract, architectural couture silhouette" },
  { value: "material", label: "Design from Materials", desc: "Finished motif composed using uploaded raw materials" },
  { value: "statement-piece", label: "Statement Piece", desc: "Hero centerpiece for gown bodice, jacket or bridal" },
  { value: "pattern", label: "Repeat / Border Pattern", desc: "Seamless yardage repeat or continuous edge border" },
];

const COMPLEXITY_LEVELS: { value: 'simple' | 'moderate' | 'intricate' | 'ultra-complex'; label: string; desc: string }[] = [
  { value: 'simple', label: 'Simple', desc: 'Clean, minimal, 2-3 materials, elegant restraint.' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced density with 3-5 materials.' },
  { value: 'intricate', label: 'Intricate', desc: 'Rich detailing, 5-7 materials, layered depth.' },
  { value: 'ultra-complex', label: 'Ultra-Complex', desc: 'Maximum luxury, 6-8+ materials, museum impact.' },
];

const DesignLightbox = ({
  design,
  onClose,
}: {
  design: GeneratedDesign | null;
  onClose: () => void;
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;
  const touchRef = useRef<{
    dist: number;
    zoom: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [design]);

  const clampPan = (x: number, y: number, currentZoom: number) => {
    if (currentZoom <= 1) return { x: 0, y: 0 };
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || 800;
    const h = rect?.height || 600;
    const maxX = (w * (currentZoom - 0.2)) / 2;
    const maxY = (h * (currentZoom - 0.2)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const updateZoom = useCallback((updater: (prev: number) => number) => {
    setZoom((prev) => {
      const next = Math.min(5, Math.max(1, Math.round(updater(prev) * 10) / 10));
      if (next === 1) setPan({ x: 0, y: 0 });
      else setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.3 : -0.3;
      updateZoom((z) => z + step);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [updateZoom, design]);

  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      updateZoom(() => 2.5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomRef.current <= 1 || e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = panRef.current.x;
    const startPanY = panRef.current.y;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setPan(clampPan(startPanX + dx, startPanY + dy, zoomRef.current));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchRef.current = {
        dist,
        zoom: zoomRef.current,
        startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    } else if (e.touches.length === 1 && zoomRef.current > 1) {
      touchRef.current = {
        dist: 0,
        zoom: zoomRef.current,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    if (e.touches.length === 2 && touchRef.current.dist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      updateZoom(() => touchRef.current!.zoom * (dist / touchRef.current!.dist));
    } else if (e.touches.length === 1 && zoomRef.current > 1 && touchRef.current.dist === 0) {
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;
      setPan(clampPan(touchRef.current.panX + dx, touchRef.current.panY + dy, zoomRef.current));
    }
  };

  return (
    <Dialog
      open={!!design}
      onOpenChange={(open) => {
        if (!open) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
          onClose();
        }
      }}
    >
      <DialogContent className="flex flex-col gap-0 w-[95vw] max-w-5xl h-[90vh] max-h-[90vh] p-4 bg-background/95 backdrop-blur-md border border-border shadow-elevated rounded-md overflow-hidden">
        <DialogTitle className="sr-only">{design?.title || "Design Lightbox"}</DialogTitle>

        {/* Top Controls Bar */}
        <div className="w-full shrink-0 flex items-center justify-between pb-3 pr-8 border-b border-border/50">
          <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-sm shadow-soft text-foreground">
            <button
              type="button"
              onClick={() => updateZoom((z) => z - 0.5)}
              disabled={zoom <= 1}
              className="p-1 text-foreground hover:text-gold disabled:opacity-30 transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold text-foreground min-w-[3rem] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => updateZoom((z) => z + 0.5)}
              disabled={zoom >= 5}
              className="p-1 text-foreground hover:text-gold disabled:opacity-30 transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              disabled={zoom === 1}
              className="px-2 py-0.5 text-xs font-medium text-foreground hover:text-gold disabled:opacity-30 transition-colors flex items-center gap-1 border-l border-border ml-1"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {design && (
            <button
              onClick={() => downloadImage(design.image, `${design.title.replace(/\s+/g, "_")}.png`)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm transition-colors"
              title="Download design"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Viewport: Full image with original aspect ratio, never cropped */}
        <div
          ref={containerRef}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => { touchRef.current = null; }}
          className={`relative flex-1 w-full min-h-0 my-2 overflow-hidden flex items-center justify-center select-none ${
            zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
          }`}
          style={{ touchAction: "none" }}
        >
          {design && (
            <img
              src={design.image}
              alt={design.title}
              draggable={false}
              className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none select-none transition-transform duration-75"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          )}
        </div>

        {/* Caption */}
        {design && (
          <div className="shrink-0 pt-2 border-t border-border/50 text-center w-full">
            <p className="font-display text-sm sm:text-base text-foreground font-medium">{design.title}</p>
            <p className="text-[11px] text-muted-foreground">{design.timestamp}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Studio = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<GenerationMode>("variations");
  const [numGenerations, setNumGenerations] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [application, setApplication] = useState<'garment' | 'furnishing'>("garment");
  const [targetBuyers, setTargetBuyers] = useState<string>("europe");
  const [customTargetBuyers, setCustomTargetBuyers] = useState<string>("");
  const [complexityLevel, setComplexityLevel] = useState<'simple' | 'moderate' | 'intricate' | 'ultra-complex'>("intricate");
  const [materialCount, setMaterialCount] = useState<number | undefined>(undefined);
  const [patternType, setPatternType] = useState<'all-over' | 'half-drop' | 'diamond-lattice' | 'directional-flow' | 'border-trim'>("all-over");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [lightboxDesign, setLightboxDesign] = useState<GeneratedDesign | null>(null);

  const handleFiles = (files: File[]) => {
    const remaining = 10 - uploadedImages.length;
    if (remaining <= 0) return;
    files.filter((f) => f.type.startsWith("image/")).slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImages((prev) => prev.length < 10 ? [...prev, e.target?.result as string] : prev);
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  }, [uploadedImages.length]);

  const handleGenerate = async () => {
    if (uploadedImages.length === 0) return toast.error("Please upload at least one reference image");

    setIsGenerating(true);
    try {
      await generateDesigns({
        mode: selectedMode,
        images: uploadedImages,
        numImages: numGenerations,
        application,
        targetBuyers: targetBuyers === 'custom' ? customTargetBuyers : targetBuyers,
        complexityLevel,
        materialCount: selectedMode === 'statement-piece' ? materialCount : undefined,
        patternType: selectedMode === 'pattern' ? patternType : undefined,
        customInstructions: customInstructions || undefined,
        onDesignGenerated: (design) => {
          setGeneratedDesigns((prev) => [design, ...prev]);
          toast.success(`Rendered: ${design.title}`);
        },
      });
      toast.success("Generation completed!");
    } catch {
      toast.error("Couldn't generate the design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllZip = async () => {
    if (generatedDesigns.length === 0) return;
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      generatedDesigns.forEach((d, i) => zip.file(`${i + 1}_${d.title.replace(/\s+/g, '_')}.png`, d.image.split(',')[1], { base64: true }));
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `atelier-designs-${new Date().toISOString().slice(0, 10)}.zip`,
      });
      a.click();
      toast.success("Archive downloaded");
    } catch {
      toast.error("Failed to generate ZIP");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navigation />

      <div className="pt-28 pb-20 container mx-auto px-6 lg:px-12 flex-1">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-gold/30 bg-gold/5 text-gold text-[10px] tracking-[0.2em] uppercase mb-3">
            <Sparkles className="w-3 h-3" />
            <span>AI Design Studio</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground font-normal tracking-tight mb-2">
            AI Couture <span className="italic text-gold">Design Studio</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload reference motifs, select your desired creative direction, and generate bespoke production-ready embroidery.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Controls Panel */}
          <div className="lg:col-span-6 space-y-6 bg-card border border-border p-6 sm:p-8 rounded-sm shadow-soft">
            {/* Reference Upload */}
            <div>
              <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-3">
                1. Reference Images
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border border-dashed border-border hover:border-gold/60 transition-colors p-6 text-center cursor-pointer group bg-background/50 rounded-sm"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="studio-file-upload"
                />
                <label htmlFor="studio-file-upload" className="cursor-pointer block">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-gold transition-colors" />
                  <p className="text-xs font-medium text-foreground mb-0.5">Click or drag images here to upload</p>
                  <p className="text-[11px] text-muted-foreground">All uploaded images are used (max 10)</p>
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative aspect-square group border border-border overflow-hidden rounded-sm">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-foreground/90 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mode & Generations */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-2">
                  2. Generation Mode
                </label>
                <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as GenerationMode)}>
                  <SelectTrigger className="w-full h-11 border border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[280px]">
                    {GENERATION_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs cursor-pointer py-2">
                        <div className="font-medium text-[#181512]">{m.label}</div>
                        <div className="text-[10px] text-[#524D46]">{m.desc}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-2">
                  Generations
                </label>
                <div className="grid grid-cols-5 gap-1 h-11 p-1 bg-secondary rounded-sm border border-border">
                  {([1, 2, 3, 4, 5] as const).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumGenerations(num)}
                      className={`text-xs font-medium rounded-sm transition-all ${
                        numGenerations === num
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target buyers & Use application */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-2">
                  Target buyers
                </label>
                <Select value={targetBuyers} onValueChange={setTargetBuyers}>
                  <SelectTrigger className="w-full h-10 border border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="europe" className="text-xs cursor-pointer">Europe</SelectItem>
                    <SelectItem value="us" className="text-xs cursor-pointer">United States</SelectItem>
                    <SelectItem value="middle-east" className="text-xs cursor-pointer">Middle East (Dubai)</SelectItem>
                    <SelectItem value="custom" className="text-xs cursor-pointer">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {targetBuyers === "custom" && (
                  <Input
                    value={customTargetBuyers}
                    onChange={(e) => setCustomTargetBuyers(e.target.value)}
                    placeholder="Specify target buyer style..."
                    className="h-9 mt-2 text-xs bg-background border-border"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-2">
                  Use
                </label>
                <Select value={application} onValueChange={(v) => setApplication(v as 'garment' | 'furnishing')}>
                  <SelectTrigger className="w-full h-10 border border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="garment" className="text-xs cursor-pointer">Garment</SelectItem>
                    <SelectItem value="furnishing" className="text-xs cursor-pointer">Home furnishing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Statement piece: Materials Count */}
            {selectedMode === 'statement-piece' && (
              <div className="pt-2 border-t border-border">
                <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-1.5">
                  Materials to Combine (2-8)
                </label>
                <Select value={materialCount ? String(materialCount) : "auto"} onValueChange={(v) => setMaterialCount(v === "auto" ? undefined : Number(v))}>
                  <SelectTrigger className="w-full h-10 border border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="auto" className="text-xs cursor-pointer">AI Autonomous Selection</SelectItem>
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-xs cursor-pointer">Harmonize {n} Materials</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pattern: Pattern Repeat Structure */}
            {selectedMode === 'pattern' && (
              <div className="pt-2 border-t border-border">
                <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-1.5">
                  Pattern Structure
                </label>
                <Select value={patternType} onValueChange={(v) => setPatternType(v as typeof patternType)}>
                  <SelectTrigger className="w-full h-10 border border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="all-over" className="text-xs cursor-pointer">All-Over Scatter Repeat</SelectItem>
                    <SelectItem value="half-drop" className="text-xs cursor-pointer">Half-Drop Fluid Repeat</SelectItem>
                    <SelectItem value="diamond-lattice" className="text-xs cursor-pointer">Diamond Lattice Grid</SelectItem>
                    <SelectItem value="directional-flow" className="text-xs cursor-pointer">Directional Continuous Flow</SelectItem>
                    <SelectItem value="border-trim" className="text-xs cursor-pointer">Border / Trim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Complexity Slider (Always Active) */}
            <div className="pt-2 border-t border-border">
              <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-2">
                Design Complexity
              </label>
              <div className="space-y-2">
                <Slider
                  value={[COMPLEXITY_LEVELS.findIndex((c) => c.value === complexityLevel)]}
                  min={0}
                  max={COMPLEXITY_LEVELS.length - 1}
                  step={1}
                  onValueChange={([idx]) => idx !== undefined && setComplexityLevel(COMPLEXITY_LEVELS[idx].value)}
                />
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-foreground">{COMPLEXITY_LEVELS.find((c) => c.value === complexityLevel)?.label}</span>
                  <span className="text-muted-foreground">{COMPLEXITY_LEVELS.find((c) => c.value === complexityLevel)?.desc}</span>
                </div>
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="pt-2 border-t border-border">
              <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium block mb-2">
                Custom Instructions (Optional)
              </label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Specific color harmony, motifs, scale, or artisan techniques..."
                className="min-h-[80px] text-xs bg-background border-border resize-none"
              />
            </div>

            {/* Generate Action */}
            <Button
              variant="elegant"
              size="lg"
              className="w-full h-12 text-xs tracking-[0.2em] uppercase"
              onClick={handleGenerate}
              disabled={isGenerating || uploadedImages.length === 0}
            >
              {isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  Generating Designs in Real-Time...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Generate {numGenerations} {numGenerations === 1 ? "Design" : "Designs"}
                </span>
              )}
            </Button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Generated Designs {generatedDesigns.length > 0 && `(${generatedDesigns.length})`}
              </label>
              {generatedDesigns.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadAllZip} className="h-8 text-[11px]">
                    <Download className="w-3 h-3 mr-1" />
                    Download ZIP
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generatedDesigns.forEach((d, i) => downloadImage(d.image, `${i + 1}_${d.title}.png`))}
                    className="h-8 text-[11px]"
                  >
                    Save All
                  </Button>
                </div>
              )}
            </div>

            {generatedDesigns.length === 0 && !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border p-12 text-center rounded-sm bg-card/40">
                <Sparkles className="w-10 h-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground mb-1">Awaiting Generation</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Upload inspiration photos and click Generate. Designs will stream onto the screen immediately as they are created.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Streaming Loader Skeleton if currently working */}
                {isGenerating && (
                  <div className="relative aspect-square border border-gold/40 bg-gold/5 flex flex-col items-center justify-center p-6 text-center rounded-sm animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin text-gold mb-2" />
                    <p className="text-xs font-medium text-foreground">Rendering your design...</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Appearing on screen instantly upon completion</p>
                  </div>
                )}

                {generatedDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="group relative bg-card border border-border overflow-hidden rounded-sm shadow-soft transition-all hover:border-gold/60"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightboxDesign(design)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setLightboxDesign(design);
                      }}
                      className="aspect-square cursor-pointer overflow-hidden bg-secondary/30"
                      title="Inspect design"
                    >
                      <img
                        src={design.image}
                        alt={design.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-3.5 flex items-center justify-between bg-card">
                      <div>
                        <p className="font-display text-xs font-medium text-foreground tracking-wide">{design.title}</p>
                        <p className="text-[10px] text-muted-foreground">{design.timestamp}</p>
                      </div>
                      <button
                        onClick={() => downloadImage(design.image, `${design.title.replace(/\s+/g, '_')}.png`)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm transition-colors"
                        title="Download motif image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DesignLightbox design={lightboxDesign} onClose={() => setLightboxDesign(null)} />
      <Footer />
    </main>
  );
};

export default Studio;
