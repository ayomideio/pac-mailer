export const SMTP_PRESETS = {
  custom: { label: 'Custom', host: '', port: '587', security: 'starttls' },
  gmail: {
    label: 'Gmail',
    host: 'smtp.gmail.com',
    port: '587',
    security: 'starttls',
    hint: 'Use an App Password if 2FA is enabled.',
  },
  outlook: {
    label: 'Outlook / Office 365',
    host: 'smtp.office365.com',
    port: '587',
    security: 'starttls',
  },
  yahoo: {
    label: 'Yahoo Mail',
    host: 'smtp.mail.yahoo.com',
    port: '587',
    security: 'starttls',
  },
  sendgrid: {
    label: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: '587',
    security: 'starttls',
    username: 'apikey',
  },
  mailgun: {
    label: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: '587',
    security: 'starttls',
  },
};

export const emptyProfile = () => ({
  id: crypto.randomUUID(),
  name: 'New Profile',
  preset: 'custom',
  host: '',
  port: '587',
  security: 'starttls',
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
  auth: true,
  allowInsecure: false,
});

export const emptyMail = () => ({
  to: '',
  cc: '',
  bcc: '',
  replyTo: '',
  subject: '',
  body: '',
  altBody: '',
  format: 'plain',
});
