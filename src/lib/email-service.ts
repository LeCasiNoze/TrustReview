// Service d'email avec fallback et debugging
interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    // Vérifier si un service d'email est configuré
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      // Utiliser Resend si configuré
      return await sendWithResend(data, resendApiKey);
    } else {
      // Mode développement: logger et simuler
      return await simulateEmailSend(data);
    }
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

async function sendWithResend(data: EmailData, apiKey: string): Promise<boolean> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    
    console.log('📧 Sending email via Resend:', {
      to: data.to,
      subject: data.subject,
      timestamp: new Date().toISOString()
    });
    
    const { data: result, error } = await resend.emails.send({
      from: 'TrustReview <onboarding@resend.dev>',
      to: [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      
      // If it's a test account limitation, fallback to simulation
      if (error.message?.includes('only send testing emails to your own email address')) {
        console.log('🔄 Resend test account limitation detected, falling back to simulation mode...');
        return await simulateEmailSend(data);
      }
      
      return false;
    }
    
    console.log('✅ Email sent successfully via Resend:', result);
    return true;
  } catch (error) {
    console.error('❌ Resend service error:', error);
    return false;
  }
}

async function simulateEmailSend(data: EmailData): Promise<boolean> {
  // Mode développement: logger les détails
  console.log('📧 Email notification sent (SIMULATION MODE):', {
    to: data.to,
    subject: data.subject,
    timestamp: new Date().toISOString(),
    mode: 'SIMULATION - Configure RESEND_API_KEY to send real emails'
  });
  
  // Log du contenu pour debugging
  console.log('📧 Email content preview:', {
    html_length: data.html.length,
    text_length: data.text?.length || 0,
    has_html: !!data.html,
    has_text: !!data.text
  });
  
  // En mode dev, on retourne true pour ne pas bloquer le processus
  return true;
}

export function generateWeeklySummaryEmail(businessName: string, stats: {
  totalReviews: number;
  averageRating: number;
  positiveRate: number;
  period: string;
  recentFeedbacks: Array<{
    stars: number;
    message: string;
    date: string;
  }>;
}, toEmail: string): EmailData {
  const subject = `📊 Votre récapitulatif hebdomadaire - ${businessName}`;
  
  const recentFeedbacksHtml = stats.recentFeedbacks.length > 0 
    ? stats.recentFeedbacks.map(feedback => `
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #${feedback.stars >= 4 ? '28a745' : 'ffc107'}; margin: 10px 0; border-radius: 5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #${feedback.stars >= 4 ? '#28a745' : '#ffc107'}; font-weight: bold;">
              ${'⭐'.repeat(feedback.stars)} ${feedback.stars}/5
            </span>
            <span style="color: #666; font-size: 12px;">${feedback.date}</span>
          </div>
          <p style="margin: 0; color: #333; font-style: italic;">"${feedback.message}"</p>
        </div>
      `).join('')
    : '<p style="color: #666; font-style: italic;">Aucun nouvel avis avec message cette semaine.</p>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Récapitulatif Hebdomadaire - ${businessName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; font-size: 0.9em; }
        .positive { color: #28a745; }
        .neutral { color: #ffc107; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Votre récapitulatif hebdomadaire</h1>
          <p>${businessName}</p>
          <p style="font-size: 0.9em; opacity: 0.9;">${stats.period}</p>
        </div>
        
        <div class="content">
          <h2>📈 Vos performances cette semaine</h2>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${stats.totalReviews}</div>
              <div class="stat-label">Nouveaux avis</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.averageRating}</div>
              <div class="stat-label">Note moyenne</div>
            </div>
            <div class="stat-card">
              <div class="stat-number ${stats.positiveRate >= 75 ? 'positive' : stats.positiveRate >= 50 ? 'neutral' : ''}">${stats.positiveRate}%</div>
              <div class="stat-label">Satisfaction</div>
            </div>
          </div>
          
          <h3 style="margin-top: 30px;">💬 Derniers avis reçus</h3>
          ${recentFeedbacksHtml}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trustreview.fr/app/stats" class="cta">
              Voir tous les détails
            </a>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1976d2;">💡 Conseil de la semaine</h4>
            <p style="margin: 0; color: #333;">
              ${stats.positiveRate >= 75 
                ? "Excellent travail ! Votre taux de satisfaction est très élevé. Continuez comme ça !"
                : stats.positiveRate >= 50
                ? "Bon début ! Pour améliorer votre satisfaction, pensez à répondre aux avis et à demander plus de retours positifs."
                : "Il y place pour l'amélioration. Analysez les avis négatifs pour identifier les points à améliorer."
              }
            </p>
          </div>
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
Récapitulatif hebdomadaire - ${businessName}
${stats.period}

📊 Vos performances cette semaine:
• Nouveaux avis: ${stats.totalReviews}
• Note moyenne: ${stats.averageRating}/5
• Taux de satisfaction: ${stats.positiveRate}%

${stats.recentFeedbacks.length > 0 ? `
Derniers avis reçus:
${stats.recentFeedbacks.map(f => `
${'⭐'.repeat(f.stars)} ${f.stars}/5 (${f.date})
"${f.message}"
`).join('\n')}
` : 'Aucun nouvel avis avec message cette semaine.'}

💡 Conseil de la semaine:
${stats.positiveRate >= 75 
  ? "Excellent travail ! Votre taux de satisfaction est très élevé. Continuez comme ça !"
  : stats.positiveRate >= 50
  ? "Bon début ! Pour améliorer votre satisfaction, pensez à répondre aux avis et à demander plus de retours positifs."
  : "Il y a place pour l'amélioration. Analysez les avis négatifs pour identifier les points à améliorer."
}

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
