// backend/src/services/notification.service.ts
import nodemailer from 'nodemailer';

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // konfiguracja transportera mailowego
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOrderConfirmation({ orderId, customerEmail, orderDetails }: any) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: `Potwierdzenie zamówienia #${orderId}`,
      html: `<h1>Dziękujemy za zamówienie!</h1>...`,
    });
  }

  async sendPaymentFailureNotification({
    orderId,
    customerEmail,
    reason,
  }: any) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: `Problem z płatnością - zamówienie #${orderId}`,
      html: `<h1>Wystąpił problem z płatnością</h1>...`,
    });
  }

  async sendOrderCancellationNotification({ orderId, customerEmail }: any) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: `Anulowanie zamówienia #${orderId}`,
      html: `<h1>Zamówienie zostało anulowane</h1>...`,
    });
  }

  async sendLowStockAlert({ productId, productName, currentStock }: any) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `Niski stan magazynowy - ${productName}`,
      html: `<h1>Alert: Niski stan magazynowy</h1>...`,
    });
  }
}
