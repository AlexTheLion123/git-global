const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, org, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'GIT Global Contact <onboarding@resend.dev>',
      to: 'alexurban12@gmail.com',
      subject: `New Enquiry from ${name}`,
      html: `
        <h2>New Contact Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${org ? `<p><strong>Organisation:</strong> ${org}</p>` : ''}
        ${service ? `<p><strong>Service Required:</strong> ${service}</p>` : ''}
        <hr />
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error || !data) {
      console.error('Resend error:', error || new Error('Missing email response data'));
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
