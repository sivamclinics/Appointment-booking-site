/* ============================================================
   DATA LAYER — Shared between booking & admin
   Uses localStorage for persistence across sessions
   ============================================================ */

const DB = {
  KEYS: {
    BOOKINGS: 'mc_bookings',
    BLOCKED:  'mc_blocked_dates',
    SETTINGS: 'mc_settings',
    WA_CONFIG: 'mc_wa_config'
  },

  getBookings() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.BOOKINGS) || '[]'); }
    catch { return []; }
  },

  saveBookings(bookings) {
    localStorage.setItem(this.KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  addBooking(booking) {
    const bookings = this.getBookings();
    bookings.push(booking);
    this.saveBookings(bookings);
    return booking;
  },

  updateBooking(ref, updates) {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.ref === ref);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], ...updates };
      this.saveBookings(bookings);
      return bookings[idx];
    }
    return null;
  },

  cancelBooking(ref) {
    return this.updateBooking(ref, { status: 'Cancelled' });
  },

  getBlockedDates() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.BLOCKED) || '[]'); }
    catch { return []; }
  },

  addBlockedDate(date, reason) {
    const dates = this.getBlockedDates();
    if (!dates.find(d => d.date === date)) {
      dates.push({ date, reason });
      localStorage.setItem(this.KEYS.BLOCKED, JSON.stringify(dates));
    }
  },

  removeBlockedDate(date) {
    const dates = this.getBlockedDates().filter(d => d.date !== date);
    localStorage.setItem(this.KEYS.BLOCKED, JSON.stringify(dates));
  },

  getSettings() {
    const defaults = {
      clinicName: 'MediCare Clinic',
      address:    '123 Healthcare Avenue, Thanesar, Haryana',
      phone:      '+91 12345 67890',
      email:      'info@medicareclinic.in',
      openHour:   9,
      closeHour:  18,
      slotMins:   30,
      lunchBreak: '1300',
      allowSunday: false
    };
    try {
      const stored = JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || '{}');
      return { ...defaults, ...stored };
    } catch { return defaults; }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  getWAConfig() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.WA_CONFIG) || '{}'); }
    catch { return {}; }
  },

  saveWAConfig(cfg) {
    localStorage.setItem(this.KEYS.WA_CONFIG, JSON.stringify(cfg));
  },

  // Generate time slots based on settings
  generateSlots(settings) {
    const slots = [];
    const { openHour, closeHour, slotMins, lunchBreak } = settings;
    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += slotMins) {
        const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        // Skip lunch (1:00 PM break = 1300)
        if (lunchBreak !== 'none') {
          const lh = parseInt(lunchBreak.substring(0,2));
          if (h === lh || h === lh + 1) continue;
        }
        slots.push(timeStr);
      }
    }
    return slots;
  },

  getBookedSlots(dateStr) {
    const bookings = this.getBookings();
    return bookings
      .filter(b => b.dateStr === dateStr && b.status !== 'Cancelled')
      .map(b => b.time);
  },

  generateRef() {
    return 'MC' + Date.now().toString(36).toUpperCase().slice(-5);
  },

  // WhatsApp message sender (calls BSP API)
  async sendWhatsApp(phone, templateName, params) {
    const cfg = this.getWAConfig();
    if (!cfg.apiUrl || !cfg.apiKey) return { ok: false, reason: 'not_configured' };
    try {
      const res = await fetch(cfg.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(cfg.apiKey + ':')}`
        },
        body: JSON.stringify({
          countryCode: phone.startsWith('+') ? '' : '91',
          phoneNumber: phone.replace(/[^0-9+]/g, ''),
          callbackData: 'MediCare_Booking',
          template: { name: templateName, languageCode: 'en', bodyValues: params }
        })
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  }
};

// Helper: format a date string nicely
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
