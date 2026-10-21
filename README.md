# Atelier — AI Embroidery Design Generator

> Production-ready AI embroidery design generator for hand-embroidery and couture motif design with Gemini on Vertex AI.

An editorial design studio for fashion designers and textile ateliers to conceptualize, iterate, and generate photorealistic, hand-stitchable embroidery motifs from references and raw materials.

## What It Does

- **Upload Reference Motifs & Materials**: Drag and drop up to 10 inspiration images or material photos (beads, sequins, crystals, threads) with automatic client-side compression.
- **5 Couture Generation Modes**: Generate original embroidery compositions tailored to specific garment placements, statement centerpieces, material inventories, or repeating yardage.
- **Precision Craftsmanship Controls**: Adjust design complexity from minimal restraint to museum-grade density, and target specific regional markets (Europe, US, Middle East, or custom).
- **Substrate Context**: Select intended application (Garment on silk organza vs. Home furnishing on heavy linen) to adapt scale and background texture.
- **Real-Time Streaming & Export**: Watch motifs stream onto the screen as they generate (1–5 iterations), preview in full-screen modal, and download individual assets or a combined ZIP archive.

## Features

- **Variations from Reference**: Creates new hand-embroidery compositions preserving the density, flow, and material family of uploaded inspiration without replicating existing shapes.
- **New Original Design**: Invents fresh, abstract architectural silhouettes with three-dimensional relief, free of decorative clichés or known fashion house motifs.
- **Design from Materials**: Formulates production-feasible motifs using only uploaded raw material photos (beads, crystals, sequins, threads) with realistic weight distribution.
- **Statement Piece**: Engineers high-impact centerpiece designs (25–40 cm) with focal points, radiating geometry, and 3–5 layers of depth for gowns, jackets, or bridal wear.
- **Repeat / Border Pattern**: Generates continuous edging borders (3–8 cm) for necklines and cuffs, or seamless 2x2 repeating yardage patterns with structured repeat logic.
- **Target Buyers Profiling**: Fine-tunes aesthetic direction for regional markets (Europe: muted tonal palette; US: high-sparkle contrast; Middle East: rich gold tones, dense coverage; Custom text).
- **Generation Batching**: Generates between 1 to 5 variations per batch with progressive real-time rendering.
- **Bulk & Single Export**: Single-click image downloads or bulk packaging into timestamped `.zip` archives via JSZip.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, shadcn/ui (Radix UI primitives), Lucide React
- **Client Processing**: HTML5 Canvas (client-side image downscaling to 1024px @ 0.85 JPEG)
- **Exporting**: JSZip
- **AI & Backend**: Google Gen AI SDK (`@google/genai`) on Vertex AI Express Mode (`gemini-2.5-flash-image`) via Vercel Serverless Functions (`api/generate.ts`)

## Architecture

The project pairs a Vite + React Single Page Application with a Vercel Serverless Function (`api/generate.ts`). To protect API credentials, the browser never handles Vertex AI API keys directly. Client-side images are compressed on HTML5 Canvas to keep multi-image payloads under serverless size thresholds, then forwarded to `/api/generate`. The serverless function initializes `@google/genai` in Vertex AI express mode (`vertexai: true`) with `process.env.VERTEX_API_KEY`, routing requests to the model configured via `process.env.IMAGE_MODEL` (default: `gemini-2.5-flash-image`) with a 60-second execution budget (`maxDuration = 60`).

## Getting Started

### Prerequisites

Node.js 18+ and npm.

### Installation

1. Clone the repository and install dependencies:
   ```sh
   git clone <REPO_URL>
   cd aifashion
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the root directory:
   ```env
   # Server-side only, never exposed to the browser
   VERTEX_API_KEY=your_vertex_express_api_key_here
   IMAGE_MODEL=gemini-2.5-flash-image
   VERTEX_LOCATION=us-central1
   ```

3. Run the development server:
   ```sh
   # Runs Vite and Vercel serverless /api endpoint locally
   npx vercel dev
   ```
   *Note: Running `npm run dev` serves the Vite client only; `npx vercel dev` is required for `/api/generate` to run locally.*

4. Production build:
   ```sh
   npm run build
   ```

### Deployment

Deploy directly to Vercel. Ensure `VERTEX_API_KEY` and optional `IMAGE_MODEL` and `VERTEX_LOCATION` are configured in your **Vercel Project Settings > Environment Variables**.

## What I Built

- **Domain-Specific Prompt Engineering**: Formulated prompt templates translating couture textile rules (hand-stitch feasibility, physical material constraints, facet sparkle physics, repeat mathematics) into deterministic prompts across 5 modes without visual artifacting or branding leakage.
- **Secure Serverless Proxy with Vertex AI Express Mode**: Moved client-side API exposure to an isolated Vercel serverless function (`api/generate.ts`) authenticated through Vertex AI Express Mode using `@google/genai`, eliminating free-tier quota limits while protecting credentials.
- **Client-Side Payload Optimization**: Built a zero-dependency HTML5 Canvas compression pipeline that downscales uploaded reference photos to a maximum dimension of 1024px at 85% JPEG quality, allowing up to 10 reference images per prompt while preventing HTTP 413 payload errors.
- **Progressive Streaming UX**: Replaced synchronous blocking batch requests with a progressive callback architecture where each motif renders into an interactive dialog card the instant Google returns it, paired with live loading skeletons and batch zip archiving.
