# Vercel Postgres Setup for Contact Form

## Prerequisites
- Vercel account with a project deployed
- Vercel CLI installed (`npm i -g vercel`)

## Setup Steps

### 1. Install Vercel Postgres Package
```bash
npm install @vercel/postgres
```

### 2. Create Vercel Postgres Database
1. Go to your Vercel dashboard
2. Select your project
3. Go to Storage tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose a name (e.g., "noosphere-contacts")
7. Select a region close to your users

### 3. Run Database Setup SQL
After creating the database, go to the "Query" tab in your Vercel Postgres dashboard and run the SQL from `sql/setup.sql`:

```sql
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
ON contact_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_read 
ON contact_submissions(read);
```

### 4. Environment Variables (Automatic)
Vercel automatically injects these environment variables when you have a Postgres database:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

No need to manually add them - they're available in your API routes automatically.

### 5. Deploy
```bash
vercel --prod
```

## Local Development

For local development, you need to pull the environment variables:

```bash
vercel env pull .env.local
```

Then start your dev server:
```bash
npm run dev
```

## Viewing Submissions

### Option 1: Vercel Dashboard
Go to Storage → Your Database → Data tab to view submissions.

### Option 2: Create an Admin Page (Optional)
You can create an admin page at `/src/pages/admin/contacts.astro` to view submissions with proper authentication.

## Testing

Test the form locally:
1. Run `vercel env pull .env.local`
2. Start dev server with `npm run dev`
3. Go to `http://localhost:4321/contact`
4. Submit the form
5. Check the Vercel Postgres dashboard to see the submission

## Email Notifications (Optional)

To get email notifications when someone submits the form, you can use:
- Resend (https://resend.com) - free tier: 100 emails/day
- SendGrid (https://sendgrid.com) - free tier: 100 emails/day

Add this to your API route after the database insert:

```typescript
// Send email notification
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'contact@noosphere.tech',
    to: 'andrew@noosphere.tech',
    subject: `New Contact Form: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `
  })
});
```
