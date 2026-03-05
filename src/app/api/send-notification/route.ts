import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { to, type, data } = await req.json();
    
    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let emailData;

    switch (type) {
      case 'trial_ending':
        emailData = {
          to,
          subject: '⏰ Votre essai TrustReview se termine bientôt',
          html: generateTrialEndingEmail(data),
          text: generateTrialEndingText(data)
        };
        break;

      case 'trial_expired':
        emailData = {
          to,
          subject: '🚫 Votre essai TrustReview est terminé',
          html: generateTrialExpiredEmail(data),
          text: generateTrialExpiredText(data)
        };
        break;

      case 'payment_succeeded':
        emailData = {
          to,
          subject: '✅ Paiement réussi - TrustReview',
          html: generatePaymentSucceededEmail(data),
          text: generatePaymentSucceededText(data)
        };
        break;

      case 'payment_failed':
        emailData = {
          to,
          subject: '❌ Échec de paiement - TrustReview',
          html: generatePaymentFailedEmail(data),
          text: generatePaymentFailedText(data)
        };
        break;

      case 'subscription_updated':
        emailData = {
          to,
          subject: '🔄 Abonnement mis à jour - TrustReview',
          html: generateSubscriptionUpdatedEmail(data),
          text: generateSubscriptionUpdatedText(data)
        };
        break;

      case 'subscription_canceled':
        emailData = {
          to,
          subject: '👋 Abonnement annulé - TrustReview',
          html: generateSubscriptionCanceledEmail(data),
          text: generateSubscriptionCanceledText(data)
        };
        break;

      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    const sent = await sendEmail(emailData);
    
    return NextResponse.json({ 
      success: sent,
      type,
      to
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

function generateTrialEndingEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fin d'essai TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Votre essai se termine bientôt</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre période d'essai de 7 jours de TrustReview se termine dans <strong>${data.daysLeft} jours</strong>.</p>
          
          <div class="warning">
            <h3>🚨 Action requise</h3>
            <p>Pour continuer à utiliser TrustReview sans interruption, veuillez choisir un abonnement.</p>
          </div>
          
          <p>Après la fin de l'essai :</p>
          <ul>
            <li>✅ Vos données seront conservées</li>
            <li>🔒 Vos QR codes seront désactivés</li>
            <li>📊 Vous ne pourrez plus créer de nouveaux QR codes</li>
          </ul>
          
          <a href="https://trustreview.fr/app/billing" class="cta">
            Choisir un abonnement
          </a>
          
          <p>Questions ? Contactez-nous à support@trustreview.fr</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTrialExpiredEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Essai expiré TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fee2e2; border: 1px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cta { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚫 Votre essai est terminé</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre période d'essai de TrustReview est maintenant terminée.</p>
          
          <div class="warning">
            <h3>🔒 Fonctionnalités désactivées</h3>
            <p>Vos QR codes sont maintenant désactivés et vous ne pouvez plus en créer de nouveaux.</p>
          </div>
          
          <p>Pour réactiver vos fonctionnalités :</p>
          <ul>
            <li>📊 Vos données et avis sont conservés</li>
            <li>🔄 Choisissez un abonnement pour réactiver</li>
            <li>✨ Reprenez où vous vous étiez arrêté</li>
          </ul>
          
          <a href="https://trustreview.fr/app/billing" class="cta">
            Réactiver mon compte
          </a>
          
          <p>Nous espérons vous revoir bientôt !</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentSucceededEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paiement réussi TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Paiement réussi</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre paiement de <strong>${data.amount}€</strong> a été traité avec succès.</p>
          
          <div class="success">
            <h3>🎉 Merci pour votre confiance</h3>
            <p>Votre abonnement est maintenant actif et toutes vos fonctionnalités sont disponibles.</p>
          </div>
          
          <p>Prochain renouvellement : ${data.nextBillingDate}</p>
          
          <p>Vous pouvez gérer votre abonnement dans votre espace :</p>
          <a href="https://trustreview.fr/app/billing" style="color: #16a34a;">Gérer mon abonnement</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentFailedEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Échec de paiement TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cta { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Échec de paiement</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          <p>Nous n'avons pas pu traiter votre paiement de <strong>${data.amount}€</strong>.</p>
          
          <div class="warning">
            <h3>🔄 Nouvelle tentative</h3>
            <p>Nous retenterons le paiement le ${data.nextRetryDate}.</p>
          </div>
          
          <p>Pour éviter toute interruption :</p>
          <ul>
            <li>💳 Vérifiez vos informations de paiement</li>
            <li>🏦 Assurez-vous d'avoir des fonds suffisants</li>
            <li>🔄 Mettez à jour votre carte si nécessaire</li>
          </ul>
          
          <a href="https://trustreview.fr/app/billing" class="cta">
            Mettre à jour le paiement
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSubscriptionUpdatedEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Abonnement mis à jour TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Abonnement mis à jour</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre abonnement TrustReview a été mis à jour avec succès.</p>
          
          <p>Statut : <strong>${data.status}</strong></p>
          <p>Prochain renouvellement : ${data.nextBillingDate}</p>
          
          <p>Vous pouvez gérer votre abonnement dans votre espace :</p>
          <a href="https://trustreview.fr/app/billing" style="color: #667eea;">Gérer mon abonnement</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSubscriptionCanceledEmail(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Abonnement annulé TrustReview</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Abonnement annulé</h1>
          <p>TrustReview</p>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre abonnement TrustReview a été annulé.</p>
          
          <p>Date de fin : ${data.endDate}</p>
          
          <p>Vous pourrez continuer à utiliser TrustReview jusqu'à cette date.</p>
          
          <p>Si vous changez d'avis, vous pouvez réactiver votre abonnement à tout moment :</p>
          <a href="https://trustreview.fr/app/billing" style="color: #6b7280;">Réactiver l'abonnement</a>
          
          <p>Merci d'avoir utilisé TrustReview !</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Versions texte des emails
function generateTrialEndingText(data: any) {
  return `Votre essai TrustReview se termine dans ${data.daysLeft} jours.
Choisissez un abonnement pour continuer à utiliser TrustReview sans interruption.
https://trustreview.fr/app/billing`;
}

function generateTrialExpiredText(data: any) {
  return `Votre essai TrustReview est terminé.
Vos QR codes sont désactivés. Réactivez votre compte :
https://trustreview.fr/app/billing`;
}

function generatePaymentSucceededText(data: any) {
  return `Paiement réussi de ${data.amount}€.
Prochain renouvellement : ${data.nextBillingDate}
https://trustreview.fr/app/billing`;
}

function generatePaymentFailedText(data: any) {
  return `Échec de paiement de ${data.amount}€.
Nouvelle tentative le ${data.nextRetryDate}.
Mettez à jour votre paiement :
https://trustreview.fr/app/billing`;
}

function generateSubscriptionUpdatedText(data: any) {
  return `Abonnement mis à jour.
Statut : ${data.status}
Prochain renouvellement : ${data.nextBillingDate}
https://trustreview.fr/app/billing`;
}

function generateSubscriptionCanceledText(data: any) {
  return `Abonnement annulé.
Date de fin : ${data.endDate}
Réactivez votre abonnement :
https://trustreview.fr/app/billing`;
}
