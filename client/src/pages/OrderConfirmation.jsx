import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiPackage } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    API.get(`/orders/${id}`).then(res => setOrder(res.data)).catch(() => {});
  }, [id]);

  const downloadInvoice = async () => {
    try {
      const res = await API.get(`/orders/${id}/invoice`);
      if (res.data.invoice_url) {
        const link = document.createElement('a');
        link.href = res.data.invoice_url;
        link.download = `invoice-${id}.pdf`;
        link.click();
      }
    } catch { /* ignore */ }
  };

  if (!order) return <div className="confirm-page"><p style={{color:'#fff'}}>Loading...</p></div>;

  return (
    <div className="confirm-page">
      <div className="confirm-card">
        <FiCheckCircle className="confirm-icon" />
        <h1>Order Confirmed!</h1>
        <p className="order-id">Order #{order._id?.slice(-8).toUpperCase()}</p>
        <div className="confirm-details">
          <div className="detail-row">
            <span>Status</span>
            <span className="status-badge">{order.status}</span>
          </div>
          <div className="detail-row">
            <span>Total</span>
            <span className="total">${order.total_price?.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Date</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="confirm-actions">
          <button onClick={downloadInvoice} className="invoice-btn">
            <FiDownload /> Download Invoice
          </button>
          <Link to="/orders" className="orders-link"><FiPackage /> View Orders</Link>
          <Link to="/products" className="continue-link">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
