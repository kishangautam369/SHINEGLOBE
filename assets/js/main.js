/* ===========================================================
   SHINE GLOBE — Core App Script
   Shared across all customer-facing pages.
   =========================================================== */

const SG = (() => {

  const API_BASE = '/api';
  let PRODUCTS = [];
  let CATEGORIES = [];

  /* ---------------- Storage helpers ---------------- */
  const store = {
    get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  };

  const getCart = () => store.get('sg_cart', []);
  const setCart = (c) => { store.set('sg_cart', c); updateCounts(); };
  const getWishlist = () => store.get('sg_wishlist', []);
  const setWishlist = (w) => { store.set('sg_wishlist', w); updateCounts(); };

  function getCurrentUser(){ return store.get('sg_user', null); }
  function isLoggedIn(){ return !!getCurrentUser(); }
  function login(email, password, remember = false){
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if(!cleanEmail || !cleanPassword){
      toast('Please enter both your email and password.', 'error');
      return false;
    }

    const displayName = cleanEmail.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());

    const user = {
      name: displayName || 'Shine Globe Customer',
      email: cleanEmail,
      remember: !!remember,
      lastLogin: new Date().toISOString()
    };

    store.set('sg_user', user);
    if(remember){ localStorage.setItem('sg_remember_me', '1'); }
    else { localStorage.removeItem('sg_remember_me'); }

    return true;
  }
  function loginWithGoogle(email = '', name = ''){
    const cleanEmail = String(email || '').trim().toLowerCase();
    if(!cleanEmail){
      toast('Google sign-in needs an email address.', 'error');
      return false;
    }

    const displayName = String(name || '').trim() || cleanEmail.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());

    const user = {
      name: displayName || 'Google User',
      email: cleanEmail,
      remember: true,
      provider: 'google',
      lastLogin: new Date().toISOString()
    };

    store.set('sg_user', user);
    localStorage.setItem('sg_remember_me', '1');
    return true;
  }
  function logout(redirectTo = 'login.html'){
    localStorage.removeItem('sg_user');
    localStorage.removeItem('sg_remember_me');
    toast('Logged out', 'info');
    setTimeout(() => window.location.href = redirectTo, 300);
  }

  function updateCounts(){
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = getCart().reduce((s,i)=>s+i.qty,0));
    document.querySelectorAll('.wishlist-count').forEach(el => el.textContent = getWishlist().length);
  }

  /* ---------------- Toast ---------------- */
  function toast(message, type = 'success'){
    const icons = { success:'fa-circle-check', error:'fa-circle-exclamation', info:'fa-circle-info' };
    const colors = { success:'#16A34A', error:'#DC2626', info:'#2563EB' };
    let wrap = document.getElementById('toastWrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'toastWrap';
      wrap.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      wrap.style.zIndex = 1300;
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast-shine toast align-items-center text-white border-0 show mb-2';
    el.style.background = colors[type];
    el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="fa-solid ${icons[type]} me-2"></i>${message}</div>
      <button class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button></div>`;
    wrap.appendChild(el);
    setTimeout(()=> el.remove(), 3500);
  }

  function getCategories(){
    if(CATEGORIES.length) return CATEGORIES.filter(c => c.active !== false);
    const names = [...new Set(PRODUCTS.map(p => p.category).filter(Boolean))];
    return names.map((name, index) => ({
      id: index + 1,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      icon: 'fa-tag',
      color: '#2563EB',
      active: true,
      featured: false,
      created: new Date().toISOString().split('T')[0]
    }));
  }

  function loadCategories(){ return CATEGORIES; }

  /* ---------------- Cart / Wishlist actions ---------------- */
  function addToCart(id, qty = 1){
    const cart = getCart();
    const existing = cart.find(i => i.id === id);
    if(existing) existing.qty += qty; else cart.push({ id, qty });
    setCart(cart);
    toast('Added to cart');
  }
  function removeFromCart(id){
    setCart(getCart().filter(i => i.id !== id));
    toast('Removed from cart', 'info');
  }
  function updateCartQty(id, qty){
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if(item){ item.qty = Math.max(1, qty); setCart(cart); }
  }
  function toggleWishlist(id){
    let wl = getWishlist();
    if(wl.includes(id)){ wl = wl.filter(i => i !== id); toast('Removed from wishlist', 'info'); }
    else { wl.push(id); toast('Added to wishlist'); }
    setWishlist(wl);
    document.querySelectorAll(`.pa-btn[data-wish="${id}"]`).forEach(b => b.classList.toggle('active', wl.includes(id)));
  }

  /* ---------------- Product helpers ---------------- */
  function findProduct(id){ return PRODUCTS.find(p => p.id === Number(id)); }

  function ratingStars(rating){
    let html = '';
    for(let i=1;i<=5;i++){
      html += `<i class="fa-star ${i <= Math.round(rating) ? 'fa-solid' : 'fa-regular'}"></i>`;
    }
    return html;
  }

  function productCard(p, basePath = ''){
    const wl = getWishlist().includes(p.id);
    const discount = p.oldPrice ? Math.round(100 - (p.price / p.oldPrice * 100)) : 0;
    return `
    <div class="product-card" data-aos="fade-up">
      ${p.badge ? `<span class="product-badge ${p.stock===0?'out':''}">${p.badge}</span>` : ''}
      <div class="product-actions">
        <button class="pa-btn ${wl?'active':''}" data-wish="${p.id}" onclick="SG.toggleWishlist(${p.id})" aria-label="Toggle wishlist" title="Wishlist"><i class="fa-solid fa-heart"></i></button>
        <button class="pa-btn" onclick="SG.quickView(${p.id})" aria-label="Quick view" title="Quick View"><i class="fa-solid fa-eye"></i></button>
        <button class="pa-btn" onclick="SG.addToCompare(${p.id})" aria-label="Compare" title="Compare"><i class="fa-solid fa-code-compare"></i></button>
      </div>
      <a href="${basePath}product.html?id=${p.id}" class="product-img-wrap d-block">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </a>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <a href="${basePath}product.html?id=${p.id}" class="product-name d-block text-dark text-decoration-none">${p.name}</a>
        <div class="product-rating mb-1">${ratingStars(p.rating)} <span class="text-muted small">(${p.reviews})</span></div>
        <div>
          <span class="price-now">₹${p.price.toFixed(2)}</span>
          ${p.oldPrice ? `<span class="price-old">₹${p.oldPrice.toFixed(2)}</span> <span class="badge bg-danger-subtle text-danger ms-1">-${discount}%</span>` : ''}
        </div>
        <div class="stock-badge ${p.stock>0?'in':'out'} mt-1">${p.stock>0? (p.stock<10?'Low stock':'In Stock') : 'Out of Stock'}</div>
        <button class="btn btn-brand add-cart-btn ripple" ${p.stock===0?'disabled':''} onclick="SG.addToCart(${p.id}); SG.ripple(event)">
          <i class="fa-solid fa-cart-plus me-1"></i> Add to Cart
        </button>
      </div>
    </div>`;
  }

  function ripple(e){
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.width = circle.style.height = d + 'px';
    circle.style.left = (e.clientX - btn.getBoundingClientRect().left - d/2) + 'px';
    circle.style.top = (e.clientY - btn.getBoundingClientRect().top - d/2) + 'px';
    circle.className = 'ripple-circle';
    btn.classList.add('ripple');
    btn.appendChild(circle);
    setTimeout(()=>circle.remove(), 600);
  }

  function quickView(id){
    const p = findProduct(id);
    if(!p) return;
    const basePath = location.pathname.includes('/pages/') ? '' : 'pages/';
    const modalEl = document.getElementById('quickViewModal');
    if(!modalEl) return;
    modalEl.querySelector('.qv-image').src = p.image;
    modalEl.querySelector('.qv-name').textContent = p.name;
    modalEl.querySelector('.qv-cat').textContent = p.category;
    modalEl.querySelector('.qv-price').textContent = '₹' + p.price.toFixed(2);
    modalEl.querySelector('.qv-desc').textContent = p.desc;
    modalEl.querySelector('.qv-rating').innerHTML = ratingStars(p.rating);
    modalEl.querySelector('.qv-addcart').onclick = () => addToCart(p.id);
    modalEl.querySelector('.qv-link').href = basePath + `product.html?id=${p.id}`;
    new bootstrap.Modal(modalEl).show();
  }

  function addToCompare(id){
    let comp = store.get('sg_compare', []);
    if(!comp.includes(id)){ comp.push(id); store.set('sg_compare', comp); toast('Added to compare'); }
    else toast('Already in compare list', 'info');
  }

  /* ---------------- Recently viewed ---------------- */
  function trackRecentlyViewed(id){
    let rv = store.get('sg_recent', []);
    rv = rv.filter(i => i !== id);
    rv.unshift(id);
    rv = rv.slice(0, 8);
    store.set('sg_recent', rv);
  }

  /* ---------------- Theme ---------------- */
  function initTheme(){
    const saved = localStorage.getItem('sg_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.querySelectorAll('.theme-toggle i').forEach(i => i.className = saved === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon');
    document.querySelectorAll('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('sg_theme', next);
      document.querySelectorAll('.theme-toggle i').forEach(i => i.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon');
    }));
  }

  /* ---------------- Back to top / loader ---------------- */
  function initUtilities(){
    const backBtn = document.getElementById('backToTop');
    if(backBtn){
      window.addEventListener('scroll', () => backBtn.classList.toggle('show', window.scrollY > 400));
      backBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    }

    const removeLoader = (loader) => {
      setTimeout(() => loader.style.opacity = 0, 200);
      setTimeout(() => loader.remove(), 700);
    };

    const attachLoaderHandler = () => {
      const loader = document.getElementById('pageLoader');
      if(!loader) return;
      window.addEventListener('load', () => removeLoader(loader));
      if(document.readyState === 'complete') removeLoader(loader);
    };

    attachLoaderHandler();
    document.addEventListener('sg:partialsReady', attachLoaderHandler);
  }

  /* ---------------- Search suggestions ---------------- */
  function initSearch(){
    document.querySelectorAll('.live-search-input').forEach(input => {
      const box = input.closest('.search-bar-shine')?.querySelector('.search-suggestions') || input.parentElement.querySelector('.search-suggestions');
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if(!box) return;
        if(q.length < 1){ box.innerHTML=''; box.style.display='none'; return; }
        const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q)).slice(0,5);
        box.innerHTML = matches.map(p => `<a href="${location.pathname.includes('/pages/')?'':'pages/'}product.html?id=${p.id}" class="d-flex align-items-center gap-2 p-2 border-bottom text-decoration-none text-dark">
          <img src="${p.image}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;"><span class="small">${p.name}</span></a>`).join('') || '<div class="p-2 small text-muted">No products found</div>';
        box.style.display = 'block';
      });
      document.addEventListener('click', (e) => { if(box && !box.contains(e.target) && e.target !== input) box.style.display = 'none'; });
    });
  }

  /* ---------------- Newsletter popup + cookie consent ---------------- */
  function initPopups(){
    if(!sessionStorage.getItem('sg_newsletter_shown')){
      setTimeout(() => {
        const modalEl = document.getElementById('newsletterModal');
        if(modalEl){ new bootstrap.Modal(modalEl).show(); sessionStorage.setItem('sg_newsletter_shown','1'); }
      }, 6000);
    }
    if(!localStorage.getItem('sg_cookie_consent')){
      const cc = document.getElementById('cookieConsent');
      if(cc) cc.classList.add('show');
    }
  }
  function acceptCookies(){
    localStorage.setItem('sg_cookie_consent','1');
    document.getElementById('cookieConsent')?.classList.remove('show');
  }

  /* ---------------- Load products & init ---------------- */
  async function loadProducts(force = false){
    if(PRODUCTS.length && !force) return PRODUCTS;

    try{
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { cache:'no-store' }),
        fetch(`${API_BASE}/categories`, { cache:'no-store' })
      ]);
      if(!productsRes.ok || !categoriesRes.ok) throw new Error('Shared API is unavailable');
      PRODUCTS = await productsRes.json();
      CATEGORIES = await categoriesRes.json();
      console.info(`[sync] Loaded ${PRODUCTS.length} products and ${CATEGORIES.length} categories from the shared API.`);
    }catch(e){
      console.error('[sync] Shared API unavailable. Catalog data was not loaded so stale browser data is never shown.', e.message);
      PRODUCTS = []; CATEGORIES = [];
    }
    return PRODUCTS;
  }

  function init(){
    initTheme();
    initUtilities();
    updateCounts();
    if(window.AOS) AOS.init({ duration: 700, once: true });
    loadProducts().then(() => {
      initSearch();
      document.dispatchEvent(new CustomEvent('sg:productsReady', { detail: PRODUCTS }));
      document.dispatchEvent(new CustomEvent('sg:categoriesReady', { detail: CATEGORIES }));
    });
    initPopups();
  }

  if('EventSource' in window){
    const events = new EventSource(`${API_BASE}/events`);
    events.addEventListener('update', async event => {
      const { resource } = JSON.parse(event.data);
      if(resource === 'products' || resource === 'categories'){
        await loadProducts(true);
        initSearch();
        document.dispatchEvent(new CustomEvent('sg:productsReady', { detail: PRODUCTS }));
        document.dispatchEvent(new CustomEvent('sg:categoriesReady', { detail: CATEGORIES }));
        console.info(`[sync] Refreshed storefront after ${resource} update.`);
      }
    });
    events.onerror = () => console.warn('[sync] Update stream disconnected; reload the page to fetch the latest catalog.');
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('sg:partialsReady', () => { initTheme(); initSearch(); updateCounts(); });

  const API = {
    getCart, setCart, getWishlist, setWishlist, addToCart, removeFromCart, updateCartQty,
    toggleWishlist, findProduct, productCard, ratingStars, quickView, addToCompare, ripple,
    trackRecentlyViewed, toast, acceptCookies, store, updateCounts, getCurrentUser, isLoggedIn,
    login, loginWithGoogle, logout, getCategories, loadCategories,
    get products(){ return PRODUCTS; }, loadProducts
  };

  window.SG = API;
  globalThis.SG = API;
  return API;
})();
