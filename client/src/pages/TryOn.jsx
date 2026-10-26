import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiLoader, FiCheck, FiUpload, FiX } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './TryOn.css';

export default function TryOn() {
  const [resultImage, setResultImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Customer's own photo + a real product photo (FASHN VTON)
  const [personPhoto, setPersonPhoto] = useState(null); // base64 data URL (static/upload mode)
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Live camera try-on
  const [cameraOpen, setCameraOpen] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const liveSessionRef = useRef(0);
  const busyRef = useRef(false);
  const autoUpdateRef = useRef(true);
  const selectedProductRef = useRef(null);

  useEffect(() => { autoUpdateRef.current = autoUpdate; }, [autoUpdate]);
  useEffect(() => { selectedProductRef.current = selectedProduct; }, [selectedProduct]);

  // The <video> element only mounts once cameraOpen becomes true, so the
  // stream can't be attached inside openCamera() itself (videoRef.current
  // is still null at that point) — attach it here once it exists.
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get('/products?sort=newest');
        if (cancelled) return;
        const list = (res.data || []).slice(0, 24);
        setProducts(list);
        if (list.length) setSelectedProduct(list[0]);
      } catch {
        if (!cancelled) toast.error('Failed to load products for try-on');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    liveSessionRef.current++;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const handlePersonPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPersonPhoto(reader.result);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  };

  const grabFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    const vw = video.videoWidth, vh = video.videoHeight;
    let sw = vh * 3 / 4, sh = vh;
    if (sw > vw) { sw = vw; sh = vw * 4 / 3; }
    canvas.width = 768;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const runTryOnOnce = async (photoDataUrl, denoiseSteps = 20) => {
    if (!photoDataUrl || busyRef.current) return;
    if (!selectedProductRef.current) {
      toast.error('Select a garment first');
      return;
    }
    busyRef.current = true;
    setProcessing(true);
    try {
      const res = await API.post('/tryon/ai-try-on', {
        person_image: photoDataUrl,
        garment_image_url: selectedProductRef.current.image_url,
        garment_description: selectedProductRef.current.name,
        garment_category: selectedProductRef.current.category,
        denoise_steps: denoiseSteps,
      });
      if (res.data?.success && res.data?.result_image) {
        setResultImage(`data:image/png;base64,${res.data.result_image}`);
      } else {
        toast.error(res.data?.message || 'AI try-on failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI try-on request failed');
    } finally {
      busyRef.current = false;
      setProcessing(false);
    }
  };

  // Continuously refreshes the result from the live camera feed while the
  // session is open and Auto-update is on. Uses fewer diffusion steps (8)
  // than a one-off upload, trading a little quality for ~4x the speed, so
  // the preview refreshes roughly every 8-10s instead of 30-40s — still not
  // real-time frame-by-frame video, but close to a continuous live look.
  const runLiveLoop = async (sessionId) => {
    while (liveSessionRef.current === sessionId) {
      if (autoUpdateRef.current) {
        const frame = grabFrame();
        if (frame) await runTryOnOnce(frame, 8);
      }
      if (liveSessionRef.current !== sessionId) break;
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 960, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setPersonPhoto(null);
      setResultImage(null);
      setCameraOpen(true);
      const sessionId = ++liveSessionRef.current;
      runLiveLoop(sessionId);
    } catch (err) {
      toast.error('Could not access camera: ' + err.message);
    }
  };

  const stopCamera = () => {
    liveSessionRef.current++; // invalidates the running loop
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const handleTryOnNow = () => {
    const frame = grabFrame();
    if (frame) runTryOnOnce(frame, 8);
  };

  const handleAITryOn = () => {
    if (!personPhoto) {
      toast.error('Upload a photo of yourself first');
      return;
    }
    runTryOnOnce(personPhoto);
  };

  return (
    <div className="vto-page">
      <Link to="/products" className="vto-back">
        <FiArrowLeft /> Back to Shop
      </Link>

      <header className="vto-header">
        <h1><FiCamera /> Virtual Try-On</h1>
        <p>Go live with your camera for a continuously-updating AI try-on, or upload a photo instead.</p>
      </header>

      <div className="vto-layout">
        <section className="vto-panel">
          <h2>1. Your Photo</h2>
          {cameraOpen ? (
            <div className="vto-camera-box">
              <video ref={videoRef} playsInline muted className="vto-camera-video" />
              <div className="vto-camera-controls">
                <label className="vto-auto-toggle">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                  />
                  Auto-update
                </label>
                <button type="button" className="vto-camera-btn capture" onClick={handleTryOnNow} disabled={!selectedProduct}>
                  <FiCamera /> Try On Now
                </button>
                <button type="button" className="vto-camera-btn cancel" onClick={stopCamera}>
                  <FiX /> Stop Camera
                </button>
              </div>
            </div>
          ) : (
            <>
              <label className="vto-upload">
                <input type="file" accept="image/*" onChange={handlePersonPhotoChange} hidden />
                {personPhoto ? (
                  <img src={personPhoto} alt="You" className="vto-upload-preview" />
                ) : (
                  <span className="vto-upload-placeholder">
                    <FiUpload /> Click to choose a full-body photo
                  </span>
                )}
              </label>
              <button type="button" className="vto-camera-open-btn" onClick={openCamera}>
                <FiCamera /> Go live with your camera
              </button>
            </>
          )}
          <canvas ref={canvasRef} hidden />
        </section>

        <section className="vto-panel">
          <h2>2. Choose a Garment</h2>
          {loadingProducts ? (
            <div className="vto-loading"><FiLoader className="spin" /> Loading products…</div>
          ) : (
            <div className="vto-grid">
              {products.map((product) => {
                const active = selectedProduct?._id === product._id;
                return (
                  <button
                    key={product._id}
                    type="button"
                    className={`vto-thumb ${active ? 'active' : ''}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img src={product.image_url} alt={product.name} />
                    {active && <span className="vto-check"><FiCheck /></span>}
                    <span className="vto-label">{product.name}</span>
                  </button>
                );
              })}
              {products.length === 0 && <p className="vto-empty">No products found.</p>}
            </div>
          )}
        </section>

        <aside className="vto-result-panel">
          <h2>3. Result {cameraOpen && autoUpdate && <span className="vto-live-dot">LIVE</span>}</h2>
          <div className="vto-result-frame">
            {resultImage && <img src={resultImage} alt="Try-on result" />}
            {processing && (
              <div className={`vto-loading ${resultImage ? 'vto-loading-overlay' : ''}`}>
                <FiLoader className="spin" /> {resultImage ? 'Updating…' : 'Generating your look… this can take up to a minute.'}
              </div>
            )}
            {!resultImage && !processing && (
              <div className="vto-placeholder">
                {cameraOpen
                  ? 'Pick a garment — your live try-on will appear here.'
                  : 'Upload your photo and pick a garment, then tap Generate.'}
              </div>
            )}
          </div>

          <div className="vto-selected-summary">
            <span>{cameraOpen ? 'Camera live' : personPhoto ? 'Photo uploaded' : 'No photo yet'}</span>
            <span>{selectedProduct ? `Garment: ${selectedProduct.name}` : 'No garment selected'}</span>
          </div>

          {!cameraOpen && (
            <button
              type="button"
              className="vto-run-btn"
              onClick={handleAITryOn}
              disabled={processing || !personPhoto || !selectedProduct}
            >
              {processing ? <><FiLoader className="spin" /> Processing…</> : <><FiCamera /> Generate AI Try-On</>}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
