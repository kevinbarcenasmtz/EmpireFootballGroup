import { Payment, PaymentCollection } from '@/types/database';
import { emailConfig } from '../resend-client';

interface AdminNotificationProps {
  payment: Payment;
  collection: PaymentCollection;
  adminEmail: string;
}

export function generateAdminNotificationEmail({
  payment,
  collection,
  adminEmail,
}: AdminNotificationProps) {
  const paymentDate = new Date(payment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const collectionUrl = `${emailConfig.appUrl}/pay/${collection.slug}`;
  const adminDashboardUrl = `${emailConfig.appUrl}/admin/collections`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Payment Received - Empire Football Group</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #22c55e;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
      color: #9f1315;
      margin-bottom: 5px;
    }
    .notification-badge {
      background-color: #22c55e;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 20px;
    }
    .amount-highlight {
      background-color: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #22c55e;
      margin: 0;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }
    .detail-card {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 15px;
      border-left: 4px solid #9f1315;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .collection-summary {
      background-color: #eff6ff;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background-color: #9f1315;
    }
    .button {
      display: inline-block;
      background-color: #9f1315;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 10px 10px 0;
    }
    .button-secondary {
      background-color: #6b7280;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    @media (max-width: 600px) {
      .details-grid { grid-template-columns: 1fr; }
      .amount { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚽ Empire Football Group Admin</div>
      <div class="notification-badge">🎉 New Payment Received</div>
    </div>

    <h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
      Payment Alert
    </h1>
    
    <p style="text-align: center; color: #6b7280;">
      A new payment has been received for <strong>${collection.title}</strong>
    </p>

    <div class="amount-highlight">
      <div class="amount">$${payment.amount.toFixed(2)}</div>
      <p style="margin: 5px 0 0 0; color: #6b7280;">
        Received ${paymentDate}
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-card">
        <div class="detail-label">Payer Name</div>
        <div class="detail-value">${payment.payer_name || 'Anonymous'}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Email</div>
        <div class="detail-value">${payment.payer_email || 'Not provided'}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Payment ID</div>
        <div class="detail-value" style="font-family: monospace; font-size: 12px;">
          ${payment.id.slice(0, 8)}...${payment.id.slice(-8)}
        </div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Status</div>
        <div class="detail-value" style="color: #22c55e;">✓ ${payment.status}</div>
      </div>
    </div>

    <div class="collection-summary">
      <h3 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">
        📊 Collection Summary
      </h3>
      <p style="margin: 5px 0;"><strong>Collection:</strong> ${collection.title}</p>
      
      ${
        collection.target_amount
          ? `
        <div style="margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Progress</span>
            <span>${Math.round((collection.current_amount / collection.target_amount) * 100)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min((collection.current_amount / collection.target_amount) * 100, 100)}%"></div>
          </div>
          <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
            $${collection.current_amount.toFixed(2)} of $${collection.target_amount.toFixed(2)} goal
          </p>
        </div>
      `
          : `
        <p style="margin: 5px 0;"><strong>Total Raised:</strong> $${collection.current_amount.toFixed(2)}</p>
      `
      }
      
      <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
        Status: ${collection.is_active ? '🟢 Active' : '🔴 Inactive'}
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${adminDashboardUrl}" class="button" style="color: white;">
        View Admin Dashboard
      </a>
      <a href="${collectionUrl}" class="button button-secondary" style="color: white;">
        View Collection Page
      </a>
    </div>

    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>💡 Quick Actions:</strong>
        <br>• Monitor real-time updates in your admin dashboard
        <br>• Share the collection link to reach more supporters
        <br>• Check payment details in Square dashboard
      </p>
    </div>

    <div class="footer">
      <p>
        <strong>Empire Football Group Admin System</strong><br>
        This notification was sent to: ${adminEmail}
      </p>
      
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        This is an automated notification. To manage email preferences, 
        visit your admin dashboard.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
🎉 NEW PAYMENT RECEIVED - Empire Football Group

Amount: $${payment.amount.toFixed(2)}
Collection: ${collection.title}
Date: ${paymentDate}

PAYER DETAILS:
Name: ${payment.payer_name || 'Anonymous'}
Email: ${payment.payer_email || 'Not provided'}
Payment ID: ${payment.id}
Status: ${payment.status}

COLLECTION SUMMARY:
${
  collection.target_amount
    ? `Progress: $${collection.current_amount.toFixed(2)} of $${collection.target_amount.toFixed(2)} (${Math.round((collection.current_amount / collection.target_amount) * 100)}%)`
    : `Total Raised: $${collection.current_amount.toFixed(2)}`
}
Status: ${collection.is_active ? 'Active' : 'Inactive'}

QUICK LINKS:
Admin Dashboard: ${adminDashboardUrl}
Collection Page: ${collectionUrl}

---
Empire Football Group Admin System
Notification sent to: ${adminEmail}
  `;

  return { html, text };
}
