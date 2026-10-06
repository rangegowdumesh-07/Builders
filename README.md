# Silk-Connect — Full Package

This contains everything for Silk-Connect:

```
frontend/
  silk-connect.html      <- the app itself (open this in a browser, or publish it)

backend/
  server.js              <- the OTP backend (send-otp / verify-otp via MSG91)
  .env.example           <- copy to .env and fill in your MSG91 credentials
  package.json
  README.md              <- full setup & deployment steps for the backend
```

## Quick start

1. **Backend first** — follow `backend/README.md` to get an MSG91 account,
   create an OTP template, run the server locally, then deploy it somewhere
   reachable on the internet (Render or Railway are the easiest).

2. **Then connect the frontend** — open `frontend/silk-connect.html` and find
   this line near the top of the `<script>` section:

   ```js
   const SILK_CONNECT_API_BASE = "https://YOUR-BACKEND-URL.example.com/api";
   ```

   Replace it with your deployed backend's URL, save the file, and re-upload
   or re-publish it wherever you're hosting Silk-Connect.

Once both pieces are connected, "Send OTP" in the app will send a real SMS
through MSG91 and verify it against what the person types in.
