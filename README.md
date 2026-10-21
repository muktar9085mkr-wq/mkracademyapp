# MKR Academy — Educational Notes Selling App

**Quality Notes. Better Preparation. Better Results.**

A production-oriented educational digital product selling web application built for students in Assam preparing for **HSLC 2027** and Class 6 to 10 school examinations in both **Assamese Medium (অসমীয়া মাধ্যম)** and **English Medium**.

---

## 1. System Architecture & Features

- **Frontend**: React 19 + TypeScript + Tailwind CSS (v4) + Lucide Icons + Canvas Confetti.
- **Backend**: Full-stack Express server (`server.ts`) with Vite middleware, Razorpay HMAC-SHA256 signature verification, webhook handler, and authenticated PDF streaming.
- **Database**: Cloud Firestore with Attribute-Based Access Control (ABAC) and Zero-Trust security rules.
- **Authentication**: Firebase Authentication (Email/Password, Google Sign-in popup, Password Reset) with phone number validation.
- **Payments**: 100% verified Razorpay Checkout integration with mandatory 10-digit Indian phone verification, backend order creation, and server-side verification.
- **Delivery**: Protected PDF notes access under student's **My Purchases** with built-in online document reader and downloadable PDF.
- **Admin Panel**: Accessible only to verified administrator (`muktar9085mkr@gmail.com` or Firestore `/admins/{uid}`) for managing products, prices, orders, registered students, real-time promotional banner, and social links.

---

## 2. Firebase Configuration

The application is wired to the user's project (`admin-original-a0bcd`) specified in `firebase-applet-config.json`:

```json
{
  "apiKey": "AIzaSyBDQcnYAXrf_HmmoTtP86ryW9KZlwawbRw",
  "authDomain": "admin-original-a0bcd.firebaseapp.com",
  "projectId": "admin-original-a0bcd",
  "storageBucket": "admin-original-a0bcd.firebasestorage.app",
  "messagingSenderId": "669869297609",
  "appId": "1:669869297609:web:61549703754dea9299e218",
  "measurementId": "G-3N4SSN4JZ8"
}
```

### Firestore Collections Schema

1. **`products/{productId}`**
   - `title`: String
   - `slug`: String
   - `shortDescription`: String
   - `description`: String
   - `subject`: 'General Science' | 'Mathematics' | 'Social Science' | 'English' | 'Assamese' | 'Other Subjects'
   - `classLevel`: 'HSLC 2027' | 'Class 10' | 'Class 9' | 'Class 8' | 'Class 7' | 'Class 6'
   - `medium`: 'Assamese Medium' | 'English Medium' | 'Both Mediums'
   - `category`: 'Normal' | 'Premium' | 'Budget Friendly'
   - `tags`: Array of strings
   - `chapters`: Array of chapter strings
   - `coverImagePath`: URL string
   - `pdfStoragePath`: Storage reference string
   - `originalPricePaise`: Number (in paise, e.g. 29900 = ₹299)
   - `sellingPricePaise`: Number (in paise, e.g. 14900 = ₹149)
   - `published`: Boolean
   - `featured`: Boolean
   - `createdAt`, `updatedAt`: ISO timestamps

2. **`orders/{orderId}`**
   - `uid`: Student Firebase Auth UID
   - `studentName`: String
   - `studentPhone`: Compulsory 10-digit Indian mobile number
   - `studentEmail`: Email string
   - `productId`: ID of product
   - `productTitleSnapshot`: Immutable snapshot of title
   - `amountPaise`: Integer in paise
   - `currency`: 'INR'
   - `razorpayOrderId`: Razorpay order reference
   - `razorpayPaymentId`: Razorpay transaction ID
   - `status`: 'pending' | 'paid' | 'failed' | 'refunded'
   - `createdAt`, `verifiedAt`: ISO timestamps

3. **`purchases/{purchaseId}`**
   - Deterministic ID format: `pur_{uid}_{productId}` (guarantees idempotency)
   - `uid`: Student UID
   - `productId`: Product ID
   - `orderId`: Verified Order ID
   - `productTitle`: Title
   - `coverImagePath`: Cover preview
   - `entitlementStatus`: 'active' | 'revoked'
   - `purchasedAt`: ISO timestamp

4. **`users/{uid}`**
   - `displayName`: Student Name
   - `email`: Student Email
   - `phoneNumber`: 10-digit Indian mobile
   - `role`: 'student' | 'admin'

5. **`appSettings/public`**
   - `banner`: Dynamic promotional banner configuration
   - `social`: WhatsApp, Telegram, YouTube, Instagram, Email

---

## 3. Security Rules

### Firestore Security Rules (`firestore.rules`)
- Default deny: `match /{document=**} { allow read, write: if false; }`
- Public read access permitted only for `published == true` products and `appSettings/public`.
- Non-admin students can only read and update permitted fields in their own `users/{uid}` document.
- Only verified administrators (`muktar9085mkr@gmail.com` or users in `admins/{uid}`) can publish/edit products, update settings, or modify order statuses.
- Order and purchase fulfillment is strictly enforced server-side.

### Storage Security Rules (`storage.rules`)
- Public covers & icons: Read allowed for all, write restricted to admin.
- PDF notes (`notes/{fileName}`): Access restricted to authenticated entitlements verified by the backend.

---

## 4. Razorpay Payment Setup

### Environment Variables (`.env.example`)
```env
RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret_here"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret_here"
ADMIN_EMAIL="muktar9085mkr@gmail.com"
```

### Steps to activate Razorpay Live Payments:
1. Sign up / Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings > API Keys** and generate **Key ID** and **Key Secret**.
3. Place them in your server environment variables.
4. Set Webhook URL to `https://<your-app-domain>/api/payment/webhook` with event `payment.captured`.
5. The backend verifies incoming signatures via HMAC-SHA256 before marking orders as paid and unlocking note downloads.

---

## 5. Testing Checklist

- [x] **Registration & Login**: Student can register with name, email, password, and validated 10-digit Indian mobile number.
- [x] **Google Sign-in**: One-click Google popup authentication.
- [x] **Auto-seed Initial Products**: Real notes for HSLC 2027 and Classes 6-10 in Assamese & English medium are seeded into Firestore.
- [x] **Checkout Validation**: Compulsory phone number validation blocks invalid formats before Razorpay checkout opens.
- [x] **Server Order Creation**: Order price is calculated on the backend from database values.
- [x] **Server Verification**: HMAC signature verified before granting purchase entitlement.
- [x] **My Purchases**: Verified purchases appear with purchase date, order ID, and "Download PDF" & "Read Online" buttons.
- [x] **Admin Dashboard**: Accessible by `muktar9085mkr@gmail.com`.
- [x] **Banner Management**: Real-time sync of homepage banner without rebuilding.
- [x] **Mobile Responsiveness**: Clean, professional design on mobile screens, tablets, and desktops.

---

## 6. Deploying to Netlify (Step-by-Step)

The project includes all required Netlify configuration files (`netlify.toml`, `netlify/functions/api.ts`, and `public/_redirects`).

### Step 1: Push Code to GitHub / GitLab
Make sure your latest code is pushed to your Git repository.

### Step 2: Connect to Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select your Git provider (GitHub, GitLab, or Bitbucket) and pick your MKR Academy repository.

### Step 3: Verify Build Settings (Auto-detected from `netlify.toml`)
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

### Step 4: Add Environment Variables in Netlify
Go to **Site configuration** > **Environment variables** > **Add a variable**:
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID (e.g. `rzp_live_...` or `rzp_test_...`)
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
- `RAZORPAY_WEBHOOK_SECRET`: *(Optional)* Your Razorpay webhook secret
- `ADMIN_EMAIL`: `muktar9085mkr@gmail.com`
- `NODE_VERSION`: `20`

*(Note: Firebase config is bundled automatically via `firebase-applet-config.json`. If you wish to override any key via env, you can also set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.)*

### Step 5: Whitelist Your Netlify Domain in Firebase
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **admin-original-a0bcd**.
3. Go to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain** and enter your Netlify subdomain (e.g., `mkr-academy.netlify.app`) or your custom domain.

### Step 6: Deploy!
Click **Deploy site**. Netlify will build the frontend into `dist/` and compile the serverless API function in `netlify/functions/api.ts` to power order creation, Razorpay HMAC verification, and PDF streaming.
