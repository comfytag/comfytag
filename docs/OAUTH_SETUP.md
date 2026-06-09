# Gmail Login Setup Guide

## Overview

ComfyTag uses **Google OAuth 2.0** to allow users to sign in with their Gmail accounts. This guide walks you through setting up Google credentials for development and production.

---

## Part 1: Create Google OAuth Credentials (One-Time Setup)

### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project:
   - Click **Select a Project** (top left)
   - Click **NEW PROJECT**
   - Name: `ComfyTag` (or your preferred name)
   - Click **CREATE**

### Step 2: Enable Google+ API

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click on it and click **ENABLE**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials** (left sidebar)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted to create a consent screen first:
   - Click **CREATE CONSENT SCREEN**
   - Select **External** user type
   - Click **CREATE**
   - Fill in required fields:
     - **App name:** ComfyTag
     - **User support email:** your-email@gmail.com
     - **Developer contact:** your-email@gmail.com
   - Click **SAVE AND CONTINUE** (skip optional scopes)
   - Click **SAVE AND CONTINUE** (skip test users)
   - Click **BACK TO DASHBOARD**

4. Now create the OAuth client:
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `ComfyTag Web App`
   - Click **ADD URI** under "Authorized redirect URIs"

### Step 4: Add Redirect URIs

Add these URIs for your environments:

**Development:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

**Production (replace yourdomain.com with your actual domain):**
```
https://yourdomain.com/api/auth/callback/google
https://partner.yourdomain.com/api/auth/callback/google
```

Click **CREATE** to finish.

### Step 5: Copy Your Credentials

A modal will show your credentials:
- **Client ID** — Copy this
- **Client Secret** — Copy this (keep this SECRET!)

Store these somewhere safe. You'll need them next.

---

## Part 2: Configure ComfyTag for Gmail Login

### For Development (Local Testing)

1. **Update `.env` files:**

   **apps/web/.env.local** (create if doesn't exist):
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<your-secret-key>
   NEXT_PUBLIC_API_URL=http://localhost:4002
   GOOGLE_CLIENT_ID=<paste-your-client-id>
   GOOGLE_CLIENT_SECRET=<paste-your-client-secret>
   ```

   **apps/partner/.env.local** (create if doesn't exist):
   ```bash
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=<your-secret-key>
   NEXT_PUBLIC_API_URL=http://localhost:4002
   GOOGLE_CLIENT_ID=<paste-your-client-id>
   GOOGLE_CLIENT_SECRET=<paste-your-client-secret>
   ```

   To generate `NEXTAUTH_SECRET`, run:
   ```bash
   openssl rand -base64 32
   ```

2. **Restart your apps:**
   ```bash
   # Kill running Next.js servers (Ctrl+C)
   
   # Restart web app
   cd apps/web && npm run dev
   
   # Restart partner app (in another terminal)
   cd apps/partner && npm run dev
   ```

### For Production

1. **Update production `.env`** on your VPS:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=<strong-random-secret>
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   ```

2. **Redeploy your applications** (Docker, Vercel, etc.)

---

## Part 3: Test Gmail Login Locally

### Test Web App (Attendees)

1. Go to http://localhost:3000/login
2. Click **"Continue with Google"** button
3. You'll be redirected to Google login
4. Sign in with any Gmail account
5. Authorize ComfyTag to access your profile
6. **Expected:** You're logged in and redirected to the home page

### Test Partner App (Organizers)

1. Go to http://localhost:3001/login
2. Click **"Continue with Google"** button
3. Complete the same Google login flow
4. **Expected:** You're logged in and see the organizer dashboard

### Verify in Database

1. Open MongoDB:
   ```bash
   mongo mongodb://admin:changeme@localhost:27018/comfytag?authSource=admin
   ```

2. Check users were created:
   ```bash
   use comfytag
   db.users.findOne({ email: /your-gmail@gmail.com/ })
   ```

   Should show a user document with your Gmail email.

---

## Part 4: Troubleshooting

### Error: "Invalid Client ID"

- [ ] Check that `GOOGLE_CLIENT_ID` is correct in `.env`
- [ ] Verify Client ID matches what Google Cloud Console shows
- [ ] Restart the Next.js app after updating `.env`

### Error: "Redirect URI mismatch"

- [ ] Check the redirect URI in Google Cloud Console matches exactly:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Dev: `http://localhost:3001/api/auth/callback/google`
- [ ] Make sure there are no trailing slashes or typos
- [ ] Wait a few minutes for Google to sync changes

### Error: "Consent screen not configured"

- [ ] Go back to **APIs & Services** → **OAuth consent screen**
- [ ] Make sure you've completed the consent screen setup
- [ ] Publish the app (or mark it as "in development" if testing)

### User created but can't login again

- [ ] Check `notificationPreferences.email` is enabled
- [ ] Verify JWT token is being set in cookies
- [ ] Check browser DevTools → Application → Cookies for `__Secure-next-auth.session-token`

---

## Part 5: Production Deployment Checklist

Before deploying to production:

- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Production redirect URIs added to Google Console:
  - `https://yourdomain.com/api/auth/callback/google`
  - `https://partner.yourdomain.com/api/auth/callback/google`
- [ ] `GOOGLE_CLIENT_ID` set in production `.env`
- [ ] `GOOGLE_CLIENT_SECRET` set in production `.env` (NEVER expose this)
- [ ] `NEXTAUTH_SECRET` is a strong random string (32+ chars)
- [ ] `NEXTAUTH_URL` matches your production domain (https, no trailing slash)
- [ ] `NEXT_PUBLIC_API_URL` points to your production API
- [ ] NextAuth pages load without errors in production
- [ ] Test Gmail login on production (staging domain first if possible)
- [ ] Monitor logs for auth errors after deployment

---

## FAQ

**Q: Can I use the same Google credentials for both web and partner apps?**
A: Yes! The same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` work for all redirect URIs you've registered.

**Q: Is my Client Secret secure in `.env`?**
A: No! Never commit `.env` to git. Use `.env.local` for development and set env vars directly on your VPS/hosting for production.

**Q: What if I lose my Client Secret?**
A: Go to Google Cloud Console → Credentials, delete the old OAuth client, and create a new one.

**Q: Can users login with just their Google account, or do they need email/password too?**
A: Users can login with EITHER Gmail OR email/password. Both auth methods work.

**Q: How do I log out?**
A: The logout button will clear the NextAuth session and sign you out of ComfyTag (but not Google).

---

## Need Help?

If you run into issues:
1. Check the **Troubleshooting** section above
2. Check Next.js/NextAuth logs: `docker logs [app-container]`
3. Check Google Cloud Console for any OAuth errors
4. Review the NextAuth documentation: https://next-auth.js.org/providers/google
