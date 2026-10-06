// Silk-Connect OTP backend
// Two endpoints, matching exactly what the Silk-Connect app already calls:
//   POST /api/send-otp    { phone }        -> { success: true }
//   POST /api/verify-otp  { phone, code }  -> { verified: true|false }
//
// This uses MSG91's OTP API (https://msg91.com), which is DLT-registered and
// legal for sending OTP SMS to Indian mobile numbers. MSG91 generates and
// checks the OTP on their end, so this server is just a thin, safe proxy that
// keeps your MSG91 auth key hidden from the browser.
//
// You can swap MSG91 for Twilio Verify, Fast2SMS, or any other provider by
// only editing the two functions sendOtpViaProvider() and verifyOtpViaProvider()
// below — the two Express routes never need to change.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const {
  MSG91_AUTH_KEY,      // from your MSG91 dashboard
  MSG91_TEMPLATE_ID,   // the DLT-approved OTP SMS template you created in MSG91
  PORT = 3000
} = process.env;

if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
  console.warn(
    "\n⚠️  MSG91_AUTH_KEY or MSG91_TEMPLATE_ID is missing from your .env file.\n" +
    "   The server will start, but every OTP request will fail until you set them.\n"
  );
}

// ---- basic validation helpers ----
function isValidIndianMobile(phone) {
  return /^\d{10}$/.test(phone);
}

// ---- provider integration (MSG91) ----
async function sendOtpViaProvider(phone) {
  const url = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=91${phone}&authkey=${MSG91_AUTH_KEY}&otp_expiry=10`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  console.log("MSG91 HTTP status:", res.status);
  console.log("MSG91 response:", JSON.stringify(data, null, 2));

  if (!res.ok || data.type !== "success") {
    throw new Error(data.message || JSON.stringify(data));
  }

  return data;
}

async function verifyOtpViaProvider(phone, code) {
  const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(code)}&mobile=91${phone}&authkey=${MSG91_AUTH_KEY}`;
  const res = await fetch(url, { method: "GET" });
  const data = await res.json();
  // MSG91 returns { type: "success" } if the OTP matched, { type: "error" } otherwise
  return data.type === "success";
}

// ---- routes (this is the contract the Silk-Connect frontend already calls) ----
app.post("/api/send-otp", async (req, res) => {
  const { phone } = req.body || {};
  if (!phone || !isValidIndianMobile(phone)) {
    return res.status(400).json({ success: false, error: "A valid 10-digit phone number is required." });
  }
  try {
    await sendOtpViaProvider(phone);
    res.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err.message);
    res.status(502).json({ success: false, error: "Could not send OTP right now." });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !isValidIndianMobile(phone) || !code) {
    return res.status(400).json({ verified: false, error: "Phone and code are required." });
  }
  try {
    const verified = await verifyOtpViaProvider(phone, code);
    res.json({ verified });
  } catch (err) {
    console.error("verify-otp error:", err.message);
    res.status(502).json({ verified: false, error: "Could not verify OTP right now." });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Silk-Connect OTP backend listening on port ${PORT}`);
});
