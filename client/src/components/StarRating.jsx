import { useState } from 'react';
import './StarRating.css';

const SIZES = { sm: 'sr-sm', md: 'sr-md', lg: 'sr-lg' };

/**
 * Star rating, read-only by default.
 *
 * Read-only mode renders partial fills (4.3 stars shows 30% of the fifth star)
 * by clipping a filled layer over an empty one. Interactive mode renders real
 * radio buttons so it is keyboard and screen-reader accessible.
 */
export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  label,
  name = 'rating'
}) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const sizeClass = SIZES[size] || SIZES.md;

  if (!interactive) {
    const pct = Math.max(0, Math.min(100, (Number(value) || 0) * 20));
    return (
      <span
        className={`star-rating ${sizeClass}`}
        role="img"
        aria-label={label || `Rated ${value} out of 5`}
      >
        <span className="sr-track" aria-hidden="true">★★★★★</span>
        <span className="sr-fill" style={{ width: `${pct}%` }} aria-hidden="true">★★★★★</span>
      </span>
    );
  }

  const shown = hover || value;

  return (
    <span
      className={`star-rating sr-input ${sizeClass}`}
      role="radiogroup"
      aria-label={label || 'Your rating'}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className={`sr-star${star <= shown ? ' on' : ''}`}
          onMouseEnter={() => setHover(star)}
        >
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
          />
          <span aria-hidden="true">★</span>
          <span className="sr-sr-only">{star} star{star > 1 ? 's' : ''}</span>
        </label>
      ))}
    </span>
  );
}
