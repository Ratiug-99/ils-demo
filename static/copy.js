/* Click-through copy of the ILS draft: pages are static, so nothing saves. Every button that would save says so;
   the samples open the result the draft app made from them; Ask VisBo answers its suggested questions. */
(function () {
  var D = window.ILS_COPY || {pages: [], ask: {}, samples: {}};
  var pages = {};
  D.pages.forEach(function (p) { pages[p] = 1; });
  var timer;

  function toast(msg, go) {
    var t = document.getElementById('copy-toast');
    if (!t) return;
    t.innerHTML = '';
    var s = document.createElement('span');
    s.textContent = msg;
    t.appendChild(s);
    if (go) {
      var a = document.createElement('a');
      a.href = go.href;
      a.textContent = go.label;
      t.appendChild(a);
    }
    t.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(function () { t.hidden = true; }, 5000);
  }

  // the same file names as build.py: '/config?tab=parts' -> 'config--tab-parts.html'
  function fname(path, params) {
    var base = path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'dashboard';
    var q = params.filter(function (kv) { return kv[1] !== ''; }).sort(function (a, b) {
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
    });
    if (q.length) base += '--' + q.map(function (kv) { return kv[0] + '-' + kv[1]; }).join('-');
    return base.replace(/[^A-Za-z0-9._-]/g, '_') + '.html';
  }

  function words(el) {
    return ((el && (el.textContent || el.value)) || '').replace(/\s+/g, ' ').trim();
  }

  function handle(form, submitter) {
    // the person's name: the copy always works as one sample person
    if (form.classList.contains('who')) {
      var sel = form.querySelector('select');
      if (sel) sel.value = sel.querySelector('option[selected]') ? sel.querySelector('option[selected]').value : '';
      toast('Choosing your name works in the draft app. This copy works as ' + (sel ? sel.value : 'a sample person') + '.');
      return;
    }
    // a sample file: show VisBo reading it, then the result the draft app made from it
    var sample = form.querySelector('input[name=sample]');
    if (form.hasAttribute('data-vb-read') && sample) {
      var go = D.samples[sample.value];
      var vb = document.getElementById('vb-toast');
      if (vb && go) {
        vb.querySelector('span').innerHTML = '<b>VisBo is reading</b> ' + sample.value.replace(/[<>&]/g, '') + '…';
        vb.hidden = false;
        setTimeout(function () { location.href = go; }, 1400);
      } else toast('This sample opens in the draft app.');
      return;
    }
    if (form.hasAttribute('data-vb-read')) {
      toast('Uploading your own file works in the draft app. In this copy, open one of the sample files.');
      return;
    }
    // a filter or a search (GET): open the page if the copy has it
    if ((form.getAttribute('method') || 'get').toLowerCase() === 'get') {
      var path = form.getAttribute('data-copy-path') || (document.querySelector('meta[name=copy-path]') || {}).content || '/';
      var params = [];
      new FormData(form).forEach(function (v, k) { if (typeof v === 'string') params.push([k, v]); });
      if (submitter && submitter.name) params.push([submitter.name, submitter.value]);
      var f = fname(path.split('?')[0], params);
      if (pages[f]) { location.href = f; return; }
      toast('Filters and search work in the draft app. This copy has the unfiltered pages.');
      return;
    }
    var label = words(submitter) || words(form.querySelector('button[type=submit],button:not([type])')) || 'This button';
    toast('“' + label + '” saves in the draft app. Saving is off in this copy, so nothing changes here.');
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.closest && f.closest('#askp')) return; // the Ask VisBo panel: answered below
    e.preventDefault();
    e.stopImmediatePropagation();
    handle(f, e.submitter);
  }, true);

  // form.submit() (the name picker) skips the submit event: route it the same way
  HTMLFormElement.prototype.submit = function () { handle(this, null); };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-copy-off]');
    if (!a) return;
    e.preventDefault();
    if (a.getAttribute('data-copy-off') === 'edit') {
      toast('Editing is off in this copy. The same fields are on the new-record form.', {href: a.getAttribute('data-copy-go'), label: 'Open the form'});
    } else {
      toast('Downloads are off in this copy. In the draft app this gives you ' + a.getAttribute('data-copy-name') + '.');
    }
  }, true);

  // Ask VisBo: the panel asks askFetch; the copy answers the prepared questions from the same register
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  window.askFetch = function (q) {
    var hit = null;
    Object.keys(D.ask).forEach(function (k) { if (norm(k) === norm(q)) hit = D.ask[k]; });
    if (!hit) {
      var chips = (D.suggest || []).map(function (s) { return '<a class="chip plain" href="#" data-ask="' + esc(s) + '">' + esc(s) + '</a>'; }).join('');
      hit = '<article class="vb-turn"><div class="vb-q"><span>' + esc(q) + '</span></div><div class="vb-a answer">' +
        '<p class="vb-lead">This copy answers the prepared questions below. In the draft app VisBo answers any question about the register.</p>' +
        '<div class="vb-follow" aria-label="Ask next">' + chips + '</div></div></article>';
    }
    return new Promise(function (ok) { setTimeout(function () { ok(hit); }, 700); });
  };
})();
