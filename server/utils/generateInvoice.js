const PDFDocument = require('pdfkit');

// Matches the storefront's formatting: Rs 3,490 (paisa only when non-zero).
const money = (amount) => {
  const n = Number(amount) || 0;
  const hasPaisa = Math.round(n * 100) % 100 !== 0;
  return `Rs ${n.toLocaleString('en-PK', {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

// Generate a PDF invoice for an order
const generateInvoice = (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        const base64 = pdfBuffer.toString('base64');
        resolve(`data:application/pdf;base64,${base64}`);
      });

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Gen-Z Threads', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Fashion E-Commerce', { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#333');
      doc.moveDown();

      // Invoice Info
      doc.fontSize(16).font('Helvetica-Bold').text('INVOICE');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Order ID: ${order._id}`);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
      doc.text(`Customer: ${user.full_name}`);
      doc.text(`Email: ${user.email}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown();

      // Items Table Header
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Item', 50, doc.y, { width: 200 });
      doc.text('Qty', 260, doc.y - 14, { width: 60, align: 'center' });
      doc.text('Price', 330, doc.y - 14, { width: 80, align: 'right' });
      doc.text('Total', 420, doc.y - 14, { width: 80, align: 'right' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
      doc.moveDown(0.5);

      // Items
      doc.fontSize(10).font('Helvetica');
      order.items.forEach((item) => {
        const name = item.product_id?.name || 'Product';
        const startY = doc.y;
        doc.text(name, 50, startY, { width: 200 });
        doc.text(String(item.quantity), 260, startY, { width: 60, align: 'center' });
        doc.text(money(item.price), 330, startY, { width: 80, align: 'right' });
        doc.text(money(item.price * item.quantity), 420, startY, { width: 80, align: 'right' });
        doc.moveDown(0.5);
      });

      // Totals
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#333');
      doc.moveDown(0.5);

      // Fall back to the line-item sum for older orders saved without a subtotal.
      const subtotal = typeof order.subtotal === 'number' && order.subtotal > 0
        ? order.subtotal
        : order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discount = order.discount || 0;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Subtotal: ${money(subtotal)}`, { align: 'right' });
      if (discount > 0) {
        const label = order.coupon_code ? `Discount (${order.coupon_code})` : 'Discount';
        doc.text(`${label}: -${money(discount)}`, { align: 'right' });
      }
      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`Total: ${money(order.total_price)}`, { align: 'right' });

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).font('Helvetica').fillColor('#888');
      doc.text('Thank you for shopping with Gen-Z Threads!', { align: 'center' });
      doc.text('For support, contact support@genzthreads.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoice;
