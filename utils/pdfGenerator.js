const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateBillPDF = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const filename = `invoice_${order._id}.pdf`;
      const filepath = path.join(invoiceDir, filename);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(25).font('Helvetica-Bold').text('🍽️ FoodHub', 50, 50);
      doc.fontSize(10).font('Helvetica').text('Restaurant Billing System', 50, 85);
      doc.text('Email: info@foodhub.com | Phone: +91 9999-9999-99', 50, 105);

      // Horizontal line
      doc.moveTo(50, 130).lineTo(550, 130).stroke();

      // Invoice details
      doc.fontSize(12).font('Helvetica-Bold').text('INVOICE', 50, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Order ID: #${order._id.toString().slice(-6).toUpperCase()}`, 50, 170);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 190);
      doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`, 50, 210);

      // Customer info
      doc.fontSize(12).font('Helvetica-Bold').text('BILL TO', 300, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text(user.name, 300, 170);
      doc.text(user.email, 300, 190);
      doc.text(`Status: ${order.status.toUpperCase()}`, 300, 210);

      // Table header
      doc.fontSize(10).font('Helvetica-Bold').text('Item', 50, 260);
      doc.text('Qty', 250, 260);
      doc.text('Price', 320, 260);
      doc.text('Amount', 400, 260);

      // Horizontal line
      doc.moveTo(50, 280).lineTo(550, 280).stroke();

      // Items
      let yPosition = 300;
      const gst = order.totalAmount * 0.18;

      order.items.forEach((item, index) => {
        const itemAmount = item.quantity * item.price;
        doc.fontSize(10).font('Helvetica').text(item.name, 50, yPosition);
        doc.text(item.quantity.toString(), 250, yPosition);
        doc.text(`₹${item.price.toFixed(2)}`, 320, yPosition);
        doc.text(`₹${itemAmount.toFixed(2)}`, 400, yPosition);
        yPosition += 25;
      });

      // Horizontal line
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 20;

      // Summary
      doc.fontSize(10).font('Helvetica');
      doc.text(`Subtotal: ₹${order.totalAmount.toFixed(2)}`, 300, yPosition);
      yPosition += 20;
      doc.text(`GST (18%): ₹${gst.toFixed(2)}`, 300, yPosition);
      yPosition += 20;

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`TOTAL: ₹${(order.totalAmount + gst).toFixed(2)}`, 300, yPosition);

      // Footer
      yPosition += 60;
      doc.fontSize(9).font('Helvetica').text('Thank you for your order! Please visit again.', 50, yPosition, { align: 'center' });
      doc.text(`Delivery Option: ${order.deliveryOption.toUpperCase()}`, 50, yPosition + 20, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filepath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateBillPDF };