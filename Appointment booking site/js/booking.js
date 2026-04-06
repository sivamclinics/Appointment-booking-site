/* ============================================================
   BOOKING FLOW — Patient-facing JavaScript
   ============================================================ */

const booking = {
  service: '', doctor: '', fee: '', duration: '', icon: '',
  dateStr: null, time: '', step: 1
};

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ─────────────────── NAVIGATION ─────────────────── */

function goStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel' + n).classList.add('active');
  updateTrack(n);
  booking.step = n;
  const fills = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };
  document.getElementById('progressFill').style.width = fills[n] || '100%';
  if (n === 2) renderCalendar();
  if (n === 4) renderReview();
  window.scrollTo({ top: document.getElementById('booking-section').offsetTop - 80, behavior: 'smooth' });
}

function updateTrack(active) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('track' + i);
    const circ = el.querySelector('.step-circle');
    el.classList.remove('active', 'done');
    if (i < active) {
      el.classList.add('done');
      circ.textContent = '';
    } else if (i === active) {
      el.classList.add('active');
      circ.textContent = i;
    } else {
      circ.textContent = i;
    }
    // connector
    const conn = el.nextElementSibling;
    if (conn && conn.classList.contains('step-connector')) {
      if (i < active) conn.classList.add('done');
      else conn.classList.remove('done');
    }
  }
}

/* ─────────────────── STEP 1 — SERVICE ─────────────────── */

function selectService(el, name, doctor, fee, duration, icon) {
  document.querySelectorAll('.service-tile').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  booking.service  = name;
  booking.doctor   = doctor;
  booking.fee      = fee;
  booking.duration = duration;
  booking.icon     = icon;

  const bar = document.getElementById('selectedBar');
  bar.style.display = 'flex';
  document.getElementById('selectedBarText').textContent =
    `✓  ${name} — ${doctor} · ${fee} · ${duration}`;
}

function filterServices() {
  const val = document.getElementById('doctorFilter').value;
  document.querySelectorAll('.service-tile').forEach(t => {
    t.classList.toggle('hidden', val !== 'all' && t.dataset.dept !== val);
  });
}

/* ─────────────────── STEP 2 — CALENDAR ─────────────────── */

function renderCalendar() {
  const title = document.getElementById('calMonthTitle');
  title.textContent = MONTH_NAMES[calMonth] + ' ' + calYear;
  const container = document.getElementById('calDays');
  container.innerHTML = '';

  const settings    = DB.getSettings();
  const blocked     = DB.getBlockedDates().map(d => d.date);
  const firstDayDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today       = new Date();
  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

  // Empty cells before 1st
  for (let i = 0; i < firstDayDow; i++) {
    const e = document.createElement('div');
    e.className = 'cal-day empty';
    container.appendChild(e);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow     = new Date(calYear, calMonth, d).getDay();
    const isPast  = new Date(calYear, calMonth, d) < new Date(todayY, todayM, todayD);
    const isSun   = dow === 0 && !settings.allowSunday;
    const isBlk   = blocked.includes(dateStr);
    const isToday = calYear === todayY && calMonth === todayM && d === todayD;

    const el = document.createElement('div');
    let cls = 'cal-day';
    if (isToday)  cls += ' today';
    if (isPast)   cls += ' past';
    else if (isSun || isBlk) cls += isSun ? ' sunday' : ' blocked';
    else          cls += ' available';
    if (booking.dateStr === dateStr) cls += ' selected';
    el.className = cls;
    el.textContent = d;

    if (!isPast && !isSun && !isBlk) {
      el.onclick = () => selectDate(dateStr, el);
    }
    container.appendChild(el);
  }
}

function prevMonth() {
  if (calMonth === 0) { calMonth = 11; calYear--; }
  else calMonth--;
  renderCalendar();
}

function nextMonth() {
  if (calMonth === 11) { calMonth = 0; calYear++; }
  else calMonth++;
  renderCalendar();
}

function selectDate(dateStr, el) {
  document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  booking.dateStr = dateStr;
  booking.time    = '';
  document.getElementById('step2Next').disabled = true;

  const header = document.getElementById('timeslotHeader');
  header.innerHTML = `<h4>${formatDateLong(dateStr)}</h4><p>Choose your preferred time slot</p>`;

  renderTimeSlots(dateStr);
}

function renderTimeSlots(dateStr) {
  const grid    = document.getElementById('timeslotGrid');
  const settings = DB.getSettings();
  const allSlots = DB.generateSlots(settings);
  const booked   = DB.getBookedSlots(dateStr);
  grid.innerHTML = '';

  allSlots.forEach(slot => {
    const isBooked = booked.includes(slot);
    const el = document.createElement('div');
    el.className = 'time-chip' + (isBooked ? ' booked' : '');
    el.textContent = slot;
    if (!isBooked) {
      el.onclick = () => selectTime(slot, el);
    }
    if (booking.time === slot && !isBooked) el.classList.add('selected');
    grid.appendChild(el);
  });
}

function selectTime(t, el) {
  document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  booking.time = t;
  document.getElementById('step2Next').disabled = false;
}

/* ─────────────────── STEP 3 — PATIENT DETAILS ─────────────────── */

function validateStep3() {
  const fname   = document.getElementById('fname').value.trim();
  const lname   = document.getElementById('lname').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const consent = document.getElementById('consent').checked;

  let ok = true;

  // First name
  if (!fname) {
    document.getElementById('fnameErr').textContent = 'First name is required.';
    ok = false;
  } else {
    document.getElementById('fnameErr').textContent = '';
  }

  // Last name
  if (!lname) {
    document.getElementById('lnameErr').textContent = 'Last name is required.';
    ok = false;
  } else {
    document.getElementById('lnameErr').textContent = '';
  }

  // Phone
  if (!phone) {
    document.getElementById('phoneErr').textContent = 'Mobile number is required.';
    ok = false;
  } else if (phone.replace(/[^0-9]/g, '').length < 8) {
    document.getElementById('phoneErr').textContent = 'Enter a valid mobile number.';
    ok = false;
  } else {
    document.getElementById('phoneErr').textContent = '';
  }

  document.getElementById('step3Next').disabled = !(ok && consent);
}

/* ─────────────────── STEP 4 — REVIEW ─────────────────── */

function renderReview() {
  const fname    = document.getElementById('fname').value.trim();
  const lname    = document.getElementById('lname').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const email    = document.getElementById('email').value.trim();
  const gender   = document.getElementById('gender').value;
  const dob      = document.getElementById('dob').value;
  const symptoms = document.getElementById('symptoms').value.trim();
  const meds     = document.getElementById('meds').value.trim();

  const body = document.getElementById('reviewBody');
  body.innerHTML = `
    <div class="review-grid">
      <div class="review-box">
        <h4>Appointment Details</h4>
        <div class="review-row"><span class="review-label">Service</span><span class="review-val">${booking.icon} ${booking.service}</span></div>
        <div class="review-row"><span class="review-label">Doctor</span><span class="review-val">${booking.doctor}</span></div>
        <div class="review-row"><span class="review-label">Duration</span><span class="review-val">${booking.duration}</span></div>
        <div class="review-row"><span class="review-label">Date</span><span class="review-val">${formatDateLong(booking.dateStr)}</span></div>
        <div class="review-row"><span class="review-label">Time</span><span class="review-val">${booking.time}</span></div>
      </div>
      <div class="review-box">
        <h4>Patient Information</h4>
        <div class="review-row"><span class="review-label">Name</span><span class="review-val">${fname} ${lname}</span></div>
        <div class="review-row"><span class="review-label">Mobile</span><span class="review-val">${phone}</span></div>
        ${email ? `<div class="review-row"><span class="review-label">Email</span><span class="review-val">${email}</span></div>` : ''}
        ${gender ? `<div class="review-row"><span class="review-label">Gender</span><span class="review-val">${gender}</span></div>` : ''}
        ${dob ? `<div class="review-row"><span class="review-label">DOB</span><span class="review-val">${dob}</span></div>` : ''}
        ${symptoms ? `<div class="review-row"><span class="review-label">Symptoms</span><span class="review-val">${symptoms}</span></div>` : ''}
        ${meds ? `<div class="review-row"><span class="review-label">Medications</span><span class="review-val">${meds}</span></div>` : ''}
      </div>
    </div>
    <div class="review-total">
      <span>Consultation Fee</span>
      <strong>${booking.fee}</strong>
    </div>
    <div class="wa-confirm-note">
      💬 A WhatsApp confirmation will be sent to <strong style="margin:0 4px">${phone}</strong> immediately after booking.
    </div>
    <div class="panel-actions">
      <button class="btn-ghost" onclick="goStep(3)">← Edit Details</button>
      <button class="btn-primary" onclick="confirmBooking()">✓ Confirm &amp; Book Appointment</button>
    </div>`;
}

/* ─────────────────── CONFIRM ─────────────────── */

async function confirmBooking() {
  const fname    = document.getElementById('fname').value.trim();
  const lname    = document.getElementById('lname').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const email    = document.getElementById('email').value.trim();
  const dob      = document.getElementById('dob').value;
  const gender   = document.getElementById('gender').value;
  const symptoms = document.getElementById('symptoms').value.trim();
  const meds     = document.getElementById('meds').value.trim();
  const emergency = document.getElementById('emergency').value.trim();

  const record = {
    ref:       DB.generateRef(),
    fname, lname,
    name:      `${fname} ${lname}`,
    phone, email, dob, gender, symptoms, meds, emergency,
    service:   booking.service,
    doctor:    booking.doctor,
    fee:       booking.fee,
    duration:  booking.duration,
    icon:      booking.icon,
    dateStr:   booking.dateStr,
    dateLabel: formatDate(booking.dateStr),
    time:      booking.time,
    status:    'Confirmed',
    bookedAt:  new Date().toISOString()
  };

  DB.addBooking(record);

  // Attempt WhatsApp
  try {
    await DB.sendWhatsApp(phone, 'booking_confirmation', [
      fname, booking.service, formatDate(booking.dateStr), booking.time,
      booking.doctor, record.ref
    ]);
  } catch (_) { /* silent fail */ }

  // Show success
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panelSuccess').classList.add('active');
  document.getElementById('progressFill').style.width = '100%';

  // Populate confirmation summary
  document.getElementById('confSummary').innerHTML = `
    <div class="conf-row"><span class="conf-icon">🔖</span><span class="conf-label">Reference No.</span><span class="conf-val conf-ref">${record.ref}</span></div>
    <div class="conf-row"><span class="conf-icon">${booking.icon}</span><span class="conf-label">Service</span><span class="conf-val">${booking.service}</span></div>
    <div class="conf-row"><span class="conf-icon">👨‍⚕️</span><span class="conf-label">Doctor</span><span class="conf-val">${booking.doctor}</span></div>
    <div class="conf-row"><span class="conf-icon">📅</span><span class="conf-label">Date</span><span class="conf-val">${formatDateLong(booking.dateStr)}</span></div>
    <div class="conf-row"><span class="conf-icon">🕐</span><span class="conf-label">Time</span><span class="conf-val">${booking.time}</span></div>
    <div class="conf-row"><span class="conf-icon">💳</span><span class="conf-label">Fee</span><span class="conf-val">${booking.fee}</span></div>
    <div class="conf-row"><span class="conf-icon">💬</span><span class="conf-label">WhatsApp</span><span class="conf-val">${phone}</span></div>`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────────────── RESET ─────────────────── */

function resetAll() {
  booking.service = ''; booking.doctor = ''; booking.fee = '';
  booking.duration = ''; booking.icon = ''; booking.dateStr = null;
  booking.time = ''; booking.step = 1;

  document.getElementById('patientForm').reset();
  document.querySelectorAll('.service-tile').forEach(t => t.classList.remove('selected'));
  document.getElementById('selectedBar').style.display = 'none';
  document.getElementById('step2Next').disabled = true;
  document.getElementById('step3Next').disabled = true;

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel1').classList.add('active');
  document.getElementById('progressFill').style.width = '25%';
  updateTrack(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────────────── PRINT ─────────────────── */

function printConfirmation() { window.print(); }

/* ─────────────────── HAMBURGER ─────────────────── */

document.getElementById('hamburger').addEventListener('click', function() {
  const nav = document.getElementById('mobileNav');
  nav.classList.toggle('open');
});

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
}
