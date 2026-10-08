import { useRef, useState, useEffect, useCallback } from 'react';
import { FiCamera, FiShare2, FiPlay, FiSquare } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './TryOnCanvas.css';

export default function TryOnCanvas({ productId, overlayUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [clothingImg, setClothingImg] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  // Load overlay image
  useEffect(() => {
    if (!overlayUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setClothingImg(img);
    img.src = overlayUrl;
  }, [overlayUrl]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setActive(true);
      drawLoop();
    } catch {
      toast.error('Camera access denied. Please allow camera permission.');
    }
  };

  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 640, 480);
    if (clothingImg) {
      ctx.drawImage(clothingImg, 150, 80, 320, 380);
    }
    animRef.current = requestAnimationFrame(drawLoop);
  }, [clothingImg]);

  useEffect(() => {
    if (active) { drawLoop(); }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active, drawLoop]);

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setActive(false);
  };

  const takeSnapshot = async () => {
    const dataURL = canvasRef.current.toDataURL('image/png');
    setSnapshot(dataURL);
    // Download
    const link = document.createElement('a');
    link.download = `tryon-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    // Save to DB
    try {
      await API.post('/tryon/save-snapshot', { product_id: productId, snapshot_url: dataURL });
      toast.success('Snapshot saved!');
    } catch { toast.error('Failed to save snapshot'); }
  };

  const shareSnapshot = async () => {
    if (navigator.share && snapshot) {
      try {
        await navigator.share({ title: 'My Gen-Z Threads Try-On', text: 'Check out this look!', url: snapshot });
      } catch { /* user cancelled */ }
    } else {
      toast('Share not supported on this browser');
    }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  return (
    <div className="tryon-container">
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <canvas ref={canvasRef} width={640} height={480} className="tryon-canvas" />
      <div className="tryon-controls">
        {!active ? (
          <button onClick={startCamera} className="tryon-btn start">
            <FiPlay /> Start Try-On
          </button>
        ) : (
          <>
            <button onClick={takeSnapshot} className="tryon-btn snap">
              <FiCamera /> Snapshot
            </button>
            <button onClick={shareSnapshot} className="tryon-btn share" disabled={!snapshot}>
              <FiShare2 /> Share
            </button>
            <button onClick={stopCamera} className="tryon-btn stop">
              <FiSquare /> Stop
            </button>
          </>
        )}
      </div>
      {snapshot && (
        <div className="snapshot-preview">
          <h4>Latest Snapshot</h4>
          <img src={snapshot} alt="Snapshot" />
        </div>
      )}
    </div>
  );
}
