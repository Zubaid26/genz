import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiLoader, FiCheck } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './TryOn.css';

const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const imgSrc = (previewUrl) => (previewUrl?.startsWith('http') ? previewUrl : `${SERVER_ORIGIN}${previewUrl}`);

const GARMENT_TABS = [
  { type: 5, label: 'Tops' },
  { type: 1, label: 'Bottoms' },
  { type: 3, label: 'Jackets' },
  { type: 2, label: 'Hair' },
];

export default function TryOn() {
  const [apiReady, setApiReady] = useState(null);
  const [persons, setPersons] = useState([]);
  const [garments, setGarments] = useState([]);
  const [garmentType, setGarmentType] = useState(5);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedGarments, setSelectedGarments] = useState({});
  const [resultImage, setResultImage] = useState(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await API.get('/tryon/health');
        if (cancelled) return;
        setApiReady(!!health.data?.model_loaded);
        if (!health.data?.model_loaded) {
          setLoadingLists(false);
          return;
        }
        const personsRes = await API.get('/tryon/persons');
        if (cancelled) return;
        setPersons(personsRes.data || []);
        if (personsRes.data?.length) setSelectedPerson(personsRes.data[0]);
      } catch {
        if (!cancelled) {
          setApiReady(false);
          toast.error('Virtual Try-On API is offline. Start the eCommerce API on port 8000.');
        }
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get(`/tryon/garments?garment_type=${garmentType}`);
        if (!cancelled) setGarments(res.data || []);
      } catch {
        if (!cancelled) toast.error('Failed to load garments');
      }
    })();
    return () => { cancelled = true; };
  }, [apiReady, garmentType]);

  const toggleGarment = (garment) => {
    setSelectedGarments((prev) => {
      const key = String(garment.garment_type);
      const current = prev[key];
      const same =
        current &&
        current.category === garment.category &&
        current.index === garment.index &&
        current.type === garment.garment_type;
      if (same) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          category: garment.category,
          index: garment.index,
          type: garment.garment_type,
          preview_url: garment.preview_url,
          garment_name: garment.garment_name,
        },
      };
    });
  };

  const handleTryOn = async () => {
    if (!selectedPerson) {
      toast.error('Select a person model first');
      return;
    }
    const garmentsList = Object.values(selectedGarments);
    if (garmentsList.length === 0) {
      toast.error('Select at least one garment');
      return;
    }
    setProcessing(true);
    setResultImage(null);
    try {
      const res = await API.post('/tryon/virtual', {
        person_category: selectedPerson.category,
        person_index: selectedPerson.index,
        garments: garmentsList.map(({ category, index, type }) => ({ category, index, type })),
        dressing_order: [2, 5, 1, 3],
      });
      if (res.data?.success && res.data?.result_image) {
        setResultImage(`data:image/png;base64,${res.data.result_image}`);
        toast.success('Try-on complete!');
      } else {
        toast.error(res.data?.message || 'Try-on failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Try-on request failed');
    } finally {
      setProcessing(false);
    }
  };

  const selectedCount = Object.keys(selectedGarments).length;

  return (
    <div className="vto-page">
      <Link to="/products" className="vto-back">
        <FiArrowLeft /> Back to Shop
      </Link>

      <header className="vto-header">
        <h1><FiCamera /> Virtual Try-On</h1>
        <p>Pick a model and garments, then generate an AI try-on look.</p>
      </header>

      {apiReady === false && (
        <div className="vto-offline">
          <strong>Try-On API offline</strong>
          <p>Start the eCommerce Virtual Try-On API (port 8000), then refresh this page.</p>
          <code>cd server/eCommerce API && start_server.bat</code>
        </div>
      )}

      {loadingLists ? (
        <div className="vto-loading"><FiLoader className="spin" /> Loading studio…</div>
      ) : apiReady && (
        <div className="vto-layout">
          <section className="vto-panel">
            <h2>1. Choose Model</h2>
            <div className="vto-grid">
              {persons.slice(0, 24).map((person) => {
                const active =
                  selectedPerson?.category === person.category &&
                  selectedPerson?.index === person.index;
                return (
                  <button
                    key={`${person.category}-${person.index}`}
                    type="button"
                    className={`vto-thumb ${active ? 'active' : ''}`}
                    onClick={() => setSelectedPerson(person)}
                  >
                    <img src={imgSrc(person.preview_url)} alt={`${person.category} ${person.index}`} />
                    {active && <span className="vto-check"><FiCheck /></span>}
                    <span className="vto-label">{person.category} #{person.index}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="vto-panel">
            <h2>2. Choose Garments</h2>
            <div className="vto-tabs">
              {GARMENT_TABS.map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  className={`vto-tab ${garmentType === tab.type ? 'active' : ''}`}
                  onClick={() => setGarmentType(tab.type)}
                >
                  {tab.label}
                  {selectedGarments[String(tab.type)] && <span className="vto-dot" />}
                </button>
              ))}
            </div>
            <div className="vto-grid">
              {garments.slice(0, 24).map((garment) => {
                const sel = selectedGarments[String(garment.garment_type)];
                const active =
                  sel &&
                  sel.category === garment.category &&
                  sel.index === garment.index;
                return (
                  <button
                    key={`${garment.category}-${garment.index}-${garment.garment_type}`}
                    type="button"
                    className={`vto-thumb ${active ? 'active' : ''}`}
                    onClick={() => toggleGarment(garment)}
                  >
                    <img src={imgSrc(garment.preview_url)} alt={garment.garment_name} />
                    {active && <span className="vto-check"><FiCheck /></span>}
                    <span className="vto-label">{garment.category} #{garment.index}</span>
                  </button>
                );
              })}
              {garments.length === 0 && (
                <p className="vto-empty">No garments for this type.</p>
              )}
            </div>
          </section>

          <aside className="vto-result-panel">
            <h2>3. Result</h2>
            <div className="vto-result-frame">
              {processing ? (
                <div className="vto-loading"><FiLoader className="spin" /> Generating look…</div>
              ) : resultImage ? (
                <img src={resultImage} alt="Try-on result" />
              ) : (
                <div className="vto-placeholder">
                  Select a model and garments, then tap Try On.
                </div>
              )}
            </div>

            <div className="vto-selected-summary">
              <span>{selectedPerson ? `Model: ${selectedPerson.category} #${selectedPerson.index}` : 'No model'}</span>
              <span>{selectedCount} garment{selectedCount === 1 ? '' : 's'} selected</span>
            </div>

            <button
              type="button"
              className="vto-run-btn"
              onClick={handleTryOn}
              disabled={processing || !selectedPerson || selectedCount === 0}
            >
              {processing ? <><FiLoader className="spin" /> Processing…</> : <><FiCamera /> Try On</>}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
