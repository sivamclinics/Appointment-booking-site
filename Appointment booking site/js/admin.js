/* ============================================================
   ADMIN DASHBOARD — Manager JavaScript
   ============================================================ */

let currentTab     = 'overview';
let currentBooking = null;
let adminCalYear   = new Date().getFullYear();
let adminCalMonth  = new Date().getMonth();
let sortField      = null;
let sortAsc        = true;

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ─────────────────── INIT ─────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('todayDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('todayScheduleDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('statTodayDate').textContent =
    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  loadSettings();
  renderStats();
  renderOverview();
  renderBookingTable();
  renderAdminCalendar();
  renderTodayTimeline();
  loadBlockedDates();
  loadWAConfig();
  updateAdminCalTitle();

  // Auto-refresh every 30s
  setInterval(() => {
    renderStats();
    renderOverview();
    renderBookingTable();
    renderTodayTimeline();
  }, 30000);
});

/* ─────────────────── TAB SWITCHING ─────────────────── */

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');

  if (tab === 'calendar')  { renderAdminCalendar(); }
  if (tab === 'today')     { renderTodayTimeline(); }
  if (tab === 'bookings')  { renderBookingTable(); }
  if (tab === 'overview')  { renderStats(); renderOverview(); }
}

/* ─────────────────── STATS ─────────────────── */

function renderStats() {
  const bookings = DB.getBookings();
  const today    = todayStr();

  const total    = bookings.length;
  const todayCt  = bookings.filter(b => b.dateStr === today && b.status !== 'Cancelled').length;

  // This week (Mon-Sun)
  const now = new Date();
  const day = now.getDay(); // 0 Sun
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - day);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekCt = bookings.filter(b => {
    const d = new Date(b.dateStr + 'T12:00:00');
    return d >= startOfWeek && d <= endOfWeek && b.status !== 'Cancelled';
  }).length;

  const revenue = bookings
    .filter(b => b.status === 'Confirmed')
    .reduce((sum, b) => sum + parseInt((b.fee || '₹0').replace(/[^0-9]/g, '')), 0);

  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statToday').textContent   = todayCt;
  document.getElementById('statWeek').textContent    = weekCt;
  document.getElementById('statRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
}

/* ─────────────────── OVERVIEW ─────────────────── */

function renderOverview() {
  const bookings = DB.getBookings().filter(b => b.status !== 'Cancelled');
  const today    = todayStr();

  // Upcoming (today onwards), sorted by date+time
  const upcoming = bookings
    .filter(b => b.dateStr >= today)
    .sort((a, b) => (a.dateStr + a.time).localeCompare(b.dateStr + b.time))
    .slice(0, 8);

  document.getElementById('upcomingCount').textContent = upcoming.length;
  const ul = document.getElementById('upcomingList');
  if (!upcoming.length) {
    ul.innerHTML = '<div class="empty-state">No upcoming appointments yet.</div>';
  } else {
    ul.innerHTML = upcoming.map(b => `
      <div class="upcoming-item">
        <div class="upcoming-time">${b.time}</div>
        <div>
          <div class="upcoming-name">${b.name}</div>
          <div class="upcoming-service">${b.service} · ${b.dateLabel}</div>
        </div>
        <span class="status-badge status-${b.status} upcoming-badge">${b.status}</span>
      </div>`).join('');
  }

  // Service breakdown
  const counts = {};
  bookings.forEach(b => { counts[b.service] = (counts[b.service] || 0) + 1; });
  const total = bookings.length || 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const sb = document.getElementById('serviceBreakdown');
  if (!sorted.length) {
    sb.innerHTML = '<div class="empty-state">No data yet.</div>';
  } else {
    sb.innerHTML = sorted.map(([name, ct]) => `
      <div class="breakdown-row">
        <div class="breakdown-label"><span>${name}</span><span>${ct}</span></div>
        <div class="breakdown-bar"><div class="breakdown-fill" style="width:${Math.round(ct/total*100)}%"></div></div>
      </div>`).join('');
  }
}

/* ─────────────────── BOOKING TABLE ─────────────────── */

function renderBookingTable() {
  let bookings = DB.getBookings();
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const status = document.getElementById('statusFilter')?.value || 'all';

  if (search) {
    bookings = bookings.filter(b =>
      b.name.toLowerCase().includes(search) ||
      b.service.toLowerCase().includes(search) ||
      b.ref.toLowerCase().includes(search) ||
      (b.phone || '').includes(search)
    );
  }
  if (status !== 'all') bookings = bookings.filter(b => b.status === status);

  if (sortField) {
    bookings.sort((a, b) => {
      let va = a[sortField] || '', vb = b[sortField] || '';
      if (sortField === 'date') { va = a.dateStr + a.time; vb = b.dateStr + b.time; }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  } else {
    // Default: newest first
    bookings.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
  }

  const tbody = document.getElementById('bookingTableBody');
  if (!bookings.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-cell">No bookings match your search.</td></tr>';
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td style="font-weight:700;color:var(--green);font-family:monospace">${b.ref}</td>
      <td>${b.name}</td>
      <td>${b.icon || ''} ${b.service}</td>
      <td>${b.dateLabel}<br/><span style="color:var(--muted);font-size:12px">${b.time}</span></td>
      <td style="font-size:12.5px;color:var(--slate)">${b.doctor || '—'}</td>
      <td style="font-size:12.5px">${b.phone}</td>
      <td style="font-weight:600;color:var(--green)">${b.fee}</td>
      <td><span class="status-badge status-${b.status}">${b.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-table-view" onclick="openModal('${b.ref}')">View</button>
          ${b.status !== 'Cancelled' ? `<button class="btn-table-cancel" onclick="quickCancel('${b.ref}')">Cancel</button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

function filterTable() { renderBookingTable(); }

function sortTable(field) {
  if (sortField === field) sortAsc = !sortAsc;
  else { sortField = field; sortAsc = true; }
  renderBookingTable();
}

/* ─────────────────── MODAL ─────────────────── */

function openModal(ref) {
  const b = DB.getBookings().find(bk => bk.ref === ref);
  if (!b) return;
  currentBooking = b;

  document.getElementById('modalTitle').textContent = 'Booking — ' + b.ref;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="review-box" style="background:var(--ivory)">
        <h4 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:1rem">Appointment</h4>
        ${row('Service', b.icon + ' ' + b.service)}
        ${row('Doctor', b.doctor)}
        ${row('Date', formatDateLong(b.dateStr))}
        ${row('Time', b.time)}
        ${row('Duration', b.duration)}
        ${row('Fee', '<strong style="color:var(--green)">' + b.fee + '</strong>')}
        ${row('Status', `<span class="status-badge status-${b.status}">${b.status}</span>`)}
      </div>
      <div class="review-box" style="background:var(--ivory)">
        <h4 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:1rem">Patient</h4>
        ${row('Name', b.name)}
        ${row('Mobile', b.phone)}
        ${b.email ? row('Email', b.email) : ''}
        ${b.gender ? row('Gender', b.gender) : ''}
        ${b.dob ? row('DOB', b.dob) : ''}
        ${b.symptoms ? row('Symptoms', b.symptoms) : ''}
        ${b.meds ? row('Medications', b.meds) : ''}
        ${b.emergency ? row('Emergency Contact', b.emergency) : ''}
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">
        Booked at: ${new Date(b.bookedAt).toLocaleString('en-IN')}
      </div>
    </div>`;

  document.getElementById('cancelBtn').style.display = b.status === 'Cancelled' ? 'none' : '';
  document.getElementById('confirmBtn').style.display = b.status === 'Confirmed' ? 'none' : '';

  document.getElementById('bookingModal').style.display = 'flex';
}

function row(label, val) {
  return `<div class="review-row"><span class="review-label">${label}</span><span class="review-val">${val}</span></div>`;
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('bookingModal')) return;
  document.getElementById('bookingModal').style.display = 'none';
}

function cancelBooking() {
  if (!currentBooking) return;
  if (!confirm(`Cancel appointment for ${currentBooking.name}?\nRef: ${currentBooking.ref}`)) return;
  DB.cancelBooking(currentBooking.ref);
  document.getElementById('bookingModal').style.display = 'none';
  renderStats(); renderOverview(); renderBookingTable(); renderAdminCalendar(); renderTodayTimeline();
}

function confirmBooking() {
  if (!currentBooking) return;
  DB.updateBooking(currentBooking.ref, { status: 'Confirmed' });
  document.getElementById('bookingModal').style.display = 'none';
  renderStats(); renderOverview(); renderBookingTable(); renderAdminCalendar();
}

function quickCancel(ref) {
  if (!confirm('Cancel this appointment?')) return;
  DB.cancelBooking(ref);
  renderStats(); renderOverview(); renderBookingTable(); renderAdminCalendar(); renderTodayTimeline();
}

/* ─────────────────── ADMIN CALENDAR ─────────────────── */

function updateAdminCalTitle() {
  document.getElementById('adminCalTitle').textContent =
    MONTH_NAMES[adminCalMonth] + ' ' + adminCalYear;
}

function renderAdminCalendar() {
  updateAdminCalTitle();
  const container = document.getElementById('adminCalDays');
  container.innerHTML = '';
  const bookings    = DB.getBookings();
  const firstDow    = new Date(adminCalYear, adminCalMonth, 1).getDay();
  const daysInMonth = new Date(adminCalYear, adminCalMonth + 1, 0).getDate();
  const today       = new Date();
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

  for (let i = 0; i < firstDow; i++) {
    const el = document.createElement('div');
    el.className = 'admin-cal-cell empty';
    container.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${adminCalYear}-${String(adminCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow     = new Date(adminCalYear, adminCalMonth, d).getDay();
    const isToday = adminCalYear === todayY && adminCalMonth === todayM && d === todayD;
    const isSun   = dow === 0;

    const dayBookings = bookings.filter(b => b.dateStr === dateStr && b.status !== 'Cancelled');

    const el = document.createElement('div');
    el.className = 'admin-cal-cell' + (isToday ? ' today' : '') + (isSun ? ' sunday' : '');

    const numEl = document.createElement('div');
    numEl.className = 'admin-day-num';
    numEl.textContent = d;
    el.appendChild(numEl);

    dayBookings.slice(0, 4).forEach(b => {
      const ev = document.createElement('div');
      ev.className = 'cal-event ' + b.status;
      ev.textContent = b.time + ' ' + b.fname;
      ev.title = `${b.name} — ${b.service}`;
      ev.onclick = () => openModal(b.ref);
      el.appendChild(ev);
    });

    if (dayBookings.length > 4) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:10px;color:var(--muted);padding:1px 4px;';
      more.textContent = '+' + (dayBookings.length - 4) + ' more';
      el.appendChild(more);
    }

    container.appendChild(el);
  }
}

function adminCalPrev() {
  if (adminCalMonth === 0) { adminCalMonth = 11; adminCalYear--; }
  else adminCalMonth--;
  renderAdminCalendar();
}

function adminCalNext() {
  if (adminCalMonth === 11) { adminCalMonth = 0; adminCalYear++; }
  else adminCalMonth++;
  renderAdminCalendar();
}

/* ─────────────────── TODAY TIMELINE ─────────────────── */

function renderTodayTimeline() {
  const today    = todayStr();
  const bookings = DB.getBookings().filter(b => b.dateStr === today && b.status !== 'Cancelled');
  const settings = DB.getSettings();
  const allSlots = DB.generateSlots(settings);
  const timeline = document.getElementById('todayTimeline');

  if (!allSlots.length) {
    timeline.innerHTML = '<div class="empty-state">No time slots configured.</div>';
    return;
  }

  if (!bookings.length) {
    timeline.innerHTML = '<div class="empty-state">No appointments scheduled for today.</div>';
    return;
  }

  timeline.innerHTML = bookings
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(b => `
      <div class="timeline-slot">
        <div class="timeline-time">${b.time}</div>
        <div class="timeline-line">
          <div class="timeline-dot confirmed"></div>
          <div class="timeline-vline"></div>
        </div>
        <div class="timeline-card" onclick="openModal('${b.ref}')" style="cursor:pointer">
          <div class="timeline-patient">${b.name}</div>
          <div class="timeline-service">${b.icon || ''} ${b.service}</div>
          <div class="timeline-meta">
            <span class="timeline-tag">👨‍⚕️ ${b.doctor}</span>
            <span class="timeline-tag">⏱ ${b.duration}</span>
            <span class="timeline-tag">📱 ${b.phone}</span>
            <span class="timeline-tag">${b.ref}</span>
          </div>
        </div>
      </div>`).join('');
}

/* ─────────────────── WHATSAPP ─────────────────── */

function loadWAConfig() {
  const cfg = DB.getWAConfig();
  if (cfg.apiUrl)     document.getElementById('waApiUrl').value     = cfg.apiUrl;
  if (cfg.apiKey)     document.getElementById('waApiKey').value     = cfg.apiKey;
  if (cfg.template1)  document.getElementById('waTemplate1').value  = cfg.template1;
  if (cfg.template2)  document.getElementById('waTemplate2').value  = cfg.template2;
}

function saveWAConfig() {
  const cfg = {
    apiUrl:    document.getElementById('waApiUrl').value.trim(),
    apiKey:    document.getElementById('waApiKey').value.trim(),
    template1: document.getElementById('waTemplate1').value.trim(),
    template2: document.getElementById('waTemplate2').value.trim()
  };
  DB.saveWAConfig(cfg);
  showWAStatus('✓ WhatsApp configuration saved successfully!', 'success');
}

async function testWAMessage() {
  const phone = prompt('Enter a WhatsApp number to send a test message (with country code, e.g. +91...):');
  if (!phone) return;
  showWAStatus('⏳ Sending test message...', 'success');
  const result = await DB.sendWhatsApp(phone, document.getElementById('waTemplate1').value || 'booking_confirmation', [
    'Test Patient', 'General Consultation', 'Today', '10:00 AM', 'Dr. Sharma', 'MC-TEST'
  ]);
  if (result.ok) {
    showWAStatus('✓ Test message sent successfully! Check the WhatsApp number.', 'success');
  } else if (result.reason === 'not_configured') {
    showWAStatus('✗ Please enter and save your API credentials first.', 'error');
  } else {
    showWAStatus('✗ Failed to send: ' + (result.reason || 'API error. Check your credentials.'), 'error');
  }
}

function showWAStatus(msg, type) {
  const el = document.getElementById('waStatus');
  el.style.display = 'block';
  el.className = 'wa-config-status ' + type;
  el.textContent = msg;
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

/* ─────────────────── SETTINGS ─────────────────── */

function loadSettings() {
  const s = DB.getSettings();
  document.getElementById('setClinicName').value = s.clinicName;
  document.getElementById('setAddress').value    = s.address;
  document.getElementById('setPhone').value      = s.phone;
  document.getElementById('setEmail').value      = s.email;
  document.getElementById('setOpenTime').value   = String(s.openHour);
  document.getElementById('setCloseTime').value  = String(s.closeHour);
  document.getElementById('setSlotDur').value    = String(s.slotMins);
  document.getElementById('setLunch').value      = s.lunchBreak;
  document.getElementById('setSunday').value     = s.allowSunday ? 'yes' : 'no';
}

function saveSettings() {
  const s = {
    clinicName:  document.getElementById('setClinicName').value,
    address:     document.getElementById('setAddress').value,
    phone:       document.getElementById('setPhone').value,
    email:       document.getElementById('setEmail').value,
    openHour:    parseInt(document.getElementById('setOpenTime').value),
    closeHour:   parseInt(document.getElementById('setCloseTime').value),
    slotMins:    parseInt(document.getElementById('setSlotDur').value),
    lunchBreak:  document.getElementById('setLunch').value,
    allowSunday: document.getElementById('setSunday').value === 'yes'
  };
  DB.saveSettings(s);
  alert('✓ Settings saved successfully!');
}

/* ─────────────────── BLOCKED DATES ─────────────────── */

function loadBlockedDates() {
  const dates = DB.getBlockedDates();
  const list  = document.getElementById('blockedDatesList');
  if (!dates.length) { list.innerHTML = '<p style="font-size:13px;color:var(--muted)">No blocked dates.</p>'; return; }
  list.innerHTML = dates.map(d => `
    <div class="blocked-date-item">
      <span>${formatDate(d.date)}${d.reason ? ' — ' + d.reason : ''}</span>
      <button class="blocked-date-remove" onclick="removeBlockedDate('${d.date}')">✕</button>
    </div>`).join('');
}

function addBlockedDate() {
  const date   = document.getElementById('blockDate').value;
  const reason = document.getElementById('blockReason').value.trim();
  if (!date) { alert('Please select a date to block.'); return; }
  DB.addBlockedDate(date, reason);
  document.getElementById('blockDate').value   = '';
  document.getElementById('blockReason').value = '';
  loadBlockedDates();
}

function removeBlockedDate(date) {
  DB.removeBlockedDate(date);
  loadBlockedDates();
}

/* ─────────────────── EXPORT CSV ─────────────────── */

function exportCSV() {
  const bookings = DB.getBookings();
  if (!bookings.length) { alert('No bookings to export.'); return; }

  const headers = ['Reference','Name','Phone','Email','Service','Doctor','Date','Time','Fee','Status','Booked At'];
  const rows    = bookings.map(b => [
    b.ref, b.name, b.phone, b.email || '', b.service, b.doctor || '',
    b.dateLabel, b.time, b.fee, b.status,
    new Date(b.bookedAt).toLocaleString('en-IN')
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `medicareclinic-bookings-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
