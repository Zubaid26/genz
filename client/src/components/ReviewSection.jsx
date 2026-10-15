import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiEdit2, FiTrash2, FiStar, FiLoader, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import useAuth from '../hooks/useAuth';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import './ReviewSection.css';

const EMPTY_SUMMARY = { count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
const MAX_COMMENT = 1000;

const SORTS = [
  { id: 'recent', label: 'Most recent' },
  { id: 'highest', label: 'Highest rated' },
  { id: 'lowest', label: 'Lowest rated' }
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

// "Asia Parveen" -> "A***a P." so reviewers aren't fully identified, as on Daraz.
const maskName = (name) => {
  const parts = String(name || 'Customer').trim().split(/\s+/);
  const first = parts[0] || 'Customer';
  const masked = first.length <= 2
    ? first
    : `${first[0]}${'*'.repeat(Math.min(4, first.length - 2))}${first[first.length - 1]}`;
  return parts.length > 1 ? `${masked} ${parts[parts.length - 1][0]}.` : masked;
};

export default function ReviewSection({ productId, onSummaryChange }) {
  const { user } = useAuth();

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState(0);        // 0 = all stars
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);

  const [eligibility, setEligibility] = useState({ canReview: false, review: null });
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ rating: 0, comment: '' });
  const [saving, setSaving] = useState(false);

  // Held in a ref so an inline parent callback (a new function identity on every
  // render) cannot re-trigger loadReviews and spin up an endless fetch loop.
  const onSummaryRef = useRef(onSummaryChange);
  useEffect(() => { onSummaryRef.current = onSummaryChange; }, [onSummaryChange]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '5', sort });
      if (filter) params.set('rating', String(filter));
      const res = await API.get(`/products/${productId}/reviews?${params}`);
      setReviews(res.data.reviews || []);
      setPages(res.data.pages || 1);
      setSummary(res.data.summary || EMPTY_SUMMARY);
      onSummaryRef.current?.(res.data.summary);
    } catch {
      toast.error('Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, page, filter, sort]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Whether this shopper bought the product, and their existing review if any.
  useEffect(() => {
    if (!user) { setEligibility({ canReview: false, review: null }); return; }
    API.get(`/products/${productId}/reviews/eligibility`)
      .then((res) => {
        setEligibility(res.data);
        if (res.data.review) {
          setDraft({ rating: res.data.review.rating, comment: res.data.review.comment || '' });
        }
      })
      .catch(() => setEligibility({ canReview: false, review: null }));
  }, [productId, user]);

  const resetPaging = () => setPage(1);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.rating) { toast.error('Please select a star rating.'); return; }
    setSaving(true);
    try {
      const res = await API.post(`/products/${productId}/reviews`, draft);
      toast.success(res.data.message || 'Review saved.');
      setEligibility((s) => ({ ...s, review: res.data.review }));
      setFormOpen(false);
      setFilter(0);
      setSort('recent');
      setPage(1);
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save your review.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await API.delete(`/products/${productId}/reviews`);
      toast.success('Review deleted.');
      setEligibility((s) => ({ ...s, review: null }));
      setDraft({ rating: 0, comment: '' });
      setFormOpen(false);
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete your review.');
    } finally {
      setSaving(false);
    }
  };

  const renderWritePanel = () => {
    if (!user) {
      return (
        <p className="rv-gate">
          <Link to="/login">Sign in</Link> to review this product.
        </p>
      );
    }
    if (!eligibility.canReview) {
      return (
        <p className="rv-gate">
          <FiCheck /> Only verified buyers can review. Purchase this item to share your experience.
        </p>
      );
    }
    if (!formOpen) {
      return (
        <div className="rv-cta">
          {eligibility.review ? (
            <>
              <span className="rv-your">Your rating: <StarRating value={eligibility.review.rating} size="sm" /></span>
              <button type="button" className="rv-btn ghost" onClick={() => setFormOpen(true)}>
                <FiEdit2 /> Edit review
              </button>
              <button type="button" className="rv-btn danger" onClick={remove} disabled={saving}>
                <FiTrash2 /> Delete
              </button>
            </>
          ) : (
            <button type="button" className="rv-btn primary" onClick={() => setFormOpen(true)}>
              <FiStar /> Write a review
            </button>
          )}
        </div>
      );
    }

    return (
      <form className="rv-form" onSubmit={submit}>
        <label className="rv-form-label">Your rating</label>
        <StarRating
          value={draft.rating}
          onChange={(rating) => setDraft((d) => ({ ...d, rating }))}
          size="lg"
        />
        <label className="rv-form-label" htmlFor="rv-comment">Your review <span>(optional)</span></label>
        <textarea
          id="rv-comment"
          rows={4}
          maxLength={MAX_COMMENT}
          placeholder="How was the fit, fabric and quality?"
          value={draft.comment}
          onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value }))}
        />
        <div className="rv-count">{draft.comment.length}/{MAX_COMMENT}</div>
        <div className="rv-form-actions">
          <button type="submit" className="rv-btn primary" disabled={saving}>
            {saving ? 'Saving…' : eligibility.review ? 'Update review' : 'Post review'}
          </button>
          <button type="button" className="rv-btn ghost" onClick={() => setFormOpen(false)} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <section className="rv-section" id="reviews">
      <h2 className="rv-title">Ratings &amp; Reviews</h2>

      <div className="rv-summary">
        <div className="rv-score">
          <span className="rv-avg">{summary.average ? summary.average.toFixed(1) : '0.0'}</span>
          <StarRating value={summary.average} size="md" label={`Average ${summary.average} of 5`} />
          <span className="rv-count-label">
            {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className="rv-bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = summary.distribution?.[star] || 0;
            const pct = summary.count ? (n / summary.count) * 100 : 0;
            const active = filter === star;
            return (
              <button
                key={star}
                type="button"
                className={`rv-bar-row${active ? ' active' : ''}`}
                onClick={() => { setFilter(active ? 0 : star); resetPaging(); }}
                disabled={!n}
                aria-pressed={active}
                title={n ? `Show only ${star}-star reviews` : `No ${star}-star reviews`}
              >
                <span className="rv-bar-star">{star} ★</span>
                <span className="rv-bar-track"><span className="rv-bar-fill" style={{ width: `${pct}%` }} /></span>
                <span className="rv-bar-n">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {renderWritePanel()}

      <div className="rv-toolbar">
        <div className="rv-chips">
          <button
            type="button"
            className={`rv-chip${filter === 0 ? ' active' : ''}`}
            onClick={() => { setFilter(0); resetPaging(); }}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              className={`rv-chip${filter === s ? ' active' : ''}`}
              disabled={!summary.distribution?.[s]}
              onClick={() => { setFilter(s); resetPaging(); }}
            >
              {s} ★
            </button>
          ))}
        </div>
        <select
          className="rv-sort"
          value={sort}
          onChange={(e) => { setSort(e.target.value); resetPaging(); }}
          aria-label="Sort reviews"
        >
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="rv-empty"><FiLoader className="rv-spin" /> Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="rv-empty">
          {filter ? `No ${filter}-star reviews yet.` : 'No reviews yet — be the first to share your thoughts.'}
        </p>
      ) : (
        <ul className="rv-list">
          {reviews.map((r) => (
            <li key={r._id} className="rv-item">
              <div className="rv-item-head">
                <span className="rv-avatar" aria-hidden="true">{(r.user_name || 'C')[0].toUpperCase()}</span>
                <div>
                  <p className="rv-name">
                    {maskName(r.user_name)}
                    {user && r.user_id === user._id && <span className="rv-you">You</span>}
                  </p>
                  <span className="rv-verified"><FiCheck /> Verified purchase</span>
                </div>
                <time className="rv-date" dateTime={r.created_at}>{formatDate(r.created_at)}</time>
              </div>
              <StarRating value={r.rating} size="sm" />
              {r.comment && <p className="rv-comment">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="rv-pager">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <FiChevronLeft /> Prev
          </button>
          <span>Page {page} of {pages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}
