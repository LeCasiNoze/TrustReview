import nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Configuration du transporteur Nodemailer avec Outlook SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.office365.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Important pour Outlook
    }
  });
};

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"TrustReview" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text || ''
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      messageId: info.messageId,
      to: data.to,
      subject: data.subject,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

// Fonction pour envoyer un email de vérification
export async function sendVerifyEmail(email: string, token: string): Promise<boolean> {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // En production, s'assurer que l'URL est correcte
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = 'https://trustreview-eight.vercel.app'; // URL de production
    }
  const verifyUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vérifiez votre email - TrustReview</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          color: #1a202c; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0; 
          padding: 20px; 
          min-height: 100vh;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 20px; 
          overflow: hidden; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.3;
        }
        .header h1 { 
          margin: 0; 
          font-size: 32px; 
          font-weight: 700; 
          position: relative;
          z-index: 1;
        }
        .header p { 
          margin: 10px 0 0; 
          opacity: 0.9; 
          font-size: 16px;
          position: relative;
          z-index: 1;
        }
        .content { 
          padding: 40px 30px; 
          background: #f8fafc;
        }
        .welcome-box {
          background: linear-gradient(135deg, #f6f9fc 0%, #e9ecef 100%);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          border-left: 4px solid #667eea;
        }
        .welcome-box h2 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 24px;
          font-weight: 600;
        }
        .welcome-box p {
          margin: 0;
          color: #4a5568;
          font-size: 16px;
          line-height: 1.6;
        }
        .button-container { 
          text-align: center; 
          margin: 35px 0; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 50px; 
          font-weight: 600; 
          font-size: 16px;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        .button:hover::before {
          left: 100%;
        }
        .fallback-link {
          background: white;
          border: 2px dashed #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
        }
        .fallback-link p {
          margin: 0 0 10px 0;
          color: #4a5568;
          font-size: 14px;
          font-weight: 500;
        }
        .fallback-link code {
          display: block;
          word-break: break-all; 
          color: #667eea; 
          background: #f7fafc;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          border: 1px solid #e2e8f0;
        }
        .security-notice {
          background: linear-gradient(135deg, #fef5e7 0%, #fdeaa8 100%);
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
          border-left: 4px solid #f39c12;
        }
        .security-notice p {
          margin: 0;
          color: #8b6914;
          font-size: 14px;
          font-weight: 500;
        }
        .footer { 
          text-align: center; 
          color: #718096; 
          font-size: 12px; 
          padding: 30px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 5px 0;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          font-weight: bold;
          position: relative;
          z-index: 1;
        }
        .shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }
        .shape-1 {
          width: 80px;
          height: 80px;
          top: -20px;
          right: -20px;
        }
        .shape-2 {
          width: 40px;
          height: 40px;
          bottom: 10px;
          left: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="logo">TR</div>
          <h1>🎉 Bienvenue sur TrustReview !</h1>
          <p>Activez votre compte pour commencer</p>
        </div>
        
        <div class="content">
          <div class="welcome-box">
            <h2>Merci de vous être inscrit !</h2>
            <p>Vous êtes à quelques clics de pouvoir gérer vos avis clients et booster votre réputation en ligne.</p>
          </div>
          
          <p style="text-align: center; color: #4a5568; font-size: 16px; margin: 0 0 25px 0;">
            Pour activer votre compte, cliquez sur le bouton ci-dessous :
          </p>
          
          <div class="button-container">
            <a href="${verifyUrl}" class="button">✨ Activer mon compte</a>
          </div>
          
          <div class="fallback-link">
            <p>📋 Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
            <code>${verifyUrl}</code>
          </div>
          
          <div class="security-notice">
            <p>⏰ Ce lien expirera dans 24 heures pour des raisons de sécurité.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Cet email a été envoyé automatiquement par TrustReview</strong></p>
          <p>Ne répondez pas à cet email • Besoin d'aide ? contact@trustreview.fr</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Vérifiez votre email - TrustReview

Merci de vous être inscrit sur TrustReview !

Pour activer votre compte, visitez ce lien :
${verifyUrl}

Ce lien expirera dans 24 heures.

---
Cet email a été envoyé automatiquement par TrustReview
  `;
  
  return sendEmail({
    to: email,
    subject: '🔐 Vérifiez votre email - TrustReview',
    html,
    text
  });
}

// Fonction pour envoyer un email de réinitialisation de mot de passe
export async function sendResetPassword(email: string, token: string): Promise<boolean> {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // En production, s'assurer que l'URL est correcte
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = 'https://trustreview-eight.vercel.app'; // URL de production
    }
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation du mot de passe - TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>� Réinitialisation du mot de passe</h1>
          <p>Sécurisez votre compte TrustReview</p>
        </div>
        
        <div class="content">
          <h2>Demande de réinitialisation</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">🔐 Réinitialiser mon mot de passe</a>
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          
          <div class="warning">
            <p><strong>⏰ Sécurité :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
            <p><strong>🛡️ Protection :</strong> Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
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
Réinitialisation du mot de passe - TrustReview

Vous avez demandé à réinitialiser votre mot de passe.

Visitez ce lien pour définir un nouveau mot de passe :
${resetUrl}

⚠️ Important :
- Ce lien expirera dans 1 heure
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec personne

---
Cet email a été envoyé automatiquement par TrustReview
  `;
  
  return sendEmail({
    to: email,
    subject: '🔑 Réinitialisation du mot de passe - TrustReview',
    html,
    text
  });
}

// Fonction pour envoyer un email de contact
export async function sendContactEmail(email: string, message: string, name?: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau message de contact - TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📬 Nouveau message de contact</h1>
          <p>Un client potentiel vous contacte</p>
        </div>
        
        <div class="content">
          <h2>🎯 Nouveau message client</h2>
          
          <div class="info">
            <p><strong>De :</strong> ${name || email}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          
          <div class="message">
            <h3>Message :</h3>
            <p>${message}</p>
          </div>
          
          <p>Vous pouvez répondre directement à cet email pour contacter la personne.</p>
        </div>
        
        <div class="footer">
          <p><strong>Cet email a été envoyé automatiquement par TrustReview</strong></p>
          <p>Répondez directement au client : ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Nouveau message de contact - TrustReview

De : ${name || email}
Email : ${email}
Date : ${new Date().toLocaleString('fr-FR')}

Message :
${message}

---
Cet email a été envoyé automatiquement par TrustReview
  `;
  
  return sendEmail({
    to: process.env.EMAIL_USER!, // Envoyer à l'admin
    subject: `📬 Nouveau message de contact - ${name || email}`,
    html,
    text
  });
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
