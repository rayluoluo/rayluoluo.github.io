(function($) {

 function init() {
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $window = $(window);
    var $document = $(document);

    /* Sidebar height set */
    var $sidebarStyles = $('.sidebar').attr('style') || "";
    $sidebarStyles += ' min-height: ' + $document.height() + 'px;';
    $('.sidebar').attr('style', $sidebarStyles);

    /* Secondary contact links */
    var $scontacts = $('#contact-list-secondary');
    var $contactList = $('#contact-list');

    $scontacts.hide();
    $contactList.mouseenter(function(){ $scontacts.fadeIn(); });
    $contactList.mouseleave(function(){ $scontacts.fadeOut(); });

    /**
     * Tags & categories tab activation based on hash value. If hash is undefined then first tab is activated.
     */
    function activateTab() {
      if(['/tags.html', '/categories.html'].indexOf(window.location.pathname) > -1) {
        var hash = window.location.hash;
        if(hash)
          $('.tab-pane').length && $('a[href="' + hash + '"]').tab('show');
        else
          $('.tab-pane').length && $($('.cat-tag-menu li a')[0]).tab('show');
      }
    }

    function initScrollProgress() {
      var $bar = $('#scroll-progress');
      if (!$bar.length) {
        $bar = $('<div id="scroll-progress" aria-hidden="true"></div>');
        $('body').append($bar);
      }

      function updateProgress() {
        var scrollTop = $window.scrollTop();
        var scrollHeight = $document.height() - $window.height();
        var progress = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
        $bar.css('width', progress + '%');
      }

      updateProgress();
      $window.on('scroll resize', updateProgress);
    }

    function initAnimatedBackground() {
      if (prefersReducedMotion) {
        return;
      }
      var $fx = $('#ambient-fx');
      if (!$fx.length) {
        $fx = $('<div id="ambient-fx" aria-hidden="true"><span></span><span></span><span></span></div>');
        $('body').append($fx);
      }
    }

    function initCardEnhancements() {
      var $items = $('.post-list-item');
      if (!$items.length) {
        return;
      }

      $items.each(function(index) {
        var $item = $(this);
        $item.addClass('post-card');
        $item.css('transition-delay', (index % 8) * 0.04 + 's');
      });

      if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              $(entry.target).addClass('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });

        $items.each(function(_, el) {
          observer.observe(el);
        });
      } else {
        $items.addClass('is-visible');
      }
    }

    // watch hash change and activate relevant tab
    $window.on('hashchange', activateTab);

    // initial activation
    activateTab();
    initScrollProgress();
    initAnimatedBackground();
    initCardEnhancements();
  };

  // run init on document ready
  $(document).ready(init);

})(jQuery);