interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    // Pour le développement, on peut utiliser Resend ou un autre service
    // Pour l'instant, on simule l'envoi et on log les détails
    console.log('📧 Email notification sent:', {
      to: data.to,
      subject: data.subject,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Intégrer un vrai service d'email comme Resend, SendGrid, etc.
    // Exemple avec Resend:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'noreply@trustreview.fr',
      to: [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text
    });
    
    if (error) {
      console.error('Email send error:', error);
      return false;
    }
    */
    
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

export function generateFeedbackNotificationEmail(businessName: string, rating: number, message: string, toEmail: string): EmailData {
  const subject = `📝 Nouvel avis reçu pour ${businessName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvel avis TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .rating { font-size: 24px; color: #fbbf24; margin: 20px 0; }
        .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Nouvel avis reçu !</h1>
          <p>Vos clients vous parlent</p>
        </div>
        
        <div class="content">
          <h2>Vous avez reçu un nouvel avis pour <strong>${businessName}</strong></h2>
          
          <div class="rating">
            ${'⭐'.repeat(rating)} ${rating}/5
          </div>
          
          <div class="message">
            <h3>Message du client :</h3>
            <p>"${message}"</p>
          </div>
          
          <p>Cet avis peut vous aider à améliorer votre service et à attirer de nouveaux clients.</p>
          
          <a href="https://trustreview.fr/app/feedbacks" class="cta">
            Voir tous mes avis
          </a>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par TrustReview</p>
          <p>Ne répondez pas à cet email</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Nouvel avis reçu pour ${businessName}
Note : ${rating}/5 ${'⭐'.repeat(rating)}

Message du client :
"${message}"

---
Cet email a été envoyé automatiquement par TrustReview
  `;
  
  return {
    to: toEmail,
    subject,
    html,
    text
  };
}
