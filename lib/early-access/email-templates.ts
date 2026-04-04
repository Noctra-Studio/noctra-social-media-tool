import { escapeHtml } from './utils'

/**
 * Base styles for the dark-themed emails
 */
const styles = {
  body: 'margin: 0; padding: 0; background-color: #101417; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; color: #E0E5EB;',
  container: 'max-width: 600px; margin: 0 auto; padding: 40px 20px;',
  card: 'background-color: #1A1F29; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; padding: 40px; text-align: center;',
  logoContainer: 'margin-bottom: 32px;',
  heading: 'color: #FFFFFF; font-size: 24px; font-weight: 600; line-height: 1.3; margin: 0 0 16px 0;',
  text: 'color: #A7AFBD; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;',
  button: 'display: inline-block; background-color: #E0E5EB; color: #101417; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; transition: opacity 0.2s;',
  footer: 'margin-top: 32px; text-align: center; color: #4E576A; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;',
}

function getBaseLayout(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Noctra Social</title>
    </head>
    <body style="${styles.body}">
      <div style="${styles.container}">
        <div style="${styles.card}">
          <div style="${styles.logoContainer}">
            <img src="https://social.noctra.studio/brand/favicon-light.png" alt="Noctra Social" width="48" height="48" style="display: block; margin: 0 auto;">
          </div>
          ${content}
        </div>
        <div style="${styles.footer}">
          Noctra Social &copy; ${new Date().getFullYear()} &middot; Noctra Studio
        </div>
      </div>
    </body>
    </html>
  `.trim()
}

/**
 * Sent when a user submits the request access form
 */
export function getAwaitingReviewTemplate(params: { name: string }) {
  const content = `
    <h1 style="${styles.heading}">${escapeHtml(params.name)}, hemos recibido tu solicitud.</h1>
    <p style="${styles.text}">
      Gracias por tu interés en Noctra Social. Nuestro equipo está revisando las solicitudes 
      para asegurar la mejor experiencia posible durante esta etapa de acceso temprano.
    </p>
    <p style="${styles.text}">
      Te avisaremos por este medio en cuanto tu acceso sea aprobado.
    </p>
    <div style="margin-top: 32px; border-top: 0.5px solid rgba(255, 255, 255, 0.08); padding-top: 24px;">
      <p style="color: #4E576A; font-size: 13px; margin: 0;">
        No necesitas realizar ninguna acción adicional por ahora.
      </p>
    </div>
  `
  return getBaseLayout(content)
}

/**
 * Sent when an admin approves the request
 */
export function getAccessGrantedTemplate(params: { name: string; loginUrl: string }) {
  const content = `
    <h1 style="${styles.heading}">¡Bienvenido a bordo, ${escapeHtml(params.name)}!</h1>
    <p style="${styles.text}">
      Es un placer informarte que tu solicitud de acceso a Noctra Social ha sido aprobada. 
      Ya puedes empezar a gestionar tus redes con la potencia de nuestro motor creativo.
    </p>
    <div style="margin: 40px 0;">
      <a href="${params.loginUrl}" style="${styles.button}">Configurar mi cuenta</a>
    </div>
    <p style="${styles.text}">
      Si tienes alguna duda durante el proceso de configuración, simplemente responde a este correo.
    </p>
  `
  return getBaseLayout(content)
}

/**
 * Sent when an admin rejects or waitlists the request
 */
export function getUpdateStatusTemplate(params: { name: string; status: 'rejected' | 'waitlisted' }) {
  const isWaitlist = params.status === 'waitlisted'
  
  const content = `
    <h1 style="${styles.heading}">Actualización sobre tu solicitud</h1>
    <p style="${styles.text}">
      Hola ${escapeHtml(params.name)}, gracias por tu interés en Noctra Social.
    </p>
    <p style="${styles.text}">
      ${isWaitlist 
        ? 'Debido al alto volumen de solicitudes, hemos asignado tu cuenta a nuestra lista de espera. Te notificaremos en cuanto liberemos más espacios para nuevos usuarios.'
        : 'En este momento estamos priorizando perfiles específicos para nuestra fase beta y no podemos otorgarte acceso inmediato. Sin embargo, conservaremos tu solicitud para futuras expansiones.'}
    </p>
    <div style="margin-top: 32px; border-top: 0.5px solid rgba(255, 255, 255, 0.08); padding-top: 24px;">
      <p style="color: #4E576A; font-size: 13px; margin: 0;">
        Gracias por tu paciencia y comprensión.
      </p>
    </div>
  `
  return getBaseLayout(content)
}

/**
 * Sent to the Noctra admin when a user completes their password setup
 */
export function getAdminSetupNotificationTemplate(params: { name: string; email: string }) {
  const content = `
    <h1 style="${styles.heading}">Nuevo acceso activado</h1>
    <p style="${styles.text}">
      El usuario <strong>${escapeHtml(params.name)}</strong> (${escapeHtml(params.email)}) acaba de configurar su contraseña y crear su cuenta con éxito.
    </p>
    <p style="${styles.text}">
      Ahora comenzará su proceso de onboarding (configuración de marca, tonos, plataformas, etc.).
    </p>
    <div style="margin-top: 32px; border-top: 0.5px solid rgba(255, 255, 255, 0.08); padding-top: 24px;">
      <p style="color: #4E576A; font-size: 13px; margin: 0;">
        Notificación automática de Noctra Social.
      </p>
    </div>
  `
  return getBaseLayout(content)
}
