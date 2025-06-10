import { Payment, PaymentCollection } from '@/types/database'
import { emailConfig } from '../resend-client'

interface PaymentReceiptProps {
  payment: Payment
  collection: PaymentCollection
  receiptUrl?: string
}

export function generatePaymentReceiptEmail({ payment, collection, receiptUrl }: PaymentReceiptProps) {
  const paymentDate = new Date(payment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const collectionUrl = `${emailConfig.appUrl}/pay/${collection.slug}`
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - Empire Football Group</title>
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
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #9f1315;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #9f1315;
      margin-bottom: 10px;
    }
    .success-icon {
      background-color: #22c55e;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 30px;
    }
    .amount {
      font-size: 36px;
      font-weight: bold;
      color: #22c55e;
      text-align: center;
      margin: 20px 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .details-table th,
    .details-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .details-table th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .collection-info {
      background-color: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background-color: #9f1315;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 5px;
    }
    .button-secondary {
      background-color: #6b7280;
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
      transition: width 0.3s ease;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .container { padding: 20px; }
      .amount { font-size: 28px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚽ Empire Football Group</div>
      <p style="margin: 0; color: #6b7280;">Payment Confirmation</p>
    </div>

    <div class="success-icon">✓</div>
    
    <h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
      Payment Successful!
    </h1>
    
    <p style="text-align: center; color: #6b7280; margin-bottom: 20px;">
      Thank you for your contribution to Empire Football Group
    </p>

    <div class="amount">$${payment.amount.toFixed(2)}</div>

    <table class="details-table">
      <tr>
        <th>Payment ID</th>
        <td style="font-family: monospace;">${payment.id.slice(0, 8)}...${payment.id.slice(-8)}</td>
      </tr>
      <tr>
        <th>Date & Time</th>
        <td>${paymentDate}</td>
      </tr>
      <tr>
        <th>Payment Method</th>
        <td>Credit Card</td>
      </tr>
      <tr>
        <th>Status</th>
        <td style="color: #22c55e; font-weight: 600;">✓ Completed</td>
      </tr>
      ${payment.square_payment_id ? `
      <tr>
        <th>Transaction ID</th>
        <td style="font-family: monospace;">${payment.square_payment_id}</td>
      </tr>
      ` : ''}
    </table>

    <div class="collection-info">
      <h3 style="margin-top: 0; color: #1e40af;">Collection Details</h3>
      <p style="margin: 5px 0;"><strong>Collection:</strong> ${collection.title}</p>
      ${collection.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${collection.description}</p>` : ''}
      
      ${collection.target_amount ? `
        <p style="margin: 10px 0 5px 0;"><strong>Progress:</strong></p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min((collection.current_amount / collection.target_amount) * 100, 100)}%"></div>
        </div>
        <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
          $${collection.current_amount.toFixed(2)} raised of $${collection.target_amount.toFixed(2)} goal
          (${Math.round((collection.current_amount / collection.target_amount) * 100)}%)
        </p>
      ` : `
        <p style="margin: 5px 0;"><strong>Total Raised:</strong> $${collection.current_amount.toFixed(2)}</p>
      `}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      ${receiptUrl ? `
        <a href="${receiptUrl}" class="button" style="color: white;">
          View Square Receipt
        </a>
      ` : ''}
      <a href="${collectionUrl}" class="button button-secondary" style="color: white;">
        View Collection
      </a>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>💡 Share the Collection:</strong> Help us reach our goal by sharing this collection with others!
        <br>
        <a href="${collectionUrl}" style="color: #92400e;">${collectionUrl}</a>
      </p>
    </div>

    <div class="footer">
      <p>
        <strong>Empire Football Group</strong><br>
        Austin's Premier Football Community<br>
        <a href="${emailConfig.appUrl}" style="color: #9f1315;">Visit our website</a>
      </p>
      
      <p style="margin-top: 20px;">
        Questions about your payment? Contact us at 
        <a href="mailto:${emailConfig.supportEmail}" style="color: #9f1315;">
          ${emailConfig.supportEmail}
        </a>
      </p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        This is an automated receipt for your payment. Please keep this email for your records.
        <br>
        Payment processed securely by Square.
      </p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Payment Confirmation - Empire Football Group

✓ Payment Successful!

Amount: $${payment.amount.toFixed(2)}
Payment ID: ${payment.id}
Date: ${paymentDate}
Status: Completed

Collection: ${collection.title}
${collection.description ? `Description: ${collection.description}` : ''}

${collection.target_amount ? 
  `Progress: $${collection.current_amount.toFixed(2)} of $${collection.target_amount.toFixed(2)} (${Math.round((collection.current_amount / collection.target_amount) * 100)}%)` :
  `Total Raised: $${collection.current_amount.toFixed(2)}`
}

View Collection: ${collectionUrl}
${receiptUrl ? `Square Receipt: ${receiptUrl}` : ''}

Thank you for supporting Empire Football Group!

Questions? Contact us at ${emailConfig.supportEmail}
Visit: ${emailConfig.appUrl}
  `

  return { html, text }
}