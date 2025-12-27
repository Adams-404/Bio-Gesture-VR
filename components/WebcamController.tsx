import React, { useEffect, useRef, useState } from 'react';
import { GestureType, GestureState } from '../types';

interface WebcamControllerProps {
  onGestureUpdate: (state: GestureState) => void;
}

// Types for MediaPipe Hands (simplified)
interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface Results {
  multiHandLandmarks: Landmark[][];
  image: CanvasImageSource;
}

const WebcamController: React.FC<WebcamControllerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  
  // State refs for gesture logic
  const previousHandPos = useRef<{x: number, y: number} | null>(null);
  const previousPinchDist = useRef<number | null>(null);
  
  // Refs for loop control
  const requestRef = useRef<number>(0);
  const handsRef = useRef<any>(null); // Type as any for the global library instance

  const onResults = (results: Results) => {
    // Draw debugging overlay
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    // Logic for gestures
    let newGesture: GestureState = {
      type: GestureType.NONE,
      rotationDelta: { x: 0, y: 0 },
      scaleFactor: 1.0,
      pointerPosition: { x: 0, y: 0 },
      handPresent: false
    };

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      newGesture.handPresent = true;
      const landmarks1 = results.multiHandLandmarks[0];

      // Draw landmarks
      for (const landmarks of results.multiHandLandmarks) {
        for(const lm of landmarks) {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#00FF00';
            ctx.fill();
        }
      }

      // Check for PINCH ZOOM (Two Hands)
      if (results.multiHandLandmarks.length === 2) {
        const landmarks2 = results.multiHandLandmarks[1];
        // Distance between Wrist(0) of hand 1 and hand 2
        const dx = landmarks1[0].x - landmarks2[0].x;
        const dy = landmarks1[0].y - landmarks2[0].y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (previousPinchDist.current !== null) {
          const delta = dist - previousPinchDist.current;
          newGesture.scaleFactor = 1 + delta * 1.5; 
          newGesture.type = GestureType.PINCH_ZOOM;
        }
        previousPinchDist.current = dist;
        previousHandPos.current = null;
      } else {
        // ONE HAND GESTURES
        previousPinchDist.current = null;
        
        // Detect Grip (Fist) vs Point
        const wrist = landmarks1[0];
        const indexTip = landmarks1[8];
        const middleTip = landmarks1[12];
        const ringTip = landmarks1[16];
        const pinkyTip = landmarks1[20];

        const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2));

        const isIndexExtended = dist(wrist, indexTip) > 0.25;
        const isMiddleCurled = dist(wrist, middleTip) < 0.2;
        const isRingCurled = dist(wrist, ringTip) < 0.2;
        const isPinkyCurled = dist(wrist, pinkyTip) < 0.2;

        const isGrip = !isIndexExtended && isMiddleCurled && isRingCurled && isPinkyCurled;
        const isPoint = isIndexExtended && isMiddleCurled && isRingCurled;

        if (isGrip) {
          newGesture.type = GestureType.GRIP;
          const currentPos = { x: wrist.x, y: wrist.y };
          
          if (previousHandPos.current) {
             // Invert X because webcam is mirrored
             newGesture.rotationDelta = {
               x: -(currentPos.x - previousHandPos.current.x) * 3,
               y: (currentPos.y - previousHandPos.current.y) * 3
             };
          }
          previousHandPos.current = currentPos;
        } else if (isPoint) {
            newGesture.type = GestureType.POINT;
            previousHandPos.current = null;
            // Map 0-1 to -1 to 1 for Three.js NDC
            // Mirror X
            newGesture.pointerPosition = {
                x: (1 - indexTip.x) * 2 - 1,
                y: -(indexTip.y * 2 - 1)
            };
        } else {
            previousHandPos.current = null;
        }
      }
    } else {
        previousPinchDist.current = null;
        previousHandPos.current = null;
    }

    onGestureUpdate(newGesture);
    ctx.restore();
  };

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Use global Hands from the script tag
    const Hands = (window as any).Hands;
    
    if (!Hands) {
        console.error("MediaPipe Hands script not loaded.");
        setLoading(false);
        return;
    }

    const hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setLoading(false);
                    // Start the loop
                    requestRef.current = requestAnimationFrame(processVideo);
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
            setLoading(false);
        }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handsRef.current) handsRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processVideo = async () => {
      if (videoRef.current && handsRef.current) {
          if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
             await handsRef.current.send({ image: videoRef.current });
          }
          requestRef.current = requestAnimationFrame(processVideo);
      }
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 w-48 h-36 bg-black/50 rounded-lg overflow-hidden border border-white/20 shadow-lg">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} width={320} height={240} className="w-full h-full object-cover transform scale-x-[-1]" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
          Loading Vision...
        </div>
      )}
      <div className="absolute bottom-1 left-1 text-[10px] text-white/70">
        Webcam Feed
      </div>
    </div>
  );
};

export default WebcamController;