# 🏥 MediCare Clinic — Appointment Booking Website

A professional, fully functional clinic appointment booking site.  
**Patient site:** `index.html` | **Manager dashboard:** `admin.html`

---

## ✅ Features

### Patient Booking
- 4-step guided booking flow (Service → Date/Time → Details → Confirm)
- Visual calendar with available/booked slot indicators
- Department and doctor filtering
- WhatsApp confirmation note
- Print/save confirmation

### Clinic Manager Dashboard (`admin.html`)
- Live stats: total bookings, today's count, revenue
- All bookings table with search, filter, sort, export CSV
- Monthly calendar view with appointments overlaid
- Today's timeline schedule
- WhatsApp API configuration
- Clinic settings (hours, slot duration, lunch break)
- Block specific dates (holidays, maintenance)
- Booking detail modal: view, confirm, cancel

---

## 🚀 DEPLOY TO GITHUB PAGES — Step by Step

### Step 1 — Create a GitHub Account
Go to https://github.com and sign up (free). It takes 2 minutes.

### Step 2 — Create a New Repository
1. Click the **+** icon (top right) → **New repository**
2. Repository name: `medicare-clinic` (or any name you like)
3. Keep it **Public** (required for free GitHub Pages)
4. Click **Create repository**

### Step 3 — Upload Your Files
You have two options:

#### Option A — Using GitHub Website (Easiest, no coding needed)
1. On your new repository page, click **"uploading an existing file"**
2. Drag and drop ALL the files from this folder:
   - `index.html`
   - `admin.html`
   - `css/` folder (with style.css and admin.css)
   - `js/` folder (with data.js, booking.js, admin.js)
   - `.github/workflows/deploy.yml`
3. Click **Commit changes**

#### Option B — Using Git (command line)
```bash
cd medicare-clinic
git init
git add .
git commit -m "Initial clinic website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/medicare-clinic.git
git push -u origin main
```

### Step 4 — Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** (top tab)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Wait 2-3 minutes — GitHub will automatically deploy your site

### Step 5 — Get Your Live URL
Your website will be live at:
```
https://YOUR_USERNAME.github.io/medicare-clinic/
```

Example: `https://drsharmaclinic.github.io/medicare-clinic/`

Share `index.html` URL with patients.  
Use `admin.html` URL for yourself (clinic manager).

---

## 📱 WhatsApp Integration Setup

You need a WhatsApp Business API provider. Since you have Meta Business Suite:

### Recommended for India: Interakt (₹999/month)
1. Go to https://www.interakt.shop
2. Sign up → Connect your WhatsApp Business Account (via Meta)
3. Get your API key from Settings → Developer
4. Create message templates (see templates below)
5. Enter credentials in **Admin Dashboard → WhatsApp Setup**

### Message Templates to Create in Your BSP

**Template 1 — Booking Confirmation** (name: `booking_confirmation`)
```
Hello {{1}}, your appointment at MediCare Clinic is confirmed! 🏥

Service: {{2}}
Date: {{3}}
Time: {{4}}
Doctor: {{5}}
Reference: {{6}}

Please arrive 10 minutes early.
For changes, call +91 12345 67890.

Thank you for choosing MediCare Clinic!
```

**Template 2 — 24hr Reminder** (name: `appointment_reminder_24h`)
```
Hi {{1}}, reminder: you have an appointment at MediCare Clinic tomorrow.

📅 {{2}} at {{3}}
🩺 {{4}}

See you soon! Call +91 12345 67890 to reschedule.
```

---

## 🎨 Customisation Guide

### Change Clinic Name, Address, Phone
- Open `index.html` in any text editor (Notepad, VS Code, RStudio)
- Find and replace "MediCare Clinic" with your clinic name
- Find "123 Healthcare Avenue, Thanesar" and update your address
- Find "+91 12345 67890" and update your phone number

### Change Services or Fees
- Open `index.html`
- Find `<div class="service-tile"` sections
- Update the service name, doctor, fee, and duration

### Change Doctors
- Find `<select id="doctorFilter">` in `index.html`
- Update the `<option>` values with your doctors' names
- Update the `data-dept` attributes on service tiles to match

### Change Clinic Hours / Slot Duration
- Open Admin Dashboard → Settings
- Adjust Opening Time, Closing Time, Slot Duration, Lunch Break
- Changes apply immediately to the booking calendar

---

## 📁 File Structure
```
medicare-clinic/
├── index.html          ← Patient booking site
├── admin.html          ← Clinic manager dashboard
├── css/
│   ├── style.css       ← Main styles
│   └── admin.css       ← Admin styles
├── js/
│   ├── data.js         ← Data storage & WhatsApp API
│   ├── booking.js      ← Booking flow logic
│   └── admin.js        ← Admin dashboard logic
├── .github/
│   └── workflows/
│       └── deploy.yml  ← Auto-deployment script
└── README.md
```

---

## 💾 Data Storage
- All booking data is stored in the **browser's localStorage**
- This means: bookings are visible on the same device/browser
- For shared access across devices: you would need a backend database
  (contact a developer, or use a service like Firebase — free tier available)

## 🔒 Admin Security
- Currently the admin page has no password (for simplicity)
- To add a password: open `admin.html` and add this at the top of `<body>`:
```html
<script>
const pass = prompt('Enter admin password:');
if (pass !== 'YourPasswordHere') {
  document.body.innerHTML = '<h2 style="text-align:center;margin-top:4rem">Access Denied</h2>';
}
</script>
```

---

## 🆘 Support
For help with deployment or customisation, consult:
- GitHub Pages docs: https://docs.github.com/pages
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
