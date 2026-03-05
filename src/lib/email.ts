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
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vérifiez votre email - TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Vérifiez votre email</h1>
          <p>Bienvenue sur TrustReview</p>
        </div>
        
        <div class="content">
          <h2>Merci de vous être inscrit !</h2>
          <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :</p>
          
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">Vérifier mon email</a>
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
          
          <p><strong>Ce lien expirera dans 24 heures.</strong></p>
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
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
          <h1>🔑 Réinitialisation du mot de passe</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <h2>Demande de réinitialisation</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          
          <div class="warning">
            <p><strong>⚠️ Important :</strong></p>
            <ul>
              <li>Ce lien expirera dans 1 heure</li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Ne partagez jamais ce lien avec personne</li>
            </ul>
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
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <h2>Vous avez reçu un nouveau message</h2>
          
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
          <p>Cet email a été envoyé automatiquement par TrustReview</p>
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
