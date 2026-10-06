# Silk-Connect OTP Backend

This is the real backend for Silk-Connect's phone verification. It gives the app
two endpoints — `/api/send-otp` and `/api/verify-otp` — and actually sends SMS
through MSG91, a DLT-registered SMS provider (registration is legally required
to send OTP SMS to Indian numbers).

The Silk-Connect app is already written to call these two endpoints. Once this
backend is deployed, you only need to change **one line** in the app.

## 1. Get an MSG91 account and OTP template

1. Sign up at https://msg91.com
2. Complete DLT registration for your sender ID (MSG91 walks you through this —
   it's a government requirement, not an MSG91 rule, and it takes a few days
   the first time).
3. In the MSG91 dashboard, go to **OTP → Create Template** and create a simple
   OTP template, e.g. `Your Silk-Connect OTP is ##OTP##. Valid for 10 minutes.`
   Copy the **Template ID** it gives you.
4. Go to **API → Auth Key** and copy your **Auth Key**.

## 2. Configure this project

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
MSG91_AUTH_KEY=your_real_auth_key
MSG91_TEMPLATE_ID=your_real_template_id
```

## 3. Run it locally to test

```bash
npm install
node server.js
```

Test it (replace the number with a real phone you can check):

```bash
curl -X POST http://localhost:3000/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

You should get a real SMS. Then verify:

```bash
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","code":"123456"}'
```

## 4. Deploy it somewhere reachable on the internet

Any of these work well for a small backend like this — pick whichever you're
most comfortable with:

- **Render** (render.com) — free tier, connect your GitHub repo, set the two
  environment variables in its dashboard, done.
- **Railway** (railway.app) — similar, very quick.
- **Vercel** (as a serverless function) — needs slightly different file
  structure; ask if you'd like that version instead.

Whichever you choose, set `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` as
environment variables in that platform's dashboard — never commit your real
`.env` file to GitHub.

## 5. Point the Silk-Connect app at it

In `silk-connect.html`, find this line near the top of the `<script>`:

```js
const SILK_CONNECT_API_BASE = "https://YOUR-BACKEND-URL.example.com/api";
```

Replace it with your deployed backend's URL, e.g.:

```js
const SILK_CONNECT_API_BASE = "https://silk-connect-otp.onrender.com/api";
```

That's it — the app will now send and verify real OTPs.

## Swapping providers later

If you ever want to use Twilio, Fast2SMS, or another provider instead of
MSG91, you only need to edit two functions in `server.js`:
`sendOtpViaProvider()` and `verifyOtpViaProvider()`. The two Express routes
(`/api/send-otp`, `/api/verify-otp`) never need to change, since the app only
talks to those.
