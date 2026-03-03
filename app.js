// ====== STATE ======
let currentLang = 'hi';
let currentPage = 'home';
let priceChart = null;
let transportStep = 2; // 0=pending,1=accepted,2=onway,3=done
let allQuestions = [...QUESTIONS];
let seasonFilter = 'all';
let cropSearchVal = '';

// ====== LANGUAGE ======
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('lang-' + lang).classList.add('active');
    applyTranslations();
    renderHome();
}

function t(key) { return (TRANSLATIONS[currentLang] || TRANSLATIONS.hi)[key] || key; }

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const k = el.getAttribute('data-key');
        if (TRANSLATIONS[currentLang][k]) el.textContent = TRANSLATIONS[currentLang][k];
    });
    document.querySelectorAll('[data-key-placeholder]').forEach(el => {
        const k = el.getAttribute('data-key-placeholder');
        if (TRANSLATIONS[currentLang][k]) el.placeholder = TRANSLATIONS[currentLang][k];
    });
}

// ====== NAVIGATION ======
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const pg = document.getElementById('page-' + page);
    if (pg) pg.classList.add('active');
    const nl = document.getElementById('navlink-' + page);
    if (nl) nl.classList.add('active');
    currentPage = page;
    closeMenus();
    window.scrollTo(0, 0);
    if (page === 'mandi') renderMandiPage();
    if (page === 'crop') renderCrops();
    if (page === 'community') renderCommunity();
    if (page === 'transport') populateTransportCrops();
}

function showDiseasePage() { showPage('disease'); }

function closeMenus() {
    document.getElementById('notif-dropdown').classList.remove('open');
    document.getElementById('profile-dropdown').classList.remove('open');
    document.getElementById('nav-links').classList.remove('open');
}

function toggleMenu() { document.getElementById('nav-links').classList.toggle('open'); }
function toggleDark() {
    const html = document.documentElement;
    const dark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', dark ? 'light' : 'dark');
    document.getElementById('dark-icon').textContent = dark ? '🌙' : '☀️';
}
function toggleNotif() {
    const dd = document.getElementById('notif-dropdown');
    const pd = document.getElementById('profile-dropdown');
    pd.classList.remove('open');
    dd.classList.toggle('open');
}
function toggleProfile() {
    const pd = document.getElementById('profile-dropdown');
    const nd = document.getElementById('notif-dropdown');
    nd.classList.remove('open');
    pd.classList.toggle('open');
}
document.addEventListener('click', e => {
    if (!e.target.closest('.notif-wrapper') && !e.target.closest('#profile-btn')) closeMenus();
});

// ====== NOTIFICATIONS ======
function renderNotifications() {
    const list = document.getElementById('notif-list');
    list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}">
      <span class="notif-item-icon">${n.icon}</span>
      <div class="notif-item-text">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-desc">${n.desc}</div>
        <div class="notif-item-time">${n.time}</div>
      </div>
    </div>`).join('');
}

// ====== HOME ======
function renderHome() {
    renderWeatherForecast();
    renderMandiMini();
    renderCommunityMini();
    renderQuickCrops();
}

function renderWeatherForecast() {
    const days = [
        { day: 'कल', icon: '⛅', temp: '26°C' },
        { day: 'परसों', icon: '🌦️', temp: '24°C' },
        { day: 'बुध', icon: '☀️', temp: '30°C' },
        { day: 'गुरु', icon: '⛅', temp: '29°C' },
    ];
    document.getElementById('weather-forecast').innerHTML = days.map(d =>
        `<div class="forecast-item"><span class="forecast-day">${d.day}</span><span class="forecast-icon">${d.icon}</span><span class="forecast-temp">${d.temp}</span></div>`
    ).join('');
}

function renderMandiMini() {
    const top = MANDI_DATA.slice(0, 3);
    document.getElementById('mandi-entries').innerHTML = top.map(m =>
        `<div class="mandi-entry"><span class="mandi-entry-crop">${m.cropHi}</span><span class="mandi-entry-price">₹${m.avg}/क्व.</span></div>`
    ).join('');
}

function renderCommunityMini() {
    document.getElementById('community-mini').innerHTML = QUESTIONS.slice(0, 3).map(q =>
        `<div class="community-mini-item"><div class="community-mini-q">${q.title}</div><div class="community-mini-meta">💬 ${q.answers} जवाब • ${q.district}</div></div>`
    ).join('');
}

function renderQuickCrops() {
    const row = document.getElementById('quick-crop-row');
    row.innerHTML = CROPS.map(c =>
        `<div class="quick-crop-chip" onclick="showPage('crop');openCropModal('${c.id}')">
      <span>${c.emoji}</span><span>${currentLang === 'en' ? c.nameEn : c.nameHi}</span>
    </div>`
    ).join('');
}

// ====== SEARCH & VOICE ======
function handleSearch() {
    const val = document.getElementById('search-input').value.toLowerCase().trim();
    if (!val) return;
    const match = CROPS.find(c => c.nameHi.includes(val) || c.nameEn.toLowerCase().includes(val));
    if (match) { showPage('crop'); setTimeout(() => openCropModal(match.id), 200); }
    else showPage('mandi');
}
document.getElementById('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('आपका ब्राउज़र वॉइस सर्च को सपोर्ट नहीं करता'); return; }
    const rec = new SpeechRecognition();
    rec.lang = currentLang === 'en' ? 'en-IN' : 'hi-IN';
    rec.onstart = () => { document.getElementById('voice-status').textContent = '🎤 सुन रहे हैं...'; document.getElementById('voice-btn').classList.add('listening'); };
    rec.onresult = e => {
        const transcript = e.results[0][0].transcript;
        document.getElementById('search-input').value = transcript;
        document.getElementById('voice-status').textContent = '';
        document.getElementById('voice-btn').classList.remove('listening');
        handleSearch();
    };
    rec.onerror = () => { document.getElementById('voice-status').textContent = ''; document.getElementById('voice-btn').classList.remove('listening'); };
    rec.start();
}

// ====== CROPS ======
function renderCrops() {
    const grid = document.getElementById('crops-grid');
    const filtered = CROPS.filter(c => {
        const matchSeason = seasonFilter === 'all' || c.season === seasonFilter;
        const nameHi = c.nameHi; const nameEn = c.nameEn;
        const matchSearch = !cropSearchVal || nameHi.includes(cropSearchVal) || nameEn.toLowerCase().includes(cropSearchVal);
        return matchSeason && matchSearch;
    });
    grid.innerHTML = filtered.length ? filtered.map(c => `
    <div class="crop-card" onclick="openCropModal('${c.id}')">
      <span class="crop-card-emoji">${c.emoji}</span>
      <span class="crop-card-name">${currentLang === 'en' ? c.nameEn : (currentLang === 'bh' ? c.nameBh : c.nameHi)}</span>
      <span class="crop-card-tag tag-${c.season}">${t(c.season)}</span>
    </div>`).join('') : '<p style="color:var(--text3);padding:20px">कोई फसल नहीं मिली</p>';
}

function filterSeason(s) {
    seasonFilter = s;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderCrops();
}

function filterCrops() {
    cropSearchVal = document.getElementById('crop-search').value.toLowerCase();
    renderCrops();
}

function openCropModal(id) {
    const c = CROPS.find(x => x.id === id);
    if (!c) return;
    const name = currentLang === 'en' ? c.nameEn : (currentLang === 'bh' ? c.nameBh : c.nameHi);
    document.getElementById('crop-detail-body').innerHTML = `
    <div class="crop-detail-header">
      <span class="crop-detail-emoji">${c.emoji}</span>
      <div class="crop-detail-name">${name}</div>
      <div class="crop-detail-subtitle">${t(c.season)} | ${c.sowMonth} → ${c.harvestMonth}</div>
    </div>
    <div class="crop-detail-tabs">
      <button class="detail-tab active" onclick="switchTab(event,'tab-season')">🗓️ मौसम</button>
      <button class="detail-tab" onclick="switchTab(event,'tab-soil')">🌱 मिट्टी</button>
      <button class="detail-tab" onclick="switchTab(event,'tab-irrigation')">💧 सिंचाई</button>
      <button class="detail-tab" onclick="switchTab(event,'tab-fertilizer')">🧪 खाद</button>
      <button class="detail-tab" onclick="switchTab(event,'tab-pests')">🐛 कीट</button>
    </div>
    <div id="tab-season" class="crop-tab-content active">
      <div class="crop-info-row"><span class="crop-info-icon">🗓️</span><div><div class="crop-info-label">मौसम</div><div class="crop-info-value">${t(c.season)}</div></div></div>
      <div class="crop-info-row"><span class="crop-info-icon">🌱</span><div><div class="crop-info-label">बुवाई</div><div class="crop-info-value">${c.sowMonth}</div></div></div>
      <div class="crop-info-row"><span class="crop-info-icon">🌾</span><div><div class="crop-info-label">कटाई</div><div class="crop-info-value">${c.harvestMonth}</div></div></div>
    </div>
    <div id="tab-soil" class="crop-tab-content">
      <div class="crop-info-row"><span class="crop-info-icon">🌍</span><div><div class="crop-info-label">मिट्टी की जरूरत</div><div class="crop-info-value">${c.soil}</div></div></div>
    </div>
    <div id="tab-irrigation" class="crop-tab-content">
      <div class="crop-info-row"><span class="crop-info-icon">💧</span><div><div class="crop-info-label">सिंचाई विधि</div><div class="crop-info-value">${c.irrigation}</div></div></div>
    </div>
    <div id="tab-fertilizer" class="crop-tab-content">
      ${c.fertilizer.map(f => `<div class="fertilizer-stage"><div class="fertilizer-stage-name">📌 ${f.stage}</div><div class="fertilizer-stage-detail">${f.detail}</div></div>`).join('')}
    </div>
    <div id="tab-pests" class="crop-tab-content">
      ${c.pests.map(p => `<div class="pest-item"><div class="pest-name">⚠️ ${p.name}</div><div class="pest-treatment">💊 ${p.treatment}</div></div>`).join('')}
    </div>
    <div class="crop-modal-actions">
      <button class="btn-primary" onclick="showToast('PDF Download शुरू हो रहा है...')">📄 गाइड PDF</button>
      <button class="btn-secondary" onclick="closeCropModalBtn();showPage('community')">❓ सवाल पूछें</button>
      <button class="whatsapp-btn" onclick="shareWhatsApp()"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> शेयर</button>
    </div>`;
    document.getElementById('crop-modal').classList.add('open');
}

function switchTab(e, tabId) {
    document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.crop-tab-content').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function closeCropModal(e) { if (e.target === document.getElementById('crop-modal')) closeCropModalBtn(); }
function closeCropModalBtn() { document.getElementById('crop-modal').classList.remove('open'); }

// ====== COMMUNITY ======
function renderCommunity() {
    populateCropFilter();
    filterQuestions();
}

function populateCropFilter() {
    const sel = document.getElementById('crop-filter');
    const qSel = document.getElementById('q-crop');
    const existing = new Set([...(sel.options)].map(o => o.value));
    CROPS.forEach(c => {
        if (!existing.has(c.id)) {
            const name = currentLang === 'en' ? c.nameEn : c.nameHi;
            sel.add(new Option(name, c.id));
            qSel.add(new Option(name, c.id));
        }
    });
}

function filterQuestions() {
    const cropVal = document.getElementById('crop-filter').value;
    const sortVal = document.getElementById('sort-filter').value;
    let list = [...allQuestions];
    if (cropVal !== 'all') list = list.filter(q => q.crop === cropVal);
    if (sortVal === 'popular') list.sort((a, b) => b.answers - a.answers);
    renderQuestionsList(list);
}

function renderQuestionsList(list) {
    document.getElementById('questions-list').innerHTML = list.map(q => `
    <div class="question-card" onclick="openQDetail(${q.id})">
      <div class="q-card-title">${q.title}</div>
      <div class="q-card-meta">
        <span class="q-tag">🌾 ${q.cropHi}</span>
        <span class="q-location">📍 ${q.district}</span>
        <span class="q-answers">💬 ${q.answers} जवाब</span>
      </div>
      <div class="q-card-bottom">
        <button class="upvote-btn" onclick="upvote(event,${q.id})">👍 ${q.votes}</button>
        <span style="font-size:0.8rem;color:var(--text3)">क्लिक करें →</span>
      </div>
    </div>`).join('') || '<p style="padding:20px;color:var(--text3)">कोई सवाल नहीं मिला</p>';
}

function upvote(e, id) {
    e.stopPropagation();
    const q = allQuestions.find(x => x.id === id); if (!q) return;
    const btn = e.currentTarget;
    if (btn.classList.contains('voted')) { q.votes--; btn.classList.remove('voted'); }
    else { q.votes++; btn.classList.add('voted'); }
    btn.textContent = `👍 ${q.votes}`;
}

function openQDetail(id) {
    const q = allQuestions.find(x => x.id === id); if (!q) return;
    document.getElementById('q-detail-body').innerHTML = `
    <div class="q-detail-header">
      <div class="q-detail-title">${q.title}</div>
      <div class="q-detail-meta"><span>🌾 ${q.cropHi}</span><span>📍 ${q.district}</span><span>💬 ${q.answers} जवाब</span><span>👍 ${q.votes}</span></div>
    </div>
    <div class="q-detail-body">
      <p class="q-detail-desc">${q.desc}</p>
      <div class="answers-section">
        <h3>💬 जवाब (${q.answersList.length})</h3>
        ${q.answersList.map(a => `
          <div class="answer-card ${a.expert ? 'expert' : ''}">
            ${a.expert ? '<span class="expert-badge">✅ विशेषज्ञ सत्यापित</span>' : ''}
            <p class="answer-text">${a.text}</p>
            <div class="answer-author"><span>👤 ${a.author}</span><span>🕐 ${a.time}</span></div>
          </div>`).join('')}
      </div>
    </div>`;
    document.getElementById('q-detail-modal').classList.add('open');
}

function closeQdetail(e) { if (e.target === document.getElementById('q-detail-modal')) closeQdetailBtn(); }
function closeQdetailBtn() { document.getElementById('q-detail-modal').classList.remove('open'); }

function openAskModal() { document.getElementById('ask-modal').classList.add('open'); }
function closeAskModal(e) { if (e.target === document.getElementById('ask-modal')) closeAskModalBtn(); }
function closeAskModalBtn() { document.getElementById('ask-modal').classList.remove('open'); }

function previewQImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const img = document.getElementById('q-image-preview'); img.src = ev.target.result; img.style.display = 'block'; };
    reader.readAsDataURL(file);
}

function submitQuestion(e) {
    e.preventDefault();
    const title = document.getElementById('q-title').value;
    const cropId = document.getElementById('q-crop').value;
    const district = document.getElementById('q-district').value;
    const desc = document.getElementById('q-desc').value;
    const crop = CROPS.find(c => c.id === cropId);
    const newQ = { id: Date.now(), title, crop: cropId, cropHi: crop ? crop.nameHi : cropId, district, desc, answers: 0, votes: 0, answersList: [] };
    allQuestions.unshift(newQ);
    closeAskModalBtn();
    e.target.reset();
    document.getElementById('q-image-preview').style.display = 'none';
    filterQuestions();
    showToast('✅ आपका सवाल दर्ज हो गया!', 'success');
}

// ====== MANDI ======
function renderMandiPage() {
    populateMandiCropFilter();
    updateMandiTable();
    renderPriceChart();
    populateTrendCrop();
}

function populateMandiCropFilter() {
    const sel = document.getElementById('mandi-crop');
    const asel = document.getElementById('alert-crop');
    const tsel = document.getElementById('trend-crop');
    if (sel.options.length > 1) return;
    CROPS.forEach(c => {
        const nm = currentLang === 'en' ? c.nameEn : c.nameHi;
        sel.add(new Option(nm, c.id));
        asel.add(new Option(nm, c.id));
        tsel.add(new Option(nm, c.id));
    });
}

function populateTrendCrop() {
    const tsel = document.getElementById('trend-crop');
    if (tsel.options.length === 0) CROPS.forEach(c => tsel.add(new Option(c.nameHi, c.id)));
}

function updateMandiTable() {
    const dist = document.getElementById('mandi-district').value;
    const crop = document.getElementById('mandi-crop').value;
    let data = MANDI_DATA;
    if (dist !== 'all') data = data.filter(m => m.district === dist);
    if (crop !== 'all') data = data.filter(m => m.crop === crop);
    document.getElementById('mandi-tbody').innerHTML = data.length ? data.map(m => `
    <tr>
      <td><strong>${m.mandi}</strong></td>
      <td class="price-down">₹${m.min}</td>
      <td class="price-up">₹${m.max}</td>
      <td><strong>₹${m.avg}</strong></td>
    </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text3)">कोई डेटा नहीं मिला</td></tr>';
}

function renderPriceChart() {
    const ctx = document.getElementById('price-chart');
    if (!ctx) return;
    const labels = ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'];
    const prices = [2100, 2150, 2080, 2200, 2180, 2250, 2165];
    if (priceChart) priceChart.destroy();
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'भाव (₹/क्विंटल)',
                data: prices,
                borderColor: '#2E7D32',
                backgroundColor: 'rgba(46,125,50,0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2E7D32',
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `₹${ctx.raw}/क्विंटल` } } },
            scales: { y: { beginAtZero: false, ticks: { callback: v => `₹${v}` } }, x: { grid: { display: false } } }
        }
    });
}

function updateChart() {
    const cropId = document.getElementById('trend-crop').value;
    const base = MANDI_DATA.find(m => m.crop === cropId);
    if (!base || !priceChart) return;
    const b = base.avg;
    priceChart.data.datasets[0].data = [b - 80, b - 50, b + 30, b, b + 60, b + 80, b + 20].map(v => Math.max(0, v));
    priceChart.update();
}

function openAlertModal() { document.getElementById('alert-modal').classList.add('open'); }
function closeAlertModal(e) { if (e.target === document.getElementById('alert-modal')) closeAlertModalBtn(); }
function closeAlertModalBtn() { document.getElementById('alert-modal').classList.remove('open'); }
function saveAlert(e) {
    e.preventDefault();
    closeAlertModalBtn();
    showToast('✅ भाव अलर्ट सेट हो गया!', 'success');
}

// ====== TRANSPORT ======
function populateTransportCrops() {
    const sel = document.getElementById('t-crop');
    if (sel.options.length > 1) return;
    CROPS.forEach(c => sel.add(new Option(currentLang === 'en' ? c.nameEn : c.nameHi, c.id)));
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('t-date').min = today;
    updateTracker();
}

function submitTransport(e) {
    e.preventDefault();
    const name = document.getElementById('t-name').value;
    const loc = document.getElementById('t-location').value;
    const qty = document.getElementById('t-qty').value;
    const crop = document.getElementById('t-crop');
    const cropName = crop.options[crop.selectedIndex].text;
    document.getElementById('booking-summary').textContent = `${name} | ${cropName} | ${qty} क्विंटल | ${loc}`;
    transportStep = 0;
    updateTracker();
    showToast('✅ बुकिंग दर्ज हो गई! जल्द ही संपर्क होगा।', 'success');
}

function updateTracker() {
    const steps = ['step-pending', 'step-accepted', 'step-onway', 'step-done'];
    const lines = ['line-1', 'line-2', 'line-3'];
    const texts = ['आपकी बुकिंग प्रतीक्षारत है', 'बुकिंग स्वीकार हो गई', 'ट्रक रास्ते में है!', 'डिलीवरी पूर्ण हो गई 🎉'];
    steps.forEach((id, i) => {
        const el = document.getElementById(id);
        el.classList.remove('done', 'active');
        if (i < transportStep) el.classList.add('done');
        else if (i === transportStep) el.classList.add('active');
    });
    lines.forEach((id, i) => {
        const el = document.getElementById(id);
        el.classList.toggle('filled', i < transportStep);
    });
    const pct = [0, 33, 66, 100][transportStep];
    document.getElementById('tracker-fill').style.width = pct + '%';
    document.getElementById('tracker-text').textContent = texts[transportStep];
}

// ====== DISEASE DETECTION ======
function analyzeDisease(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const preview = document.getElementById('disease-preview');
        preview.src = ev.target.result;
        preview.style.display = 'block';
        const result = document.getElementById('disease-result');
        result.style.display = 'none';
        setTimeout(() => {
            const d = DISEASES[Math.floor(Math.random() * DISEASES.length)];
            document.getElementById('disease-name').textContent = d.name;
            document.getElementById('result-icon').textContent = d.icon;
            document.getElementById('conf-fill').style.width = d.confidence + '%';
            document.getElementById('conf-pct').textContent = d.confidence + '%';
            document.getElementById('treatment-list').innerHTML = d.treatments.map(t => `<li>${t}</li>`).join('');
            result.style.display = 'flex';
        }, 1800);
        showToast('🔬 विश्लेषण हो रहा है...');
    };
    reader.readAsDataURL(file);
}

// ====== WHATSAPP SHARE ======
function shareWhatsApp() {
    const msg = encodeURIComponent('🌾 AgroMitra – किसानों का डिजिटल साथी\nफसल जानकारी, मंडी भाव, विशेषज्ञ सलाह और परिवहन सहायता – सब एक जगह!\nआज ही जुड़ें: https://agromitra.in');
    window.open('https://wa.me/?text=' + msg, '_blank');
}

// ====== TOAST ======
function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ====== WEATHER DETAIL ======
function showWeatherDetail() {
    showToast('☀️ वाराणसी – 28°C | नमी 65% | हवा 12 km/h | कल बारिश 20%');
}

// ====== INIT ======
function init() {
    renderNotifications();
    renderHome();
    applyTranslations();
}

document.addEventListener('DOMContentLoaded', init);
