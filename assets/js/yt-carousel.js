/* Reusable Zero-FCP YouTube Click-to-Load Facade Carousel (Keyboard + A11y + Analytics) */
(function () {
  'use strict';
  if (window.__ytCarouselInit) return;
  window.__ytCarouselInit = true;

  function initCarousel(root) {
    if (!root || root.dataset.ytReady === '1') return;
    root.dataset.ytReady = '1';

    var slidesJson = root.getAttribute('data-slides') || '[]';
    var slides = [];
    try { slides = JSON.parse(slidesJson); } catch (_) { slides = []; }
    if (!slides.length) return;

    var stage = root.querySelector('[data-yt-stage]');
    var titleEl = root.querySelector('[data-yt-title]');
    var captionEl = root.querySelector('[data-yt-caption]');
    var counterEl = root.querySelector('[data-yt-counter]');
    var linkEl = root.querySelector('[data-yt-link]');
    var prevBtn = root.querySelector('[data-yt-prev]');
    var nextBtn = root.querySelector('[data-yt-next]');
    var dotBtns = Array.from(root.querySelectorAll('[data-yt-dot]'));
    var idx = 0;

    function getLang() {
      return document.documentElement.getAttribute('data-lang') || 'id';
    }

    function renderFacade(slide) {
      if (!stage || !slide) return;
      var lang = getLang();
      var title = (lang === 'en' && slide.titleEn) ? slide.titleEn : slide.titleId;
      var caption = (lang === 'en' && slide.captionEn) ? slide.captionEn : slide.captionId;
      var playLabel = (lang === 'en' ? 'Play video: ' : 'Putar video: ') + title;

      stage.innerHTML =
        '<button type="button" data-yt-play aria-label="' + playLabel.replace(/"/g, '&quot;') + '" ' +
        'class="group/play relative w-full h-full block bg-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyanCustom cursor-pointer">' +
        '<img src="https://i.ytimg.com/vi/' + slide.id + '/hqdefault.jpg" alt="' + title.replace(/"/g, '&quot;') + '" ' +
        'loading="lazy" decoding="async" width="480" height="360" class="w-full h-full object-cover opacity-90 group-hover/play:opacity-100 group-hover/play:scale-[1.02] transition-all duration-300">' +
        '<span class="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent pointer-events-none"></span>' +
        '<span class="absolute inset-0 flex items-center justify-center pointer-events-none">' +
        '<span class="w-14 h-10 sm:w-16 sm:h-11 rounded-2xl bg-red-600/95 group-hover/play:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-900/50 transition-transform duration-200 group-hover/play:scale-110 border border-white/25">' +
        '<i class="fa-solid fa-play text-base sm:text-lg ml-0.5" aria-hidden="true"></i>' +
        '</span></span>' +
        '<span class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-display font-semibold text-white/95 pointer-events-none">' +
        '<span class="px-2 py-0.5 rounded bg-slate-950/80 border border-white/15 backdrop-blur-sm">' +
        (lang === 'en' ? 'Click to Load Video' : 'Klik untuk Memuat Video') +
        '</span>' +
        '<span class="px-2 py-0.5 rounded bg-slate-950/80 border border-white/15 text-red-300">YouTube</span>' +
        '</span></button>';

      if (titleEl) titleEl.textContent = title;
      if (captionEl) captionEl.textContent = caption || '';
      if (counterEl) counterEl.textContent = (idx + 1) + '/' + slides.length;
      if (linkEl) linkEl.href = 'https://youtu.be/' + slide.id;

      dotBtns.forEach(function (btn, i) {
        var active = i === idx;
        btn.setAttribute('aria-current', active ? 'true' : 'false');
        btn.classList.toggle('bg-cyanCustom', active);
        btn.classList.toggle('w-6', active);
        btn.classList.toggle('bg-slate-600', !active);
        btn.classList.toggle('w-2.5', !active);
      });

      var playBtn = stage.querySelector('[data-yt-play]');
      if (playBtn) {
        playBtn.addEventListener('click', function () {
          var iframe = document.createElement('iframe');
          iframe.className = 'w-full h-full border-0';
          iframe.src = 'https://www.youtube.com/embed/' + slide.id + '?autoplay=1&rel=0';
          iframe.title = title;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          iframe.allowFullscreen = true;
          stage.innerHTML = '';
          stage.appendChild(iframe);
          if (typeof window.trackPortfolioEvent === 'function') {
            window.trackPortfolioEvent('youtube_facade_play', { videoId: slide.id });
          }
        });
      }
    }

    function goTo(newIdx) {
      idx = (newIdx + slides.length) % slides.length;
      renderFacade(slides[idx]);
      if (typeof window.trackPortfolioEvent === 'function') {
        window.trackPortfolioEvent('youtube_slider_change', { videoId: slides[idx].id, slideIndex: idx + 1 });
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(idx + 1); });
    dotBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = parseInt(btn.getAttribute('data-yt-dot'), 10);
        if (!isNaN(target)) goTo(target);
      });
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1); }
    });

    var obs = new MutationObserver(function () {
      if (!stage.querySelector('iframe')) renderFacade(slides[idx]);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

    renderFacade(slides[idx]);
  }

  function boot() {
    document.querySelectorAll('[data-yt-carousel]').forEach(initCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
