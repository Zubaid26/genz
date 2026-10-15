import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiCheckCircle, FiDownload, FiPackage, FiShoppingBag,
  FiTruck, FiMapPin, FiCalendar, FiArrowRight
} from 'react-icons/fi';
import API from '../utils/axiosInstance';
import './OrderConfirmation.css';
import { money } from '../utils/currency';

const METHOD_LABELS = {
  cod: 'Cash on Delivery (COD)',
  card: 'Debit/Credit Card',
  jazzcash: 'JazzCash Mobile',
  easypaisa: 'Easypaisa Mobile'
};

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => {});
  }, [id]);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await API.get(`/orders/${id}/invoice`);
      if (res.data.invoice_url) {
        const link = document.createElement('a');
        link.href = res.data.invoice_url;
        link.download = `invoice-${id}.pdf`;
        link.click();
      }
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  if (!order) {
    return (
      <div className="confirm-page container">
        <div className="confirm-loading-box">
          <p>Retrieving your order details…</p>
        </div>
      </div>
    );
  }

  const orderNum = order._id?.slice(-8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="confirm-page container">
      <div className="confirm-editorial-card">
        {/* Header Icon & Message */}
        <div className="confirm-hero-header">
          <div className="confirm-success-circle">
            <FiCheckCircle />
          </div>
          <span className="confirm-eyebrow">Order Placed Successfully</span>
          <h1 className="confirm-headline">Thank you for your order!</h1>
          <p className="confirm-subtitle">
            A confirmation receipt has been issued. Your order is now being prepped at our fulfillment facility.
          </p>
        </div>

        {/* Order Identifier Banner */}
        <div className="confirm-id-banner">
          <div>
            <span className="banner-label">Reference ID</span>
            <strong className="banner-val">#{orderNum}</strong>
          </div>
          <div className="banner-right">
            <span className="banner-label">Placed On</span>
            <span className="banner-date">{orderDate}</span>
          </div>
        </div>

        {/* Details Breakdown */}
        <div className="confirm-details-sheet">
          <div className="confirm-detail-row">
            <span className="detail-prop">Fulfillment Status</span>
            <span className="status-badge-pill">{order.status}</span>
          </div>

          <div className="confirm-detail-row">
            <span className="detail-prop">Payment Method</span>
            <span className="detail-val-group">
              <strong>{METHOD_LABELS[order.payment_method] || order.payment_method}</strong>
              {order.payment_status && (
                <span className={`payment-pill ${order.payment_status}`}>
                  {order.payment_status}
                </span>
              )}
            </span>
          </div>

          <div className="confirm-detail-row">
            <span className="detail-prop">Total Charged</span>
            <span className="confirm-total-val">{money(order.total_price)}</span>
          </div>

          {order.shipping_address?.address && (
            <div className="confirm-detail-row shipping-detail-row">
              <span className="detail-prop"><FiMapPin /> Delivery To</span>
              <div className="detail-address-block">
                <strong>{order.shipping_address.full_name}</strong>
                <span>{order.shipping_address.address}</span>
                <span>{order.shipping_address.city}{order.shipping_address.zip ? `, ${order.shipping_address.zip}` : ''}</span>
                <span>{order.shipping_address.country}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="confirm-actions-block">
          <button
            type="button"
            onClick={downloadInvoice}
            className="btn-primary confirm-invoice-btn"
            disabled={downloading}
          >
            <FiDownload />
            <span>{downloading ? 'Preparing Invoice…' : 'Download Official PDF Invoice'}</span>
          </button>

          <div className="confirm-secondary-buttons">
            <Link to="/orders" className="btn-secondary confirm-sub-btn">
              <FiPackage />
              <span>View Order History</span>
            </Link>
            <Link to="/products" className="btn-secondary confirm-sub-btn">
              <FiShoppingBag />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
