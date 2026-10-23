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
  const [personPhoto, setPersonPhoto] = useState(null); // base64 data URL
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Live camera capture
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

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

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

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

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 960, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      toast.error('Could not access camera: ' + err.message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    let sw = vh * 3 / 4, sh = vh;
    if (sw > vw) { sw = vw; sh = vw * 4 / 3; }
    canvas.width = 768;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    setPersonPhoto(canvas.toDataURL('image/jpeg', 0.92));
    setResultImage(null);
    stopCamera();
  };

  const handleAITryOn = async () => {
    if (!personPhoto) {
      toast.error('Upload a photo of yourself first');
      return;
    }
    if (!selectedProduct) {
      toast.error('Select a garment first');
      return;
    }
    setProcessing(true);
    setResultImage(null);
    try {
      const res = await API.post('/tryon/ai-try-on', {
        person_image: personPhoto,
        garment_image_url: selectedProduct.image_url,
        garment_description: selectedProduct.name,
        garment_category: selectedProduct.category,
      });
      if (res.data?.success && res.data?.result_image) {
        setResultImage(`data:image/png;base64,${res.data.result_image}`);
        toast.success('AI try-on complete!');
      } else {
        toast.error(res.data?.message || 'AI try-on failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI try-on request failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="vto-page">
      <Link to="/products" className="vto-back">
        <FiArrowLeft /> Back to Shop
      </Link>

      <header className="vto-header">
        <h1><FiCamera /> Virtual Try-On</h1>
        <p>Upload your own photo and pick a garment to generate a real AI try-on look.</p>
      </header>

      <div className="vto-layout">
        <section className="vto-panel">
          <h2>1. Your Photo</h2>
          {cameraOpen ? (
            <div className="vto-camera-box">
              <video ref={videoRef} playsInline muted className="vto-camera-video" />
              <div className="vto-camera-controls">
                <button type="button" className="vto-camera-btn capture" onClick={capturePhoto}>
                  <FiCamera /> Capture
                </button>
                <button type="button" className="vto-camera-btn cancel" onClick={stopCamera}>
                  <FiX /> Cancel
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
                <FiCamera /> {personPhoto ? 'Retake with Camera' : 'Or use your camera'}
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
          <h2>3. Result</h2>
          <div className="vto-result-frame">
            {processing ? (
              <div className="vto-loading"><FiLoader className="spin" /> Generating your look… this can take up to a minute.</div>
            ) : resultImage ? (
              <img src={resultImage} alt="Try-on result" />
            ) : (
              <div className="vto-placeholder">
                Upload your photo and pick a garment, then tap Generate.
              </div>
            )}
          </div>

          <div className="vto-selected-summary">
            <span>{personPhoto ? 'Photo uploaded' : 'No photo yet'}</span>
            <span>{selectedProduct ? `Garment: ${selectedProduct.name}` : 'No garment selected'}</span>
          </div>

          <button
            type="button"
            className="vto-run-btn"
            onClick={handleAITryOn}
            disabled={processing || !personPhoto || !selectedProduct}
          >
            {processing ? <><FiLoader className="spin" /> Processing…</> : <><FiCamera /> Generate AI Try-On</>}
          </button>
        </aside>
      </div>
    </div>
  );
}
