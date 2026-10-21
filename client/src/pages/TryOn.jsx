import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiLoader, FiCheck, FiUpload } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './TryOn.css';

export default function TryOn() {
  const [resultImage, setResultImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Customer's own photo + a real product photo (IDM-VTON)
  const [personPhoto, setPersonPhoto] = useState(null); // base64 data URL
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

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
          <h2>1. Upload Your Photo</h2>
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
