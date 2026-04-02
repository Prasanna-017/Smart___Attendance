/**
 * Custom hook for accessing the webcam.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export default function useWebcam() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Request permissions first to get device labels, then enumerate
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        return navigator.mediaDevices.enumerateDevices();
      })
      .then(ds => {
        const videoDevices = ds.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !deviceId) {
          setDeviceId(videoDevices[0].deviceId);
        }
      })
      .catch(err => console.error("Error enumerating devices:", err));
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      
      const videoConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
      };
      
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = 'user';
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      console.error('Webcam error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permission.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`
      );
      setIsActive(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    error,
    startWebcam,
    stopWebcam,
    devices,
    deviceId,
    setDeviceId,
  };
}
