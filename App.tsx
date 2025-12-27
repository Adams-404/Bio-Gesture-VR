import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import WebcamController from './components/WebcamController';
import AIChatPanel from './components/AIChatPanel';
import { fetchPDB } from './services/pdbService';
import { MoleculeData, GestureState, GestureType } from './types';
import { DEFAULT_PDB_ID } from './constants';

const App: React.FC = () => {
  const [pdbId, setPdbId] = useState(DEFAULT_PDB_ID);
  const [moleculeData, setMoleculeData] = useState<MoleculeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Gesture State
  const [gestureState, setGestureState] = useState<GestureState>({
    type: GestureType.NONE,
    rotationDelta: { x: 0, y: 0 },
    scaleFactor: 1.0,
    pointerPosition: { x: 0, y: 0 },
    handPresent: false
  });

  const loadPDB = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPDB(id);
      setMoleculeData(data);
    } catch (err) {
      setError("Failed to load PDB. ID might be invalid.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPDB(pdbId);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPDB(pdbId);
  };

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden text-slate-100 font-sans">
      
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene3D data={moleculeData} gesture={gestureState} loading={loading} />
      </div>

      {/* Header / Search */}
      <div className="absolute top-4 left-4 z-40 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-lg border border-slate-700 shadow-xl flex flex-col gap-2">
         <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
             Bio-Gesture VR
         </h1>
         <form onSubmit={handleSearch} className="flex gap-2">
             <input 
                type="text" 
                value={pdbId}
                onChange={(e) => setPdbId(e.target.value.toUpperCase())}
                className="bg-black border border-slate-600 rounded px-2 py-1 w-24 text-center tracking-widest font-mono text-white focus:border-cyan-500 outline-none"
                placeholder="PDB ID"
                maxLength={4}
             />
             <button 
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-sm transition-colors"
                disabled={loading}
             >
                 {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Load"}
             </button>
         </form>
         {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>

      {/* Gesture HUD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <div className={`px-4 py-1 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
              gestureState.type !== GestureType.NONE ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'opacity-0 translate-y-[-10px]'
          }`}>
              {gestureState.type === GestureType.GRIP && "ROTATING (GRIP)"}
              {gestureState.type === GestureType.PINCH_ZOOM && "ZOOMING (PINCH)"}
              {gestureState.type === GestureType.POINT && "INSPECTING (POINT)"}
          </div>
      </div>

      {/* Help / Legend */}
      <div className="absolute bottom-4 right-4 z-30 text-xs text-slate-400 bg-black/80 p-3 rounded-lg backdrop-blur-sm border border-white/10">
          <h3 className="text-white mb-2 font-semibold">Controls</h3>
          <ul className="space-y-1">
              <li className="flex items-center gap-2"><i className="fa-solid fa-hand-fist text-yellow-400 w-4"></i> Closed Fist: Rotate</li>
              <li className="flex items-center gap-2"><i className="fa-solid fa-hand-scissors text-green-400 w-4"></i> Two Hands: Zoom</li>
              <li className="flex items-center gap-2"><i className="fa-solid fa-hand-point-up text-cyan-400 w-4"></i> Index Finger: Inspect</li>
              <li className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10"><i className="fa-solid fa-mouse text-slate-300 w-4"></i> Mouse: Fallback</li>
          </ul>
      </div>

      {/* MediaPipe Controller */}
      <WebcamController onGestureUpdate={setGestureState} />

      {/* AI Assistant */}
      <AIChatPanel pdbId={pdbId} />

    </div>
  );
};

export default App;