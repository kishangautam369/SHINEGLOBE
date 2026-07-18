/* ===========================================================
   SHINE GLOBE ADMIN — Core Script
   =========================================================== */
const ADMIN = (() => {
  const inRoot = !location.pathname.includes('/admin/');
  const base = ''; // admin pages always link relatively within /admin/
  const API_BASE = '../api';

  function store(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; } }
  function setStore(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  function requireAuth(){
    if(!sessionStorage.getItem('sg_admin_auth') && !location.pathname.endsWith('login.html')){
      window.location.href = 'login.html';
    }
  }

  /* Browser storage is only a UI cache. The shared server is the source of truth. */
  async function loadCollection(name){
    const res = await fetch(`${API_BASE}/${name}`, { cache:'no-store' });
    if(!res.ok) throw new Error(`GET /api/${name} failed (${res.status})`);
    const data = await res.json();
    setStore(`admin_${name}`, data);
    console.info(`[sync] Admin loaded ${name}: ${Array.isArray(data) ? data.length : 'settings'} record(s).`);
    return data;
  }

  async function saveCollection(name, data){
    const res = await fetch(`${API_BASE}/${name}`, { method:'PUT', headers:{'Content-Type':'application/json'}, cache:'no-store', body:JSON.stringify(data) });
    if(!res.ok) throw new Error(`PUT /api/${name} failed (${res.status})`);
    const saved = await res.json();
    setStore(`admin_${name}`, saved);
    console.info(`[sync] Admin saved ${name}: ${Array.isArray(saved) ? saved.length : 'settings'} record(s).`);
    return saved;
  }

  async function seedData(){
    try {
      await Promise.all(['products','categories','orders','customers'].map(loadCollection));
    } catch(error) {
      console.error('[sync] Cannot reach the shared API. Start server.js; local data will not synchronize.', error);
      throw error;
    }
  }

  const NAV = [
    { section:'Overview', links:[ {label:'Dashboard', icon:'fa-gauge-high', href:'dashboard.html'} ] },
    { section:'Catalog', links:[
      {label:'Products', icon:'fa-box', href:'products.html'},
      {label:'Categories', icon:'fa-layer-group', href:'categories.html'},
      {label:'Inventory', icon:'fa-warehouse', href:'inventory.html'},
      {label:'Coupons', icon:'fa-ticket', href:'coupons.html'},
      {label:'Reviews', icon:'fa-star', href:'reviews.html'},
    ]},
    { section:'Sales', links:[
      {label:'Orders', icon:'fa-receipt', href:'orders.html'},
      {label:'Customers', icon:'fa-users', href:'customers.html'},
      {label:'Analytics', icon:'fa-chart-line', href:'analytics.html'},
      {label:'Reports', icon:'fa-file-export', href:'reports.html'},
    ]},
    { section:'Content', links:[
      {label:'Banners', icon:'fa-panorama', href:'banners.html'},
      {label:'Blog', icon:'fa-newspaper', href:'blog.html'},
    ]},
    { section:'Team', links:[
      {label:'Employees', icon:'fa-user-shield', href:'employees.html'},
      {label:'Messages', icon:'fa-comments', href:'messages.html'},
      {label:'Notifications', icon:'fa-bell', href:'notifications.html'},
      {label:'Activity Logs', icon:'fa-clock-rotate-left', href:'activity-logs.html'},
    ]},
    { section:'System', links:[
      {label:'Settings', icon:'fa-gear', href:'settings.html'},
      {label:'Backup & Restore', icon:'fa-database', href:'backup.html'},
      {label:'Profile', icon:'fa-user', href:'profile.html'},
    ]},
  ];

  function renderSidebar(activeHref){
    const sidebar = document.getElementById('adminSidebar');
    if(!sidebar) return;
    let html = `<div class="side-brand"><img src="../assets/images/Shine Globe.jpeg" alt="Shine Globe logo" style="height:34px;width:auto;display:block;"><span class="side-brand-text">Shine<span class="text-primary">Globe</span> <small class="d-block" style="font-size:.6rem;color:#64748B;">ADMIN</small></span></div>`;
    NAV.forEach(group => {
      html += `<div class="side-section-label">${group.section}</div>`;
      group.links.forEach(l => {
        html += `<a href="${l.href}" class="side-link ${activeHref===l.href?'active':''}"><i class="fa-solid ${l.icon}"></i><span class="side-label">${l.label}</span></a>`;
      });
    });
    sidebar.innerHTML = html;
  }

  function renderTopbar(pageTitle){
    const top = document.getElementById('adminTopbar');
    if(!top) return;
    const admin = store('sg_admin_user', { name:'Admin User', email:'admin@shineglobe.com' });
    top.innerHTML = `
      <button class="a-icon-btn d-lg-none" id="sidebarToggleMobile"><i class="fa-solid fa-bars"></i></button>
      <button class="a-icon-btn d-none d-lg-inline-flex" id="sidebarToggle"><i class="fa-solid fa-bars"></i></button>
      <a class="btn btn-sm btn-outline-primary me-2" href="../index.html"><i class="fa-solid fa-store me-1"></i>Website</a>
      <h5 class="font-display fw-bold mb-0 d-none d-md-block">${pageTitle||''}</h5>
      <div class="a-search d-none d-md-flex ms-3">
        <i class="fa-solid fa-magnifying-glass text-muted"></i>
        <input placeholder="Search orders, products, customers...">
      </div>
      <div class="ms-auto d-flex align-items-center gap-2">
        <button class="a-icon-btn" id="adminThemeToggle"><i class="fa-solid fa-moon"></i></button>
        <button class="a-icon-btn position-relative"><i class="fa-solid fa-bell"></i><span class="position-absolute top-0 end-0 badge rounded-pill bg-danger" style="font-size:.55rem;">3</span></button>
        <div class="dropdown">
          <button class="btn btn-sm border-0 d-flex align-items-center gap-2" data-bs-toggle="dropdown">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80" class="rounded-circle" style="width:32px;height:32px;object-fit:cover;">
            <span class="d-none d-md-inline small fw-semibold">${admin.name}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="profile.html"><i class="fa-solid fa-user me-2"></i>Profile</a></li>
            <li><a class="dropdown-item" href="settings.html"><i class="fa-solid fa-gear me-2"></i>Settings</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="ADMIN.logout()"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
          </ul>
        </div>
      </div>`;
    document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('adminSidebar').classList.toggle('collapsed'));
    document.getElementById('sidebarToggleMobile')?.addEventListener('click', () => document.getElementById('adminSidebar').classList.toggle('mobile-open'));
    document.getElementById('adminThemeToggle')?.addEventListener('click', function(){
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme', next);
      this.querySelector('i').className = next==='dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      localStorage.setItem('sg_admin_theme', next);
    });
  }

  function logout(){
    sessionStorage.removeItem('sg_admin_auth');
    window.location.href = 'login.html';
  }

  function initLayout(activeHref, pageTitle){
    requireAuth();
    const theme = localStorage.getItem('sg_admin_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    renderSidebar(activeHref);
    renderTopbar(pageTitle);
    seedData().then(() => document.dispatchEvent(new Event('admin:dataReady'))).catch(() => alert('Cannot connect to the shared data server. Run "node server.js" and reload.'));
  }

  if('EventSource' in window){
    const events = new EventSource(`${API_BASE}/events`);
    events.addEventListener('update', event => {
      const { resource } = JSON.parse(event.data);
      if(['products','categories','orders','customers','settings'].includes(resource)){
        console.info(`[sync] ${resource} changed on another client; refreshing admin data.`);
        loadCollection(resource).then(() => document.dispatchEvent(new CustomEvent('admin:remoteUpdate', { detail:{resource} }))).catch(console.error);
      }
    });
  }

  return { initLayout, logout, store, setStore, loadCollection, saveCollection };
})();
