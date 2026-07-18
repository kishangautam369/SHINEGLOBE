/* ===========================================================
   SHINE GLOBE — Header / Footer Partials
   Injected into #site-header / #site-footer placeholders so
   every page shares one source of truth for nav + footer.
   =========================================================== */
(function(){
  const inPages = location.pathname.includes('/pages/');
  const root = inPages ? '' : 'pages/';
  const home = inPages ? '../index.html' : 'index.html';
  const logoSrc = inPages ? '../assets/images/Shine Globe.jpeg' : 'assets/images/Shine Globe.jpeg';

  const HEADER = `
  <div id="pageLoader" class="page-loader"><div class="spinner-shine"></div></div>

  <div id="cookieConsent" class="cookie-bar">
    <div class="container-xl d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
      <p class="mb-0 small">We use cookies to improve your experience. By using Shine Globe, you agree to our
        <a href="${root}privacy.html" class="text-decoration-underline">Privacy Policy</a>.</p>
      <button class="btn btn-brand btn-sm" onclick="SG.acceptCookies()">Accept</button>
    </div>
  </div>

  <!-- Top utility bar -->
  <div class="d-none d-md-block" style="background:var(--c-secondary);color:#fff;font-size:.8rem;">
    <div class="container-xl d-flex justify-content-between py-1">
      <span><i class="fa-solid fa-truck-fast me-1"></i> Free shipping on orders over ₹25000</span>
      <span><i class="fa-solid fa-phone me-1"></i> +91 9505195369 &nbsp; | &nbsp; <i class="fa-solid fa-envelope me-1"></i> shineglobe55@gmail.com</span>
    </div>
  </div>

  <nav class="navbar-shine py-2">
    <div class="container-xl d-flex align-items-center gap-3 flex-wrap">
      <a href="${home}" class="navbar-brand-shine d-inline-flex align-items-center gap-2">
        <img src="${logoSrc}" alt="Shine Globe logo" style="height:42px;width:auto;display:block;">
        <span>Shine<span>Globe</span></span>
      </a>

      <div class="position-relative flex-grow-1 d-none d-lg-block" style="max-width:520px;">
        <div class="search-bar-shine d-flex align-items-center">
          <i class="fa-solid fa-magnifying-glass text-muted me-2"></i>
          <input type="text" class="live-search-input" placeholder="Search for products, brands and more...">
        </div>
        <div class="search-suggestions position-absolute bg-white w-100 shadow-lg rounded-3 mt-1" style="display:none; z-index:1050;"></div>
      </div>

      <div class="dropdown-mega position-relative d-none d-lg-block">
        <button class="btn btn-sm border-0 fw-semibold text-dark">Categories <i class="fa-solid fa-chevron-down small"></i></button>
        <div class="mega-menu container-xl">
          <div class="row w-100">
            <div class="col mega-col"><h6>Daily Essentials</h6>
              <a href="${root}shop.html?cat=Disposable Products">Disposable Products</a>
              <a href="${root}shop.html?cat=Cleaning Supplies">Cleaning Supplies</a>
              <a href="${root}shop.html?cat=Hygiene Products">Hygiene Products</a>
            </div>
            <div class="col mega-col"><h6>Home &amp; Health</h6>
              <a href="${root}shop.html?cat=Medical Supplies">Medical Supplies</a>
              <a href="${root}shop.html?cat=Household">Household</a>
              <a href="${root}shop.html?cat=Grocery">Grocery</a>
            </div>
            <div class="col mega-col"><h6>Business</h6>
              <a href="${root}shop.html?cat=Packaging">Packaging</a>
              <a href="${root}shop.html?cat=Office Supplies">Office Supplies</a>
              <a href="${root}categories.html">View All Categories</a>
            </div>
          </div>
        </div>
      </div>

      <div class="ms-auto d-flex align-items-center gap-2">
        <button class="nav-icon-btn theme-toggle" aria-label="Toggle dark mode"><i class="fa-solid fa-moon"></i></button>
        <a href="${root}wishlist.html" class="nav-icon-btn" aria-label="Wishlist"><i class="fa-regular fa-heart"></i><span class="badge-count wishlist-count">0</span></a>
        <a href="${root}cart.html" class="nav-icon-btn" aria-label="Cart"><i class="fa-solid fa-cart-shopping"></i><span class="badge-count cart-count">0</span></a>
        <a href="${root}login.html" class="btn btn-brand ripple d-none d-md-inline-block">Login</a>
        <button class="btn border-0 d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu"><i class="fa-solid fa-bars fa-lg"></i></button>
      </div>
    </div>
  </nav>

  <div class="offcanvas offcanvas-start" id="mobileMenu">
    <div class="offcanvas-header"><h5>Menu</h5><button class="btn-close" data-bs-dismiss="offcanvas"></button></div>
    <div class="offcanvas-body">
      <div class="search-bar-shine d-flex align-items-center mb-3">
        <i class="fa-solid fa-magnifying-glass text-muted me-2"></i>
        <input type="text" class="live-search-input" placeholder="Search products...">
      </div>
      <div class="search-suggestions mb-3" style="display:none;"></div>
      <a href="${home}" class="d-block py-2 border-bottom">Home</a>
      <a href="${root}shop.html" class="d-block py-2 border-bottom">Shop</a>
      <a href="${root}categories.html" class="d-block py-2 border-bottom">Categories</a>
      <a href="${root}about.html" class="d-block py-2 border-bottom">About</a>
      <a href="${root}contact.html" class="d-block py-2 border-bottom">Contact</a>
      <a href="${root}faq.html" class="d-block py-2 border-bottom">FAQ</a>
      <a href="${root}login.html" class="btn btn-brand w-100 mt-3">Login</a>
    </div>
  </div>

  <div class="bg-white border-bottom d-none d-lg-block">
    <div class="container-xl d-flex gap-4 py-2 small fw-semibold">
      <a href="${home}" class="text-dark">Home</a>
      <a href="${root}shop.html" class="text-dark">Shop</a>
      <a href="${root}categories.html" class="text-dark">Categories</a>
      <a href="${root}about.html" class="text-dark">About</a>
      <a href="${root}contact.html" class="text-dark">Contact</a>
      <a href="${root}faq.html" class="text-dark">FAQ</a>
    </div>
  </div>

  <!-- Quick View Modal -->
  <div class="modal fade" id="quickViewModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content" style="border-radius:var(--radius-lg);">
        <div class="modal-header border-0"><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body row g-4 px-4 pb-4">
          <div class="col-md-6"><img class="qv-image rounded-3 w-100" alt="Quick view product"></div>
          <div class="col-md-6">
            <div class="product-cat qv-cat"></div>
            <h4 class="qv-name fw-bold"></h4>
            <div class="qv-rating product-rating mb-2"></div>
            <div class="price-now qv-price fs-4"></div>
            <p class="text-muted mt-2 qv-desc"></p>
            <button class="btn btn-brand qv-addcart w-100 mb-2">Add to Cart</button>
            <a href="#" class="btn btn-outline-brand qv-link w-100">View Full Details</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Newsletter Popup -->
  <div class="modal fade" id="newsletterModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content text-center p-4" style="border-radius:var(--radius-lg);">
        <button class="btn-close ms-auto" data-bs-dismiss="modal"></button>
        <i class="fa-solid fa-envelope-open-text fa-3x text-warning mb-3"></i>
        <h4 class="fw-bold">Get 15% Off Your First Order</h4>
        <p class="text-muted">Subscribe to our newsletter for exclusive deals and updates.</p>
        <form onsubmit="event.preventDefault(); SG.toast('Subscribed successfully!'); bootstrap.Modal.getInstance(document.getElementById('newsletterModal')).hide();">
          <input type="email" required class="form-control mb-2" placeholder="Enter your email">
          <button class="btn btn-brand w-100">Subscribe &amp; Save</button>
        </form>
      </div>
    </div>
  </div>
  `;

  const FOOTER = `
  <button id="whatsappBtn" class="float-btn" aria-label="Chat on WhatsApp"><i class="fa-brands fa-whatsapp fa-lg"></i></button>
  <button id="backToTop" class="float-btn" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></button>

  <footer class="footer-shine">
    <div class="container-xl">
      <div class="row g-4">
        <div class="col-lg-3 col-md-6">
          <a href="${home}" class="navbar-brand-shine text-white d-inline-flex align-items-center gap-2 mb-2">
            <img src="${logoSrc}" alt="Shine Globe logo" style="height:42px;width:auto;display:block;">
            <span class="text-warning">Shine<span>Globe</span></span>
          </a>
          <p class="small">Everything you need, delivered with quality. Your trusted store for daily essentials, hygiene, household and office supplies.</p>
          <div class="d-flex gap-2 mt-3">
            <a href="#" class="social-circle"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" class="social-circle"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" class="social-circle"><i class="fa-brands fa-twitter"></i></a>
            <a href="#" class="social-circle"><i class="fa-brands fa-youtube"></i></a>
          </div>
        </div>
        <div class="col-lg-2 col-md-6">
          <h6>Shop</h6>
          <a href="${root}shop.html" class="d-block mb-2">All Products</a>
          <a href="${root}categories.html" class="d-block mb-2">Categories</a>
          <a href="${root}cart.html" class="d-block mb-2">Cart</a>
          <a href="${root}wishlist.html" class="d-block mb-2">Wishlist</a>
        </div>
        <div class="col-lg-2 col-md-6">
          <h6>Company</h6>
          <a href="${root}about.html" class="d-block mb-2">About Us</a>
          <a href="${root}contact.html" class="d-block mb-2">Contact</a>
          <a href="${root}faq.html" class="d-block mb-2">FAQ</a>
          <a href="${root}terms.html" class="d-block mb-2">Terms &amp; Conditions</a>
          <a href="${root}privacy.html" class="d-block mb-2">Privacy Policy</a>
        </div>
        <div class="col-lg-2 col-md-6">
          <h6>Account</h6>
          <a href="${root}login.html" class="d-block mb-2">Login</a>
          <a href="${root}register.html" class="d-block mb-2">Register</a>
          <a href="${root}profile.html" class="d-block mb-2">My Profile</a>
          <a href="${root}order-success.html" class="d-block mb-2">Track Order</a>
        </div>
        <div class="col-lg-3 col-md-6">
          <h6>Newsletter</h6>
          <p class="small">Get updates on new arrivals and special offers.</p>
          <form class="d-flex gap-2" onsubmit="event.preventDefault(); SG.toast('Subscribed successfully!');">
            <input type="email" required class="form-control form-control-sm" placeholder="Your email">
            <button class="btn btn-accent btn-sm">Join</button>
          </form>
        </div>
      </div>
      <div class="footer-bottom d-flex flex-wrap justify-content-between">
        <span>&copy; 2026 Shine Globe. All rights reserved.</span>
        <span class="d-flex gap-2"><i class="fa-brands fa-cc-visa fa-lg"></i><i class="fa-brands fa-cc-mastercard fa-lg"></i><i class="fa-brands fa-cc-paypal fa-lg"></i></span>
      </div>
    </div>
  </footer>
  `;

  document.addEventListener('DOMContentLoaded', () => {
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if(h) h.innerHTML = HEADER;
    if(f) f.innerHTML = FOOTER;
    if(globalThis.SG){ globalThis.SG.updateCounts(); }
    document.dispatchEvent(new Event('sg:partialsReady'));
  });
})();
