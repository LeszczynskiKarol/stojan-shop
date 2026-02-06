// backend/src/services/email.service.ts
import { transporter } from '../config/mailer.config';
import { env } from '../config/env.config';
import path from 'path';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import fs from 'fs/promises';
import Handlebars from 'handlebars';
import { UserService } from './user.service';
import { Order } from '../entities/Order';
import { helpers } from '../utils/handlebars.helpers';
import axios from 'axios';
import { calculateDeliveryDates } from '../utils/deliveryDate';

Object.entries(helpers).forEach(([name, fn]) => {
  Handlebars.registerHelper(name, fn);
});

export class EmailService {
  private templatesDir = path.join(__dirname, '..', 'templates', 'emails');

  private async getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
    try {
      const filePath = path.join(this.templatesDir, `${name}.hbs`);

      // Sprawdźmy czy plik istnieje przed próbą odczytu
      await fs.access(filePath);

      const template = await fs.readFile(filePath, 'utf-8');
      return Handlebars.compile(template);
    } catch (error) {
      console.error(`❌ Błąd podczas ładowania szablonu ${name}:`, error);
      throw new Error(`Nie można załadować szablonu ${name}`);
    }
  }

  async sendOrderConfirmation(order: Order) {
    console.log('📬 Przygotowuję wysyłkę emaila:', {
      orderNumber: order.orderNumber,
      recipientEmail: order.shipping.email,
    });

    console.log('🔍 [CHECKPOINT 5] email.service - Order shipping data:', {
      differentShippingAddress: order.shipping.differentShippingAddress,
      mainAddress: {
        street: order.shipping.street,
        postalCode: order.shipping.postalCode,
        city: order.shipping.city,
      },
      shippingAddress: {
        street: order.shipping.shippingStreet,
        postalCode: order.shipping.shippingPostalCode,
        city: order.shipping.shippingCity,
      },
    });

    const totalWeight = Number(order.totalWeight);

    const dates = calculateDeliveryDates(totalWeight);
    const shippingDateStr = format(dates.shippingDate, 'd MMMM', {
      locale: pl,
    });

    let deliveryInfo = '';
    if (totalWeight <= 36.5) {
      const deliveryDateStartStr = format(dates.deliveryDateStart, 'd MMMM', {
        locale: pl,
      });
      deliveryInfo = deliveryDateStartStr;
    } else {
      const deliveryDateStartStr = format(dates.deliveryDateStart, 'd MMMM', {
        locale: pl,
      });
      const deliveryDateEndStr = format(dates.deliveryDateEnd!, 'd MMMM', {
        locale: pl,
      });

      if (deliveryDateStartStr === deliveryDateEndStr) {
        deliveryInfo = deliveryDateStartStr;
      } else {
        deliveryInfo = `${deliveryDateStartStr} - ${deliveryDateEndStr}`;
      }
    }

    const template = await this.getTemplate('order-confirmation');
    const html = template({
      order,
      shopName: 'Stojan Silniki Elektryczne',
      orderUrl: `${env.FRONTEND_URL}/admin/orders`,
      shippingDateFormatted: shippingDateStr,
      deliveryInfo: deliveryInfo,
      isCod: order.paymentMethod === 'cod',
      codAmount: order.total,
    });

    const result = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: order.shipping.email,
      subject: `Stojan Silniki Elektryczne - Potwierdzenie zamówienia #${order.orderNumber}`,
      html,
    });

    const staffTemplate = await this.getTemplate('order-confirmation-staff');
    const staffHtml = staffTemplate({
      order,
      shopName: 'Stojan Shop',
      orderUrl: `${env.FRONTEND_URL}/admin/orders`,
    });

    await this.sendToStaff(`Nowe zamówienie #${order.orderNumber}`, staffHtml);
  }

  private async sendToStaff(subject: string, html: string) {
    const userService = new UserService();
    const recipients = await userService.getEmailRecipients();

    for (const user of recipients) {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: user.email,
        subject: `[${user.role.toUpperCase()}] ${subject}`,
        html,
      });
    }
  }

  async sendOrderCancellation(order: Order) {
    const template = await this.getTemplate('order-cancellation');
    const html = template({
      order,
      shopName: 'Stojan Silniki Elektryczne',
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: order.shipping.email,
      subject: `Stojan Silniki Elektryczne - Anulowanie zamówienia #${order.id}`,
      html,
    });
  }

  async sendOrderStatusUpdate(order: Order) {
    const totalWeight = Number(order.totalWeight); // tu też
    const dates = calculateDeliveryDates(totalWeight);
    const shippingDateStr = format(dates.shippingDate, 'd MMMM', {
      locale: pl,
    });

    let deliveryInfo = '';
    if (totalWeight <= 36.5) {
      const deliveryDateStartStr = format(dates.deliveryDateStart, 'd MMMM', {
        locale: pl,
      });
      deliveryInfo = deliveryDateStartStr;
    } else {
      const deliveryDateStartStr = format(dates.deliveryDateStart, 'd MMMM', {
        locale: pl,
      });
      const deliveryDateEndStr = format(dates.deliveryDateEnd!, 'd MMMM', {
        locale: pl,
      });

      if (deliveryDateStartStr === deliveryDateEndStr) {
        deliveryInfo = deliveryDateStartStr;
      } else {
        deliveryInfo = `${deliveryDateStartStr} - ${deliveryDateEndStr}`;
      }
    }

    const template = await this.getTemplate('order-status-update');
    const html = template({
      order,
      shopName: 'Stojan Silniki Elektryczne',
      orderUrl: `${env.FRONTEND_URL}/admin/orders`,
      // przekazujemy cały obiekt:
      dates: dates,
      shippingDateFormatted: shippingDateStr,
      deliveryInfo: deliveryInfo,
    });

    const mailOptions: any = {
      from: env.SMTP_FROM,
      to: order.shipping.email,
      subject: `Stojan Silniki Elektryczne - Twoje zamówienie już do Ciebie jedzie!`,
      html,
    };

    // Jeśli zamówienie jest wysyłane i ma fakturę, dodaj ją jako załącznik
    if (order.status === 'shipped' && order.invoiceUrls?.length > 0) {
      try {
        mailOptions.attachments = await Promise.all(
          order.invoiceUrls.map(async (url) => {
            const response = await axios.get(url, {
              responseType: 'arraybuffer',
            });

            // Wyciągamy oryginalną nazwę pliku z URL
            const originalFileName = url.split('/').pop() || 'invoice.pdf';

            return {
              filename: originalFileName, // używamy oryginalnej nazwy
              content: response.data,
              contentType: 'application/pdf',
            };
          })
        );
      } catch (error) {
        console.error('Błąd podczas pobierania faktur:', error);
      }
    }

    await transporter.sendMail(mailOptions);
  }

  private async sendToAdmins(subject: string, html: string) {
    const userService = new UserService();
    const recipients = await userService.getEmailRecipients();

    for (const user of recipients) {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: user.email,
        subject: `[${user.role.toUpperCase()}] ${subject}`,
        html,
      });
    }
  }
  async sendSyncError(details: {
    offerId: string;
    stage: string;
    error: string;
    productDetails?: any;
  }) {
    const template = await this.getTemplate('sync-error');
    const html = template({
      ...details,
      timestamp: new Date().toLocaleString('pl-PL'),
    });

    await this.sendToStaff(
      `⚠️ Błąd synchronizacji produktu Allegro ${details.offerId}`,
      html
    );
  }
}
