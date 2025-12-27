# Bio-Gesture VR 🧬✋

> **"Minority Report" for Molecular Biology.**  
> An interactive, no-touch molecular visualization engine powered by **Three.js** & **MediaPipe**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-cyan)
![Three.js](https://img.shields.io/badge/Three.js-r160+-white)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.0-purple)

## 🌟 The Vision

Traditional molecular viewers (like PyMOL or VMD) rely heavily on complex mouse-and-keyboard shortcuts, detaching the researcher from the structure they are studying. **Bio-Gesture VR** bridges this gap by turning your standard webcam into a spatial controller.

Simply **reach out and grab** a protein. Rotate it, zoom into active sites with your hands, and ask an AI assistant to explain its biological function in real-time.

---

## 🚀 Features

### 1. Spatial Hand Tracking
Using **MediaPipe Hands**, the application tracks 21 skeletal landmarks on your hands in real-time directly in the browser.
*   **Grip (Closed Fist):** Grab the molecule and rotate it in 3D space.
*   **Pinch-and-Pull (Two Hands):** Move hands apart to zoom in, together to zoom out.
*   **Point (Index Finger):** Use your finger as a laser pointer to inspect specific atoms and residues.

### 2. Real-Time Molecular Rendering
*   **Direct PDB Integration:** Fetches live data from the **RCSB PDB** database.
*   **High Performance:** Uses Three.js `InstancedMesh` to render thousands of atoms at 60FPS.
*   **CPK Coloring:** Standard scientific coloring for elements (Carbon, Oxygen, Nitrogen, etc.).

### 3. Gemini AI Assistant 🧠
Integrated with the **Google Gemini API** (`gemini-3-flash-preview`), the app acts as a knowledgeable lab partner.
*   **Auto-Summarization:** Automatically generates a biological summary when a new PDB ID is loaded.
*   **Contextual Chat:** Ask questions like *"Where is the active site?"* or *"What does this protein do?"* and get answers specific to the currently viewed molecule.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 | UI Composition and State Management. |
| **3D Engine** | Three.js / R3F | WebGL rendering and scene graph. |
| **Vision** | MediaPipe Hands | Client-side ML for hand tracking. |
| **AI** | Google GenAI SDK | Generative AI for scientific explanations. |
| **Data** | RCSB PDB API | Biological structure data source. |
| **Styling** | Tailwind CSS | Modern, utility-first styling. |

---

## 🎮 Controls & Gestures

| Gesture | Action | Visual Cue |
| :--- | :--- | :--- |
| **Closed Fist** ✊ | **Rotate** | Rotate your wrist to spin the molecule. |
| **Two Hands** 👐 | **Zoom** | Move hands apart to scale up, together to scale down. |
| **Index Finger** ☝️ | **Inspect** | Point at an atom to see its Element, ID, and Residue. |
| **Mouse** 🖱️ | **Fallback** | Standard OrbitControls are enabled if hands are not detected. |

---

## 📦 Installation & Setup

### Prerequisites
*   A modern web browser (Chrome/Edge recommended for WebGL/WebGPU).
*   A webcam.
*   **Google Gemini API Key**.

### Environment Variables
The application requires a valid Google GenAI API key to function.
The key is accessed via `process.env.API_KEY`.

### Running Locally
Since this project uses ES Modules via CDN (esm.sh) for simplicity in this specific environment, no `npm install` is technically required for the dependencies if running in a pure ESM environment, but standard development usually follows:

1.  **Clone the repository**
2.  **Set your API Key**
    Ensure your environment provides `process.env.API_KEY`.
3.  **Run the dev server**
    (Command depends on your specific bundler setup, e.g., Vite).

```bash
npm run dev
```

---

## 🏗️ Architecture

### `WebcamController.tsx`
Handles the MediaPipe initialization. It captures the video feed, processes the frames to find hand landmarks, and interprets them into a `GestureState` object (Rotation, Scale, Pointer) which is passed up to the App.

### `Scene3D.tsx`
The Three.js canvas. It receives the `GestureState` and applies math transformations to the molecule group. It handles the `InstancedMesh` logic to parse the raw atom data into visual spheres.

### `geminiService.ts`
A stateless service layer that communicates with the Google GenAI API. It handles the prompt engineering required to give the AI "context" about the PDB ID being viewed.

---

## 🔮 Future Roadmap

*   **Ligand Docking:** Allow users to "grab" a drug molecule and manually fit it into a protein binding pocket.
*   **Electrostatic Surfaces:** Shader-based visualization of surface charges.
*   **Multi-Model Support:** Switch between Cartoon, Ribbon, and Surface representations.

---

## 📄 License

MIT License. See `LICENSE` for details.
