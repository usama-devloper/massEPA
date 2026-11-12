# MassEPA - Energy Performance Assessment & Inspection Platform

MassEPA is a modern web application built for energy consultants, inspectors, and back-office teams to conduct and manage Dutch energy performance assessments (**NTA 8800**, EP-Online, energy labeling, building inspection sheets, and WWS points).

---

## 🌟 Key Features

- **Field Inspection Portal (Inspector Invoersheet & Invoersheet V2)**:
  - **Chapter 1: Visuals & House Information**: Floor plans, elevations, 3D AHN voxel model, cadastral maps, and street view facade captures.
  - **Chapter 2: Building Overview & Identification**: BAG & Pand ID integration, real-time NTA 8800 label calculator, technical details, and dynamic GBO (Usable Floor Area) tracking (GBO, GBO_2, GBO_3).
  - **Chapter 3: Exterior Geometry & Facades**: Comprehensive facade matrix, orientation, surface area calculation ($L \times W$), linked frame tracking, inspection photo uploads, and CAD technical drawings.
  - **Chapter 4: Interior Spaces & Installations**: Heating, tapwater, ventilation, cooling, and solar installation recording.
- **Back-Office Review & Quality Control**:
  - Verification workflow, audit tracking, validation rules, status flags (green / yellow / red review indicators), and EP-Online afmeldingsvoorbereiding.
- **Multilingual Support (i18n)**:
  - Complete English (`en`) and Dutch (`nl`) translations.
- **Interactive Visuals & Media Management**:
  - In-browser zoom, pan, image inspection, and PDF thumbnail rendering.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + PostCSS + Autoprefixer
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations & Gestures**: [Motion](https://motion.dev/) + [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **AI Integrations**: [@google/genai](https://github.com/google-gemini/generative-ai-js) (Google Gemini SDK)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn` / `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd massEPA
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will start at `http://localhost:3000` (or the network host configured in Vite).

---

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Runs the Vite development server with hot-module replacement on port `3000`. |
| `npm run build` | Compiles TypeScript and builds production assets into `dist/`. |
| `npm run preview` | Locally previews the production build. |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |
| `npm run clean` | Removes the `dist` build directory. |

---

## 📁 Project Structure

```text
massEPA/
├── public/                 # Static assets (favicons, demo photos, icons)
├── scripts/                # Utility scripts & question generator scripts
├── src/
│   ├── components/         # Reusable UI components (modals, inputs, select boxes, viewers)
│   ├── context/            # Global React Contexts (Language, Auth, Theme)
│   ├── data/               # Mock dossiers, default data structures
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Localization files (en.json, nl.json)
│   ├── pages/              # Application pages
│   │   ├── backoffice/     # Back-office dashboard & audit views
│   │   ├── inspector/      # Inspector field portal & Invoersheet V2
│   │   │   └── invoersheetV2/ # V2 Modular chapters (Visuals, Overview, Exterior, Interior)
│   │   └── ...             # Auth & General pages
│   ├── services/           # External API & Gemini AI integrations
│   ├── storage/            # Local storage & data persistence utilities
│   ├── types/              # Global TypeScript interfaces
│   ├── utils/              # Calculation engines (NTA 8800, file helpers)
│   ├── App.tsx             # Root router & application wrapper
│   └── main.tsx            # Application entrypoint
├── package.json            # Project manifest & dependencies
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind CSS design system configuration
```

---

## 📋 Standards & Compliance

- **NTA 8800**: Built adhering to Dutch energy performance calculation standards for residential buildings (Bestaande bouw & Nieuwbouw).
- **LV-BAG / Kadaster**: Standardized format for address validation, Pand ID, and VBO ID references.
