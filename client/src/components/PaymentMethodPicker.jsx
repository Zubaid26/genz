import { FiSmartphone, FiTruck, FiCheck } from 'react-icons/fi';
import './PaymentMethodPicker.css';

const ICONS = {
  jazzcash: FiSmartphone,
  easypaisa: FiSmartphone,
  cod: FiTruck
};

export default function PaymentMethodPicker({ methods, selected, onSelect, disabled }) {
  if (!methods.length) {
    return <p className="pm-empty">No payment methods are currently available.</p>;
  }

  return (
    <div className="pm-list" role="radiogroup" aria-label="Payment method">
      {methods.map((method) => {
        const Icon = ICONS[method.id] || FiSmartphone;
        const isSelected = selected === method.id;

        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(method.id)}
            className={`pm-option${isSelected ? ' selected' : ''}`}
          >
            <span className="pm-icon"><Icon /></span>
            <span className="pm-text">
              <span className="pm-label">
                {method.label}
                {method.sandbox && <span className="pm-badge">Sandbox</span>}
              </span>
              <span className="pm-desc">{method.description}</span>
            </span>
            <span className="pm-check">{isSelected && <FiCheck />}</span>
          </button>
        );
      })}
    </div>
  );
}
