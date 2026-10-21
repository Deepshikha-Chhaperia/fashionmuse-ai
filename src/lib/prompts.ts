export const PROMPTS = {
  variations:
    "Create one new hand-embroidery motif based on the attached reference. Keep the reference's density, flow and material family. Do not copy any shape, curve or layout from it; invent a new composition. Show the finished embroidery as a photorealistic close-up on {{BASE_FABRIC}}: visible bead, crystal and thread texture, soft even studio light, plain off-white background. The design must be hand-stitchable by a skilled embroiderer, with clear negative space, and must not use any recognizable designer motif, logo or protected symbol. No text, numbers, labels or watermarks anywhere in the image.",

  "new-ip":
    "Invent one completely original hand-embroidery motif. Use the attached reference only for the general quality level, not for shapes. Do not use common patterns: no paisley, mandala, standard floral repeats, damask, or art deco sunbursts. Invent a new shape language: abstract and architectural, one strong silhouette, clear movement. Show the finished embroidery as a photorealistic close-up on {{BASE_FABRIC}}: three-dimensional relief, bead and thread texture, soft studio light, plain off-white background. Hand-stitchable, balanced density with breathing space, nothing traceable to a known fashion house. No text, numbers, labels or watermarks anywhere in the image.",

  material:
    "The attached photos show raw embroidery materials: beads, crystals, sequins and threads. Design one finished hand-embroidery motif that uses only these materials. Place the largest crystals or beads as focal points, small beads as fills and gradients, sequins where directional shine is needed. The arrangement must be physically possible to hand-stitch: stable, with attachment space, and a weight the fabric can support. Show the finished embroidery as a photorealistic close-up on {{BASE_FABRIC}}: realistic reflections and facet sparkle, soft studio light, plain off-white background, clear negative space. No text, numbers, labels or watermarks anywhere in the image.",

  "statement-piece":
    "Design one large centerpiece hand-embroidery, 25-40 cm, the hero element of an evening gown bodice, jacket back or bridal ensemble. Composition: one strong focal point, supporting elements radiating outward, dense center easing into lighter edges, 3-5 visible layers of depth from base beadwork to top crystal highlights. Use {{MATERIAL_COUNT}} material types: large crystals as hero pieces, small beads and metallic thread for detail. Show the finished embroidery as a photorealistic close-up on {{BASE_FABRIC}}: sparkle and relief under soft dramatic light, plain background. Hand-stitchable, fully original, no known couture-house motifs. No text, numbers, labels or watermarks anywhere in the image.",

  pattern:
    "{{PATTERN_BLOCK}} Show the finished embroidery as a photorealistic rendering on {{BASE_FABRIC}}: even studio light across the whole surface, visible bead and thread texture, plain neutral background. Hand-stitchable at consistent density, original, no known designer patterns. No text, numbers, labels or watermarks anywhere in the image.",
};

export type GenerationMode = keyof typeof PROMPTS;
