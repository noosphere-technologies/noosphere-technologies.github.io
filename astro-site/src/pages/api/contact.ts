import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email notification via Resend
    if (!process.env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Contact Form <onboarding@resend.dev>',
            to: 'andrew@noosphere.tech',
            subject: `New Contact Form: ${subject}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
            `,
            text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSubmitted at: ${new Date().toLocaleString()}`
          })
        });

      if (!emailResponse.ok) {
        const error = await emailResponse.text();
        console.error('Email send failed:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Generate AI response
      let aiResponse = '';
      if (process.env.OPENAI_API_KEY) {
        try {
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are a helpful AI assistant for Noosphere Technologies, a company building trust graphs and content authenticity solutions. 
                  Generate a personalized, engaging response to someone who just submitted a contact form. 
                  Be warm, professional, and specific to their inquiry. Keep it concise (2-3 sentences).
                  Acknowledge their specific interest and let them know Andrew will respond soon.`
                },
                {
                  role: 'user',
                  content: `Someone named ${name} just submitted a contact form with subject: "${subject}" and message: "${message}"`
                }
              ],
              temperature: 0.7,
              max_tokens: 150
            })
          });

          if (openaiResponse.ok) {
            const data = await openaiResponse.json();
            aiResponse = data.choices[0].message.content;
          }
        } catch (aiError) {
          console.error('AI response generation failed:', aiError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message sent successfully',
          aiResponse: aiResponse || `Thank you for reaching out, ${name}! We've received your message about "${subject}" and Andrew will get back to you within 24 hours. We're excited to discuss how Noosphere can help with your content authenticity needs.`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
