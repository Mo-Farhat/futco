import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface BookingData {
  id: string;
  courtName: string;
  date: string;
  time: string;
  amountPaid: number;
  status: string;
  paymentId?: string;
}

function generateReceiptHTML(booking: BookingData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; color: #1F1F1F; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 700; color: #E46A41; }
        .subtitle { color: #888; margin-top: 4px; }
        .divider { border-top: 2px solid #F0F0F0; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; }
        .label { color: #888; }
        .value { font-weight: 600; }
        .total-row { font-size: 18px; font-weight: 700; border-top: 2px solid #1F1F1F; padding-top: 12px; margin-top: 12px; }
        .status { display: inline-block; background: #E6F4EA; color: #1E8E3E; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; }
        .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Futco</div>
        <div class="subtitle">Booking Receipt</div>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Booking ID</span>
        <span class="value">${booking.id.slice(0, 12)}</span>
      </div>
      <div class="row">
        <span class="label">Court</span>
        <span class="value">${booking.courtName}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${booking.date}</span>
      </div>
      <div class="row">
        <span class="label">Time</span>
        <span class="value">${booking.time}</span>
      </div>
      <div class="row">
        <span class="label">Status</span>
        <span class="status">${booking.status.toUpperCase()}</span>
      </div>

      <div class="total-row">
        <div class="row">
          <span>Total Paid</span>
          <span>LKR ${booking.amountPaid.toLocaleString()}</span>
        </div>
      </div>

      ${
        booking.paymentId
          ? `
        <div class="row" style="margin-top: 12px;">
          <span class="label">Payment ID</span>
          <span class="value" style="font-size: 12px;">${booking.paymentId}</span>
        </div>
      `
          : ""
      }

      <div class="footer">
        <p>Thank you for booking with Futco!</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;
}

export async function generateAndShareReceipt(booking: BookingData) {
  const html = generateReceiptHTML(booking);

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share Booking Receipt",
      UTI: "com.adobe.pdf",
    });
  }

  return uri;
}
