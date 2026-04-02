/**
 * Custom hook for continuous face detection loop.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { detectSingleFace, matchFace, drawDetection } from '../services/faceDetection';

export default function useFaceDetection(videoRef, canvasRef, knownStudents) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const [fps, setFps] = useState(0);
  const intervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(null);

  const startDetection = useCallback(() => {
    if (intervalRef.current) return;
    setIsDetecting(true);

    // FPS counter
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    // Detection loop - every 500ms to balance performance vs responsiveness
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const result = await detectSingleFace(videoRef.current);
        frameCountRef.current++;

        if (result && canvasRef.current) {
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          };

          // Try to match against known faces
          const match = matchFace(result.descriptor, knownStudents);

          if (match) {
            const label = `${match.student.name} (${Math.round(match.confidence * 100)}%)`;
            drawDetection(canvasRef.current, result, displaySize, label, '#10b981');
            setLastMatch(match);
          } else {
            drawDetection(canvasRef.current, result, displaySize, 'Unknown', '#f43f5e');
            setLastMatch(null);
          }
        } else if (canvasRef.current) {
          // No face detected - clear canvas
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setLastMatch(null);
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, 500);
  }, [videoRef, canvasRef, knownStudents]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    setIsDetecting(false);
    setFps(0);
    setLastMatch(null);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [canvasRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    };
  }, []);

  return {
    isDetecting,
    lastMatch,
    fps,
    startDetection,
    stopDetection,
  };
}
