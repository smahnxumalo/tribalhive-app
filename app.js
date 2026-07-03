/* ============================================================
   TRIBALHIVE — app.js (v2 final)
   Navigation · Language Detection · Map · Onboarding Chat
   Resource Explorer · Project Story · Profile · Challenges
   CIP Rewards · Animations
   ============================================================ */

const App = (() => {

  /* ──────────────────────────────────────────────────────────
     STATE
  ────────────────────────────────────────────────────────── */
  let currentTab   = 'home';
  let obStep       = 0;
  let obLang       = 'english';
  let obProfile    = {};
  let cipTotal     = 750;
  let mapReady     = false;
  let activeCat    = null;
  let mapScale     = 1;
  let mapTx        = 0;
  let mapTy        = 0;
  let mapDragging  = false;
  let mapStartX, mapStartY, mapStartTx, mapStartTy;
  let lastPinchDist = 0;

  /* ──────────────────────────────────────────────────────────
     LANGUAGE DETECTION — surname → language
  ────────────────────────────────────────────────────────── */
  const SURNAMES = {
    zulu:   ['nxumalo','zulu','dlamini','mkhize','buthelezi','cele','ntuli',
             'ndlovu','gumede','sithole','mthembu','shabalala','mchunu',
             'ntanzi','luthuli','ngema','dube','radebe','mthethwa','majola',
             'khumalo','zungu','mkhwanazi','ngcobo','bhengu','mthiyane'],
    tsonga: ['marivate','maluleke','baloyi','chauke','ngobeni','nkuna',
             'khosa','mabunda','manganyi','mathevula','nkondo','bila',
             'mabaso','hlungwani','rikhotso','shihlomule'],
    pedi:   ['morolong','modise','molefe','mokgosi','kgosi','matlala',
             'ramokgopa','mogashoa','ramphele','mokgophi','lekganyane',
             'motsepe','mahlangu','sekgobela','phaahla','mokwena']
  };

  const GREETINGS = {
    zulu:   { clan:'Ndwandwe · Zwide · Mkoni kaYasa', gold:'Sawubona {surname}!', lang:'isiZulu' },
    tsonga: { clan:'Marivate lineage · Limpopo',       gold:'Ahee {surname}!',    lang:'Xitsonga' },
    pedi:   { clan:'Morolong lineage · Limpopo',        gold:'Dumela {surname}!',  lang:'Sepedi' },
    english:{ clan:'',                                  gold:'Welcome, {name}!',   lang:'English' }
  };

  /* Onboarding questions per language */
  const OB_Q = {
    english: {
      q1: '👋 Hello!\n\nEvery family has a story. Let\'s begin with yours.\n\nWhat is your <strong>first name</strong> and <strong>birth surname</strong>?',
      q2: 'Beautiful. Where do you currently stay, and what is your home rural area or district?',
      q3: 'Now your gifts — what are your <strong>talents, skills, or passions</strong>? Which industry are they in?',
      q4: 'Last one — what is your <strong>highest level of education</strong>, and are you currently working, studying, or both?',
      done: '✅ Your profile is placed on the Community Map. Explore KZN to see where your lineage and skills connect across the province.',
      ph: ['Your name & surname...','Where you stay...','Your talents...','Education & work...']
    },
    zulu: {
      q1: '👋 Sawubona!\n\nUmuntu ngumuntu ngabantu. Masiqale indaba yakho.\n\nUngubani <strong>igama lakho</strong> nesibongo sakho?',
      q2: 'Ngiyabonga. Uhlala kuphi manje, futhi ikuphi ikhaya lakho lasemakhaya?',
      q3: 'Yebo. Zini <strong>iziphiwo zakho</strong>, amakhono, noma izinto ozithandayo?',
      q4: 'Kulungile. Umfundo wakho uphakeme kangakanani, futhi usebenza noma ufunda manje?',
      done: '✅ Iphrofayili yakho isekelwe ku-Community Map. Hamba ubuye ubone ukuthi uzalo lwakho luxhumana kanjani ezikhungweni ze-KZN.',
      ph: ['Igama lakho...','Lapho uhlala khona...','Iziphiwo zakho...','Umfundo nesebenzo...']
    },
    tsonga: {
      q1: '👋 Ahee!\n\nMunhu i munhu hi vanhu. A hi taka na ndaba ya wena.\n\nU biwa <strong>vito</strong> ra yini na xivongo xa wena?',
      q2: 'Siyabonga. U tsama kwihi sweswi, naswona ndhawu ya khale ya n\'wina i yihi?',
      q3: 'Ndza khensa. <strong>Tinhlengo ta wena</strong> i tihi, na sekitara ya wena?',
      q4: 'Kahle kahle. Dyondzo ya wena ya le henhla i yihi, naswona u tirha kumbe u dyondza?',
      done: '✅ Pfayili ya wena yi tshama eka Community Map. Famba u vona leswi xaka ra wena ri hlanganaka na tinxaka ta talent eTiZweni.',
      ph: ['Vito na xivongo...','U tsama kwihi...','Tinhlengo ta wena...','Dyondzo na ntirho...']
    },
    pedi: {
      q1: '👋 Dumela!\n\nMotho ke motho ka batho. A re thomeng le kanegelo ya gago.\n\n<strong>Leina</strong> la gago ke mang le sefane sa gago ke sefe?',
      q2: 'Re a leboga. O dula kae bjale, le gae ya gago ya motse ke kae?',
      q3: 'Go siame. <strong>Ditalente tša gago</strong> ke dife, le lekala leo o šomago go lona?',
      q4: 'Lokile. Thuto ya gago ye e phagamego ke efe, le gomme o šoma, o ithuta, goba ke tše pedi?',
      done: '✅ Porofaele ya gago e begilwe go Community Map. Sepela o bone gore losika lwa gago le ditalente di hlagantšha bjang go KZN.',
      ph: ['Leina le sefane...','O dula kae...','Ditalente tša gago...','Thuto le šomo...']
    }
  };

  function detectLang(surname) {
    const s = surname.toLowerCase().trim();
    for (const [lang, names] of Object.entries(SURNAMES)) {
      if (names.some(n => s.includes(n) || n.includes(s))) return lang;
    }
    return 'english';
  }

  /* ──────────────────────────────────────────────────────────
     MAP DATA — KZN nodes
  ────────────────────────────────────────────────────────── */
  const MY_CLANS = ['Nxumalo', 'Ndwandwe', 'Zwide'];

  const CATEGORIES = [
    { id:'spt', label:'⚽ Sport & Athletics',  pct:20, color:'#4ab8e8', warn:false },
    { id:'agr', label:'🌾 Agriculture',         pct:18, color:'#a8e84a', warn:false },
    { id:'art', label:'🎨 Arts & Culture',      pct:16, color:'#4ae8a0', warn:false },
    { id:'edu', label:'📚 Education',           pct:14, color:'#4ae8a0', warn:false },
    { id:'eng', label:'⚙️ Engineering',         pct:12, color:'#4ae8a0', warn:false },
    { id:'fin', label:'💰 Finance',             pct:9,  color:'#4ae8a0', warn:false },
    { id:'tch', label:'💻 Technology',          pct:8,  color:'#d4a017', warn:true  },
    { id:'hlt', label:'🏥 Healthcare',          pct:5,  color:'#e84a4a', warn:true  },
  ];

  const NODES = [
    { id:'nongoma',  city:'Nongoma',        district:'Zululand',        x:200,y:115,
      pct:{spt:22,agr:28,art:20,edu:14,eng:10,fin:5, tch:7, hlt:4},
      clans:{spt:['Nxumalo','Zulu','Buthelezi'],agr:['Nxumalo','Ntuli'],art:['Nxumalo','Buthelezi'],edu:['Nxumalo','Dlamini'],eng:['Nxumalo'],fin:['Nxumalo'],tch:['Nxumalo'],hlt:['Mkhize']} },
    { id:'durban',   city:'Durban',          district:'eThekwini',       x:315,y:300,
      pct:{spt:31,agr:8, art:28,edu:26,eng:22,fin:30,tch:24,hlt:18},
      clans:{spt:['Gumede','Mthembu','Nxumalo'],agr:['Mkhize'],art:['Cele','Gumede','Nxumalo'],edu:['Dlamini','Mchunu'],eng:['Gumede','Nxumalo'],fin:['Gumede'],tch:['Gumede','Nxumalo'],hlt:['Mkhize','Gumede']} },
    { id:'pmb',      city:'Pietermaritzburg',district:'uMgungundlovu',   x:222,y:308,
      pct:{spt:18,agr:12,art:14,edu:22,eng:16,fin:14,tch:12,hlt:10},
      clans:{spt:['Mthembu','Ndlovu'],agr:['Ntuli','Mkhize'],art:['Shabalala'],edu:['Mchunu','Nxumalo'],eng:['Majola'],fin:['Dlamini'],tch:['Dlamini'],hlt:['Mkhize']} },
    { id:'richards', city:'Richards Bay',    district:'King Cetshwayo',  x:355,y:195,
      pct:{spt:18,agr:10,art:9, edu:12,eng:20,fin:10,tch:9, hlt:6},
      clans:{spt:['Gumede','Ndlovu'],agr:['Zulu','Mkhize'],art:['Ntanzi'],edu:['Mthethwa'],eng:['Mthethwa','Ntanzi'],fin:['Gumede'],tch:['Mthethwa'],hlt:['Mkhize']} },
    { id:'ladysmith',city:'Ladysmith',       district:'uThukela',        x:130,y:218,
      pct:{spt:14,agr:16,art:10,edu:14,eng:11,fin:7, tch:4, hlt:5},
      clans:{spt:['Ntuli','Nxumalo'],agr:['Ntuli','Mkhize','Nxumalo'],art:['Mchunu'],edu:['Nxumalo'],eng:['Mchunu'],fin:['Dlamini'],tch:['Dlamini'],hlt:['Mkhize']} },
    { id:'ulundi',   city:'Ulundi',          district:'Zululand',        x:255,y:160,
      pct:{spt:20,agr:22,art:18,edu:14,eng:9, fin:5, tch:3, hlt:3},
      clans:{spt:['Zulu','Ndlovu','Nxumalo'],agr:['Zulu','Ntuli','Nxumalo'],art:['Zulu','Nxumalo'],edu:['Zulu','Nxumalo'],eng:['Zulu'],fin:['Zulu'],tch:['Zulu'],hlt:['Mkhize']} },
    { id:'mkuze',    city:'Mkuze',           district:'uMkhanyakude',    x:295,y:88,
      pct:{spt:12,agr:18,art:8, edu:7, eng:4, fin:3, tch:2, hlt:2},
      clans:{spt:['Ndlovu','Nxumalo'],agr:['Zulu','Ndlovu','Nxumalo'],art:['Ndlovu'],edu:['Ndlovu'],eng:['Ndlovu'],fin:['Ndlovu'],tch:['Ndlovu'],hlt:['Mkhize']} },
    { id:'vryheid',  city:'Vryheid',         district:'Zululand',        x:165,y:142,
      pct:{spt:16,agr:20,art:10,edu:11,eng:8, fin:5, tch:3, hlt:3},
      clans:{spt:['Nxumalo','Zulu','Mthethwa'],agr:['Nxumalo','Zulu','Ntuli','Mkhize'],art:['Nxumalo','Buthelezi'],edu:['Nxumalo'],eng:['Nxumalo'],fin:['Nxumalo'],tch:['Nxumalo'],hlt:['Mkhize']} },
    { id:'stanger',  city:'KwaDukuza',       district:'iLembe',          x:338,y:256,
      pct:{spt:15,agr:9, art:12,edu:11,eng:10,fin:9, tch:7, hlt:6},
      clans:{spt:['Cele','Ndlovu','Gumede'],agr:['Mkhize','Ntuli'],art:['Cele','Gumede'],edu:['Dlamini'],eng:['Gumede'],fin:['Gumede'],tch:['Gumede'],hlt:['Mkhize']} },
    { id:'portshep', city:'Port Shepstone',  district:'Ugu',             x:298,y:382,
      pct:{spt:13,agr:8, art:11,edu:10,eng:8, fin:7, tch:4, hlt:5},
      clans:{spt:['Mthembu','Cele'],agr:['Mkhize'],art:['Cele'],edu:['Mkhize'],eng:['Ntanzi'],fin:['Mkhize'],tch:['Ntanzi'],hlt:['Mkhize']} },
    { id:'kokstad',  city:'Kokstad',         district:'Harry Gwala',     x:217,y:402,
      pct:{spt:10,agr:11,art:9, edu:12,eng:7, fin:5, tch:3, hlt:5},
      clans:{spt:['Cele','Mthembu'],agr:['Mkhize','Ntuli'],art:['Mkhize'],edu:['Mkhize'],eng:['Mkhize'],fin:['Mkhize'],tch:['Mkhize'],hlt:['Mkhize']} },
  ];

  /* ──────────────────────────────────────────────────────────
     SCREEN NAVIGATION
  ────────────────────────────────────────────────────────── */
  function go(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    document.getElementById('bottom-nav').style.display = 'none';
    if (screenId === 'onboarding') _initOnboarding();
  }

  function goApp(tabId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-app').classList.add('active');
    document.getElementById('bottom-nav').style.display = 'flex';
    showTab(tabId || 'home');
  }

  /* ──────────────────────────────────────────────────────────
     TAB NAVIGATION
  ────────────────────────────────────────────────────────── */
  function showTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.bn-item').forEach(n => n.classList.remove('active'));

    const tab = document.getElementById('tab-' + id);
    if (tab) tab.classList.add('active');

    const nav = document.getElementById('bn-' + id);
    if (nav) nav.classList.add('active');

    currentTab = id;

    if (id === 'map' && !mapReady) {
      setTimeout(() => { renderMap(); initMapDrag(); mapReady = true; }, 80);
    }

    // Close resource detail when leaving explorer
    if (id !== 'resources') {
      const det = document.getElementById('res-detail');
      if (det) det.classList.remove('show');
    }
  }

  /* ──────────────────────────────────────────────────────────
     ONBOARDING — English only, short warm guide tone
  ────────────────────────────────────────────────────────── */
  function _initOnboarding() {
    obStep = 0;
    obLang = 'english';
    obProfile = {};

    const chat = document.getElementById('ob-chat');
    if (chat) chat.innerHTML = '';
    _showEl('ob-input-row', true);
    _showEl('ob-complete', false, 'flex');

    _setProgress(0, 'Step 1 of 4');
    _obAI(OB_Q.english.q1, 0);

    const inp = document.getElementById('ob-input');
    if (inp) { inp.value = ''; inp.placeholder = OB_Q.english.ph[0]; setTimeout(() => inp.focus(), 450); }
  }

  function sendOb() {
    const inp = document.getElementById('ob-input');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    _obUser(val);
    _showEl('ob-input-row', false);

    setTimeout(() => {
      _obTyping();
      setTimeout(() => {
        _removeTyping();
        _handleObStep(val);
      }, 700);
    }, 120);
  }

  function _handleObStep(val) {
    const Q = OB_Q[obLang];

    if (obStep === 0) {
      // Parse name + surname, detect language from surname
      const parts = val.trim().split(/\s+/);
      obProfile.firstName = parts[0] || val;
      obProfile.surname   = parts[parts.length - 1] || val;
      const lang = detectLang(obProfile.surname);
      obLang = lang;
      const Qn = OB_Q[lang];
      const G  = GREETINGS[lang];
      const gold = G.gold.replace('{surname}', obProfile.surname).replace('{name}', obProfile.firstName);

      _obAI(
        `<span class="ai-gold">${gold}${G.clan ? '<br>' + G.clan : ''}</span><br><br>${Qn.q2}`,
        0
      );
      _setProgress(25, 'Step 2 of 4');
      _showInputWith(OB_Q[lang].ph[1]);

    } else if (obStep === 1) {
      obProfile.location = val;
      _obAI(OB_Q[obLang].q3, 0);
      _setProgress(50, 'Step 3 of 4');
      _showInputWith(OB_Q[obLang].ph[2]);

    } else if (obStep === 2) {
      obProfile.talent = val;
      _obAI(OB_Q[obLang].q4, 0);
      _setProgress(75, 'Step 4 of 4');
      _showInputWith(OB_Q[obLang].ph[3]);

    } else if (obStep === 3) {
      obProfile.education = val;
      _obAI(OB_Q[obLang].done, 0);
      _setProgress(100, 'Complete ✓');

      setTimeout(() => {
        _showEl('ob-input-row', false);
        const nameEl = document.getElementById('ob-complete-name');
        const subEl  = document.getElementById('ob-complete-sub');
        if (nameEl) nameEl.textContent = `${obProfile.firstName} ${obProfile.surname}`;
        if (subEl)  subEl.textContent  = `${obProfile.surname}${obProfile.location ? ' · ' + obProfile.location : ''}${obProfile.talent ? ' · ' + obProfile.talent : ''}`;
        const comp = document.getElementById('ob-complete');
        if (comp) { comp.style.display = 'flex'; comp.style.flexDirection = 'column'; comp.style.alignItems = 'center'; }
      }, 800);
      obStep++;
      return;
    }

    obStep++;
  }

  function _showInputWith(placeholder) {
    const row = document.getElementById('ob-input-row');
    const inp = document.getElementById('ob-input');
    if (row) row.style.display = 'flex';
    if (inp) { inp.placeholder = placeholder; inp.value = ''; setTimeout(() => inp.focus(), 200); }
  }

  function _setProgress(pct, label) {
    const fill = document.getElementById('ob-prog-fill');
    const lbl  = document.getElementById('ob-step-lbl');
    if (fill) fill.style.width = pct + '%';
    if (lbl)  lbl.textContent = label;
  }

  function _obAI(html, delay) {
    setTimeout(() => {
      const chat = document.getElementById('ob-chat');
      if (!chat) return;
      const div = document.createElement('div');
      div.className = 'ai-bubble';
      div.innerHTML = `<div class="ai-label">⬡ Hive AI</div><div class="ai-text">${html.replace(/\n/g,'<br>')}</div>`;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }, delay);
  }

  function _obUser(text) {
    const chat = document.getElementById('ob-chat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = 'user-bubble';
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function _obTyping() {
    const chat = document.getElementById('ob-chat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = 'typing-bubble';
    div.id = 'ob-typing';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function _removeTyping() {
    const t = document.getElementById('ob-typing');
    if (t) t.remove();
  }

  /* ──────────────────────────────────────────────────────────
     HOME — HIVE AI MINI CHAT
  ────────────────────────────────────────────────────────── */
  const HOME_REPLIES = {
    'Show my Nxumalo clan on the map':
      'Your <strong>Nxumalo</strong> clan connects to 6 talent nodes across KZN — Nongoma, Vryheid, Ulundi, Durban, Ladysmith and Mkuze. Taking you to the map now...',
    'What is KZN producing most?':
      'KZN\'s top talent is <strong>Sport & Athletics at 20%</strong>, followed by Agriculture at 18%. Healthcare sits critically low at 5% — a major development gap.',
    'New projects in KZN':
      'There are <strong>4 active projects</strong> in KZN right now. The Rural School Infrastructure Programme in Nkandla (R350m) has an open community poll — your voice is needed!',
  };

  function homeAsk(question) {
    const area = document.getElementById('home-chat');
    if (!area) return;

    // User bubble
    const ub = document.createElement('div');
    ub.className = 'user-bubble';
    ub.textContent = question;
    area.appendChild(ub);

    // Typing
    const typing = document.createElement('div');
    typing.className = 'typing-bubble';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    area.appendChild(typing);
    area.scrollIntoView({ behavior:'smooth', block:'end' });

    setTimeout(() => {
      typing.remove();
      const ab = document.createElement('div');
      ab.className = 'ai-bubble';
      const reply = HOME_REPLIES[question] ||
        'Great question about KZN\'s development. Based on the current talent data, I can see several relevant patterns. Would you like me to filter the Community Map to show you directly?';
      ab.innerHTML = `<div class="ai-label">⬡ Hive AI</div><div class="ai-text">${reply}</div>`;
      area.appendChild(ab);
      area.scrollIntoView({ behavior:'smooth', block:'end' });

      if (question.toLowerCase().includes('map') || question.toLowerCase().includes('clan')) {
        setTimeout(() => showTab('map'), 1400);
      }
      if (question.toLowerCase().includes('project')) {
        setTimeout(() => showTab('story'), 1400);
      }
    }, 900);
  }

  function sendHome() {
    const inp = document.getElementById('home-input');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    homeAsk(val);
  }

  /* ──────────────────────────────────────────────────────────
     COMMUNITY MAP — SVG intelligence map
  ────────────────────────────────────────────────────────── */
  function renderMap(catId) {
    activeCat = catId || 'spt'; // default: sport

    const layerH = document.getElementById('layer-halos');
    const layerP = document.getElementById('layer-pulse');
    const layerN = document.getElementById('layer-nodes');
    const layerL = document.getElementById('layer-labels');
    if (!layerN) return;

    [layerH, layerP, layerN, layerL].forEach(l => { if(l) l.innerHTML = ''; });

    const cat    = CATEGORIES.find(c => c.id === activeCat);
    const color  = (cat && cat.color) || '#4ab8e8';
    const vals   = NODES.map(n => n.pct[activeCat] || 0);
    const maxVal = Math.max(...vals);

    NODES.forEach((n, i) => {
      const val    = n.pct[activeCat] || 0;
      const ratio  = maxVal > 0 ? val / maxVal : 0;
      const r      = 8 + ratio * 22;
      const op     = 0.4 + ratio * 0.58;
      const clans  = n.clans[activeCat] || [];
      const isMine = clans.some(c => MY_CLANS.includes(c));

      // Halo rings for user's clans
      if (isMine) {
        [r + 16, r + 10].forEach((extra, hi) => {
          const h = _svgEl('circle');
          h.setAttribute('cx', n.x); h.setAttribute('cy', n.y); h.setAttribute('r', extra);
          h.setAttribute('fill','none'); h.setAttribute('stroke', color);
          h.setAttribute('stroke-width', hi === 0 ? '1' : '1.5');
          h.setAttribute('opacity', hi === 0 ? '0.1' : '0.2');
          layerH.appendChild(h);
        });
      }

      // Pulse ring
      const pulse = _svgEl('circle');
      pulse.setAttribute('cx', n.x); pulse.setAttribute('cy', n.y); pulse.setAttribute('r', r + 5);
      pulse.setAttribute('fill','none'); pulse.setAttribute('stroke', color);
      pulse.setAttribute('stroke-width','1'); pulse.setAttribute('opacity', isMine ? '0.22' : '0.08');
      layerP.appendChild(pulse);

      // Main node — animated entrance
      const circle = _svgEl('circle');
      circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y); circle.setAttribute('r', r);
      circle.setAttribute('fill', color); circle.setAttribute('opacity', op);
      circle.setAttribute('filter', op > 0.65 ? 'url(#glow-lg)' : 'url(#glow-sm)');
      circle.setAttribute('cursor', 'pointer');
      circle.style.transition = 'r .3s ease, opacity .3s ease';
      circle.setAttribute('data-node-id', n.id);

      // Touch / click → bottom sheet
      circle.addEventListener('click', () => openNodeSheet(n, clans, val, cat));
      circle.addEventListener('touchend', (e) => { e.preventDefault(); openNodeSheet(n, clans, val, cat); });

      // Desktop hover → tooltip
      circle.addEventListener('mouseenter', (ev) => _showTooltip(ev, n, clans, val));
      circle.addEventListener('mouseleave', _hideTooltip);

      layerN.appendChild(circle);

      // Pct text inside large nodes
      if (r > 13) {
        const t = _svgEl('text');
        t.setAttribute('x', n.x); t.setAttribute('y', n.y + 4);
        t.setAttribute('text-anchor','middle'); t.setAttribute('font-size', Math.max(7, r * 0.42));
        t.setAttribute('fill','#060e0a'); t.setAttribute('font-weight','800');
        t.setAttribute('font-family','system-ui,sans-serif'); t.setAttribute('pointer-events','none');
        t.textContent = val + '%';
        layerN.appendChild(t);
      }

      // City label
      const lbl = _svgEl('text');
      lbl.setAttribute('x', n.x); lbl.setAttribute('y', n.y + r + 12);
      lbl.setAttribute('text-anchor','middle');
      lbl.setAttribute('font-size', isMine ? '9.5' : '8');
      lbl.setAttribute('fill', isMine ? color : 'rgba(74,184,232,0.42)');
      lbl.setAttribute('font-weight', isMine ? '700' : '400');
      lbl.setAttribute('font-family','system-ui,sans-serif');
      lbl.setAttribute('pointer-events','none');
      lbl.textContent = n.city + (isMine ? ' 🔗' : '');
      layerL.appendChild(lbl);

      // Stagger entrance animation via opacity
      circle.style.opacity = '0';
      setTimeout(() => { circle.style.opacity = op; }, 40 + i * 28);
    });

    // Update HUD
    const hudTitle = document.getElementById('map-hud-title');
    const hudSub   = document.getElementById('map-hud-sub');
    const mapPill  = document.getElementById('map-pill-cat');
    if (cat) {
      if (hudTitle) hudTitle.textContent = cat.label + ' · KZN';
      if (hudSub)   hudSub.textContent   = 'Tap a node for clan detail';
      if (mapPill)  mapPill.textContent  = cat.label + ' ▾';
    }
  }

  function _svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function _showTooltip(ev, n, clans, val) {
    const tt     = document.getElementById('map-tooltip');
    const canvas = document.getElementById('map-canvas');
    if (!tt || !canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const isMine = clans.some(c => MY_CLANS.includes(c));

    document.getElementById('tt-district').textContent = n.district;
    document.getElementById('tt-city').textContent     = n.city;
    document.getElementById('tt-pct').textContent      = val + '%';
    document.getElementById('tt-clan').textContent     = clans[0] || '—';
    document.getElementById('tt-mine').style.display   = isMine ? 'block' : 'none';

    let x = ev.clientX - rect.left + 14;
    let y = ev.clientY - rect.top - 20;
    if (x + 185 > rect.width) x = ev.clientX - rect.left - 200;
    if (y < 0) y = 10;

    tt.style.left = x + 'px';
    tt.style.top  = y + 'px';
    tt.style.display = 'block';
  }

  function _hideTooltip() {
    const tt = document.getElementById('map-tooltip');
    if (tt) tt.style.display = 'none';
  }

  /* Node bottom sheet */
  function openNodeSheet(n, clans, val, cat) {
    _hideTooltip();
    const isMine = clans.some(c => MY_CLANS.includes(c));
    const catName = cat ? cat.label : '';
    const color   = cat ? cat.color : '#4ab8e8';

    const chipsHtml = clans.map(cl => {
      const mine = MY_CLANS.includes(cl);
      return `<button class="chip ${mine ? 'chip-active' : ''}" style="margin:3px">${cl}${mine ? ' 🔗' : ''}</button>`;
    }).join('');

    document.getElementById('bs-body').innerHTML = `
      <div style="font-size:10px;color:var(--text4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${n.district}${catName ? ' · ' + catName : ''}</div>
      <div style="font-size:20px;font-weight:900;color:var(--text);margin-bottom:4px">${n.city}</div>
      <div style="font-size:32px;font-weight:900;color:${color};margin-bottom:10px;text-shadow:0 0 18px ${color}44">${val}%</div>
      <div style="font-size:11px;color:var(--text4);font-weight:700;margin-bottom:7px">Clan surnames found here</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:13px">${chipsHtml}</div>
      ${isMine ? `<div style="background:rgba(74,232,160,.08);border:1px solid var(--brd-g);border-radius:9px;padding:9px 12px;font-size:11px;color:var(--green);margin-bottom:10px">🔗 Your Nxumalo lineage connects to ${n.city}. Tap "Show my clan" on Home to highlight the full network.</div>` : ''}
      <div style="background:var(--bg2);border:1px solid var(--brd);border-radius:9px;padding:10px 12px;font-size:12px;color:var(--text2);line-height:1.55;margin-bottom:13px">
        <span style="font-size:10px;font-weight:700;color:var(--green);display:block;margin-bottom:4px">💡 Hive AI</span>
        ${isMine ? `Your Nxumalo lineage has <strong>${val}% ${catName.replace(/[⚽🌾🎨📚⚙️💰💻🏥]\s*/,'')}</strong> representation in ${n.city}. A mentorship connection with nearby nodes may strengthen this cluster.` : `The ${clans[0] || ''} clan shows strong talent in ${n.city}. This node contributes <strong>${val}%</strong> of KZN\'s ${catName.replace(/[⚽🌾🎨📚⚙️💰💻🏥]\s*/,'')} talent.`}
      </div>
      <button class="btn-primary" onclick="App.claimCIP(this,20);this.textContent='✓ Claimed!';this.disabled=true" style="margin-bottom:6px">+ 20 CIP for exploring this node</button>
    `;
    openSheet();
  }

  /* Map filters via sheet */
  function openMapFilter(type) {
    const body = document.getElementById('bs-body');
    if (!body) return;

    if (type === 'industry') {
      body.innerHTML = `
        <h3 style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:14px">Select Industry</h3>
        ${CATEGORIES.map(c => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--brd);cursor:pointer"
               onclick="App.selectCategory('${c.id}');App.closeSheet()">
            <span style="font-size:13px;color:var(--text2)">${c.label}</span>
            <span style="font-size:13px;font-weight:700;color:${c.color}">${c.pct}%${c.warn ? ' ⚠' : ''}</span>
          </div>`).join('')}
      `;
    } else if (type === 'province') {
      const provs = ['KwaZulu-Natal','Gauteng','Limpopo','Western Cape','Eastern Cape','Northern Cape','North West','Free State','Mpumalanga'];
      body.innerHTML = `
        <h3 style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:14px">Select Province</h3>
        ${provs.map(p => `
          <div style="padding:13px 0;border-bottom:1px solid var(--brd);font-size:14px;cursor:pointer;color:${p==='KwaZulu-Natal'?'var(--green)':'var(--text2)'}"
               onclick="App.closeSheet()">${p}${p==='KwaZulu-Natal'?' ✓':''}</div>`).join('')}
      `;
    } else if (type === 'clan') {
      body.innerHTML = `
        <h3 style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:5px">Your Clan Network 🔗</h3>
        <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Nxumalo · Ndwandwe · Zwide — Ndwandwe Kingdom lineage</p>
        ${NODES.filter(n => (n.clans[activeCat]||[]).some(c=>MY_CLANS.includes(c))).map(n => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--brd)">
            <span style="font-size:13px;color:var(--text2)">📍 ${n.city}</span>
            <span style="font-size:12px;color:var(--green);font-weight:700">${n.pct[activeCat]||0}%</span>
          </div>`).join('')}
      `;
    } else if (type === 'subcat') {
      const cat = CATEGORIES.find(c => c.id === activeCat);
      const subs = { spt:['⚽ Soccer 35%','🏃 Athletics 22%','🥊 Boxing 18%','🏉 Rugby 14%','🏊 Swimming 11%'],
                     agr:['🌾 Sugarcane Farming','🐄 Livestock','🌽 Crop Farming','🪵 Forestry','🐟 Aquaculture'],
                     art:['🎵 Maskandi Music','🖼️ Visual Arts','💃 Dance','🎭 Theatre','🧵 Craft'],
                     edu:['👩‍🏫 Teaching','🔬 Research','🎓 Early Childhood','📋 Curriculum Design'],
                     eng:['⚡ Electrical','🏗️ Civil','⚙️ Mechanical','💻 Software'],
                     fin:['📊 Accounting','💹 Investment','🏪 Entrepreneurship'],
                     tch:['💻 Software Dev','🎨 UI/UX Design','📊 Data Science'],
                     hlt:['🩺 Medicine','💊 Nursing','🌿 Traditional Healing'] }[activeCat] || [];
      body.innerHTML = `
        <h3 style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:14px">${cat ? cat.label : ''} · Subcategories</h3>
        <div style="display:flex;gap:7px;flex-wrap:wrap">${subs.map(s=>`<button class="chip" onclick="App.closeSheet()" style="margin:2px">${s}</button>`).join('')}</div>
      `;
    }

    openSheet();
  }

  function selectCategory(catId) {
    activeCat = catId;
    renderMap(catId);
  }

  /* Map pan + pinch zoom */
  function initMapDrag() {
    const canvas = document.getElementById('map-canvas');
    const svg    = document.getElementById('kzn-svg');
    if (!canvas || !svg) return;

    canvas.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'circle') return;
      mapDragging = true;
      mapStartX = e.clientX; mapStartY = e.clientY;
      mapStartTx = mapTx; mapStartTy = mapTy;
    });

    window.addEventListener('mouseup', () => mapDragging = false);

    window.addEventListener('mousemove', (e) => {
      if (!mapDragging) return;
      mapTx = mapStartTx + (e.clientX - mapStartX);
      mapTy = mapStartTy + (e.clientY - mapStartY);
      _applyTransform();
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      mapScale = Math.min(4, Math.max(0.4, mapScale * (e.deltaY > 0 ? 0.88 : 1.14)));
      _applyTransform();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        mapDragging = true;
        mapStartX = e.touches[0].clientX; mapStartY = e.touches[0].clientY;
        mapStartTx = mapTx; mapStartTy = mapTy;
      } else if (e.touches.length === 2) {
        lastPinchDist = _pinchDist(e);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && mapDragging) {
        mapTx = mapStartTx + (e.touches[0].clientX - mapStartX);
        mapTy = mapStartTy + (e.touches[0].clientY - mapStartY);
        _applyTransform();
      } else if (e.touches.length === 2) {
        const d = _pinchDist(e);
        if (lastPinchDist) {
          mapScale = Math.min(4, Math.max(0.4, mapScale * (d / lastPinchDist)));
          _applyTransform();
        }
        lastPinchDist = d;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => { mapDragging = false; lastPinchDist = 0; });
  }

  function _pinchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function mapZoom(factor) {
    mapScale = Math.min(4, Math.max(0.4, mapScale * factor));
    _applyTransform();
  }

  function mapReset() {
    mapScale = 1; mapTx = 0; mapTy = 0;
    _applyTransform();
  }

  function _applyTransform() {
    const svg = document.getElementById('kzn-svg');
    if (svg) {
      svg.style.transform = `translate(${mapTx}px,${mapTy}px) scale(${mapScale})`;
      svg.style.transformOrigin = 'center center';
      svg.style.transition = 'transform .05s';
    }
  }

  /* ──────────────────────────────────────────────────────────
     RESOURCE EXPLORER
  ────────────────────────────────────────────────────────── */
  function openResource(id) {
    const detail = document.getElementById('res-detail');
    if (!detail) return;
    detail.classList.add('show');
    // Scroll to detail
    setTimeout(() => detail.scrollIntoView({ behavior:'smooth', block:'start' }), 60);
    // Default to trade pane
    showIconPane('ic-trade');
  }

  function closeResDetail() {
    const detail = document.getElementById('res-detail');
    if (detail) detail.classList.remove('show');
  }

  function showIconPane(paneId) {
    document.querySelectorAll('.icon-pane').forEach(p => p.style.display = 'none');
    const target = document.getElementById(paneId);
    if (target) { target.style.display = 'block'; target.scrollIntoView({ behavior:'smooth', block:'start' }); }
  }

  function closeIconPane() {
    document.querySelectorAll('.icon-pane').forEach(p => p.style.display = 'none');
    // Show next-up card again
    const nextUp = document.querySelector('.next-up-card');
    if (nextUp) nextUp.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  /* ──────────────────────────────────────────────────────────
     CIP — count-up + particles + vibration
  ────────────────────────────────────────────────────────── */
  function claimCIP(btn, amount) {
    if (!btn || btn.classList.contains('cip-claimed') || btn.disabled) return;
    btn.textContent = 'Claimed ✓';
    btn.classList.add('cip-claimed');
    btn.disabled = true;

    cipTotal += amount;

    // Count-up animation on pill
    const pill = document.getElementById('cip-val');
    if (pill) _countUp(pill, cipTotal - amount, cipTotal, 600);

    // Also update total val on profile
    const totEl = document.getElementById('cip-total-val');
    if (totEl) _countUp(totEl, cipTotal - amount, cipTotal, 600);

    // Particles
    _burstParticles(btn, amount);

    // Haptic
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  }

  function _countUp(el, from, to, duration) {
    const start  = performance.now();
    const update = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(from + (to - from) * _ease(p));
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function _ease(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  function _burstParticles(btn, amount) {
    const rect    = btn.getBoundingClientRect();
    const cx      = rect.left + rect.width / 2;
    const cy      = rect.top  + rect.height / 2;
    const burst   = document.createElement('div');
    burst.className = 'cip-burst';
    burst.style.left = cx + 'px';
    burst.style.top  = cy + 'px';
    document.body.appendChild(burst);

    const emojis = ['✨','🌟','💫','⭐','🏅'];
    for (let i = 0; i < 10; i++) {
      const p   = document.createElement('div');
      p.className = 'cip-particle';
      const angle = (i / 10) * Math.PI * 2;
      const dist  = 40 + Math.random() * 60;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      p.style.animationDelay = (i * 40) + 'ms';
      p.textContent = i === 0 ? `+${amount}` : emojis[i % emojis.length];
      burst.appendChild(p);
    }

    // Floating +CIP label
    const label = document.createElement('div');
    label.style.cssText = `position:fixed;left:${cx}px;top:${cy - 20}px;font-size:18px;font-weight:900;color:#d4a017;pointer-events:none;z-index:501;animation:cipFly .9s ease forwards;--dx:0px;--dy:-60px`;
    label.textContent = `+${amount} CIP`;
    document.body.appendChild(label);

    setTimeout(() => { burst.remove(); label.remove(); }, 1100);
  }

  /* ──────────────────────────────────────────────────────────
     PROJECT STORY
  ────────────────────────────────────────────────────────── */
  function selectProject(cardEl, projectId) {
    document.querySelectorAll('.story-card').forEach(c => c.classList.remove('story-card-active'));
    if (cardEl) cardEl.classList.add('story-card-active');

    const detail = document.getElementById('story-detail');
    if (detail) {
      detail.classList.add('show');
      setTimeout(() => detail.scrollIntoView({ behavior:'smooth', block:'start' }), 60);
    }

    // Reset to History tab (first — TribalHive philosophy)
    showStorySection('history', document.querySelector('.story-tab'));
  }

  function showStorySection(id, btnEl) {
    document.querySelectorAll('.story-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.story-tab').forEach(b => b.classList.remove('story-tab-active'));

    const section = document.getElementById('ss-' + id);
    if (section) section.style.display = 'block';
    if (btnEl) btnEl.classList.add('story-tab-active');
  }

  /* ──────────────────────────────────────────────────────────
     PROFILE — sub panes
  ────────────────────────────────────────────────────────── */
  function showProfilePane(id) {
    const pp = document.getElementById('pane-profile');
    const pc = document.getElementById('pane-challenges');
    const bp = document.getElementById('sub-btn-profile');
    const bc = document.getElementById('sub-btn-challenges');

    if (id === 'profile') {
      if (pp) pp.style.display = 'block';
      if (pc) pc.style.display = 'none';
      if (bp) bp.classList.add('profile-sub-active');
      if (bc) bc.classList.remove('profile-sub-active');
    } else {
      if (pp) pp.style.display = 'none';
      if (pc) pc.style.display = 'block';
      if (bp) bp.classList.remove('profile-sub-active');
      if (bc) bc.classList.add('profile-sub-active');
    }
  }

  /* ──────────────────────────────────────────────────────────
     BOTTOM SHEET (generic)
  ────────────────────────────────────────────────────────── */
  function openSheet(type) {
    if (type) openMapFilter(type);
    document.getElementById('bottom-sheet').classList.add('open');
    document.getElementById('overlay').classList.add('show');
  }

  function closeSheet() {
    document.getElementById('bottom-sheet').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  }

  /* ──────────────────────────────────────────────────────────
     TIMER — weekly challenge countdown
  ────────────────────────────────────────────────────────── */
  function _startTimer() {
    const el = document.getElementById('timer-val');
    if (!el) return;
    let secs = 3 * 24 * 3600 + 14 * 3600;
    setInterval(() => {
      secs = Math.max(0, secs - 1);
      const d = Math.floor(secs / 86400);
      const h = Math.floor((secs % 86400) / 3600);
      const m = Math.floor((secs % 3600) / 60);
      el.textContent = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
    }, 1000);
  }

  /* ──────────────────────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────────────────────── */
  function _showEl(id, show, displayType) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show === false) { el.style.display = 'none'; }
    else { el.style.display = displayType || 'block'; }
  }

  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */
  function _init() {
    // Start on landing
    go('landing');

    // Enter key bindings
    const obInp = document.getElementById('ob-input');
    if (obInp) obInp.addEventListener('keydown', e => { if (e.key === 'Enter') sendOb(); });

    const homeInp = document.getElementById('home-input');
    if (homeInp) homeInp.addEventListener('keydown', e => { if (e.key === 'Enter') sendHome(); });

    // Animate progress bars on first render
    setTimeout(() => {
      document.querySelectorAll('.xp-fill-g, .xp-fill-gold, .dist-fill, .poll-fill').forEach(el => {
        const w = el.style.width;
        el.style.width = '0%';
        requestAnimationFrame(() => { el.style.width = w; });
      });
    }, 250);

    // Default map category
    activeCat = 'spt';

    // Start timer
    _startTimer();

    // Default story section → History first
    const firstStoryTab = document.querySelector('.story-tab');
    if (firstStoryTab) firstStoryTab.classList.add('story-tab-active');
    const histSection = document.getElementById('ss-history');
    if (histSection) histSection.style.display = 'block';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  /* ──────────────────────────────────────────────────────────
     PUBLIC API
  ────────────────────────────────────────────────────────── */
  return {
    go, goApp,
    showTab,
    sendOb, sendHome, homeAsk,
    openSheet, closeSheet,
    openMapFilter,
    selectCategory,
    mapZoom, mapReset,
    openResource, closeResDetail,
    showIconPane, closeIconPane,
    claimCIP,
    showStorySection, selectProject,
    showProfilePane,
    openNodeSheet,
  };

})();
