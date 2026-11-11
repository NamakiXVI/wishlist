(function () {
  var LOCAL_KEY = 'quynh-disc-wishlist';
  var LINK_KEY = 'quynh-disc-wishlist-link';
  var IMG = '../assets/wishlist/';
  var DEFAULTS = [
    { id: 'guerlain-bleu-astral', name: 'Rouge G case in Bleu Astral', detail: 'Guerlain · limited edition jewel case', img: 'guerlain-bleu-astral.jpg' },
    { id: 'guerlain-rouge-g-15', name: 'Rouge G N°15 Le Marron Glacé', detail: 'Guerlain · satin finish', img: 'guerlain-rouge-g-15.jpg' },
    { id: 'switch-lite-coral', name: 'Nintendo Switch Lite', detail: 'Coral', img: 'switch-lite-coral.jpg' },
    { id: 'lego-the-kiss', name: 'LEGO Art The Kiss', detail: 'Gustav Klimt × Belvedere · 31221', img: 'lego-the-kiss.jpg' },
    { id: 'airbrush-setting-spray', name: 'Airbrush Flawless Setting Spray', detail: 'Charlotte Tilbury · party all night, stay all day', img: 'airbrush-setting-spray.jpg' },
    { id: 'lol-strawberry-shortcake', name: 'L.O.L. Surprise! Strawberry Shortcake', detail: 'blind box', img: 'lol-strawberry-shortcake.jpg' },
    { id: 'miffy-keychain', name: 'Miffy plush keychain', detail: 'blind box', img: 'miffy-keychain.jpg' },
    { id: 'hobonichi-2027', name: 'Hobonichi Techo 2027', detail: 'planner', img: 'hobonichi-2027.jpg' },
    { id: 'green-tea-coconut-breeze', name: 'Green Tea Coconut Breeze', detail: 'Elizabeth Arden · eau de toilette', img: 'green-tea-coconut-breeze.jpg' },
    { id: 'green-tea-pistachio-crunch', name: 'Green Tea Pistachio Crunch', detail: 'Elizabeth Arden · eau de toilette', img: 'green-tea-pistachio-crunch.jpg' },
    { id: 'green-tea-strawberry-basil', name: 'Green Tea Strawberry Basil', detail: 'Elizabeth Arden · eau de toilette', img: 'green-tea-strawberry-basil.jpg' }
  ];
  var STICKERS = ['🎁', '💄', '🧸', '🌸', '👗', '👜', '📚', '🎮', '🍰', '💍', '🎧', '👟', '🕯️', '✈️'];
  var FIELDS = ['name', 'detail', 'note', 'link', 'img', 'sticker'];

  var doc = document;
  function $(id) { return doc.getElementById(id); }
  function make(tag, className, text) {
    var e = doc.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }
  function newId() { return 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1e8).toString(36); }
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function defaultItem(d, i) {
    return { id: d.id, name: d.name, detail: d.detail, note: '', link: '', img: IMG + d.img, sticker: '', fav: false, order: 1000 + i };
  }
  var grid = $('grid'), empty = $('empty'), status = $('status'), toastEl = $('toast');
  var editor = $('editor'), form = $('form'), title = $('editor-title'), saveBtn = $('f-save');
  var fName = $('f-name'), fDetail = $('f-detail'), fLink = $('f-link'), fNote = $('f-note');
  var fFile = $('f-file'), fClear = $('f-clear'), preview = $('f-preview'), stickerBox = $('f-stickers');

  var store = null;
  try {
    window.localStorage.setItem('quynh-disc-probe', '1');
    window.localStorage.removeItem('quynh-disc-probe');
    store = window.localStorage;
  } catch (e) {
    store = null;
  }
  if (store && location.hash === '#reset') {
    store.removeItem(LOCAL_KEY);
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
  if (location.protocol !== 'file:') {
    var back = doc.querySelector('.back');
    if (back) back.hidden = true;
  }

  var MSG = {
    local: '💾 Everything saves by itself on this computer',
    noStore: "⚠️ This browser can't save. Try Chrome, Edge or Firefox",
    connecting: '☁️ Opening your online wishlist…',
    online: '☁️ Saved online: the same list on every device',
    saving: '⏳ Saving…',
    offline: "📴 You're offline. Changes save online when you're back",
    offlineLocal: "📴 You're offline, so this is the copy on this computer",
    needLink: '🔒 Open your special wishlist link to see the shared list',
    error: "⚠️ Couldn't reach the online list, so it's saving on this computer"
  };
  var baseStatus = store ? MSG.local : MSG.noStore, flashTimer = null;
  function setBase(msg) {
    baseStatus = msg;
    if (!flashTimer) status.textContent = msg;
  }
  function flash(msg) {
    status.textContent = msg;
    status.classList.add('flash');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () {
      flashTimer = null;
      status.textContent = baseStatus;
      status.classList.remove('flash');
    }, 1800);
  }
  status.textContent = baseStatus;

  var toastTimer = null;
  function hideToast() {
    toastEl.classList.remove('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 260);
  }
  function toast(msg, undo) {
    clearTimeout(toastTimer);
    toastEl.textContent = '';
    toastEl.appendChild(doc.createTextNode(msg));
    if (undo) {
      var b = make('button', 'undo', 'Undo');
      b.type = 'button';
      b.addEventListener('click', function () {
        undo();
        hideToast();
      });
      toastEl.appendChild(b);
    }
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add('on');
    toastTimer = setTimeout(hideToast, undo ? 6000 : 2800);
  }

  var local = (function () {
    var s = null;
    if (store) {
      try { s = JSON.parse(store.getItem(LOCAL_KEY) || 'null'); } catch (e) { s = null; }
    }
    if (!s || !Array.isArray(s.items)) s = { items: [], seeded: [] };
    if (!Array.isArray(s.seeded)) s.seeded = [];
    var added = false;
    DEFAULTS.forEach(function (d, i) {
      if (s.seeded.indexOf(d.id) !== -1) return;
      s.seeded.push(d.id);
      s.items.push(defaultItem(d, i));
      added = true;
    });
    function write() { store.setItem(LOCAL_KEY, JSON.stringify({ v: 1, items: s.items, seeded: s.seeded })); }
    function save(item, quiet) {
      if (!store) {
        if (!quiet) flash(MSG.noStore);
        return;
      }
      try {
        write();
        if (!quiet) flash('Saved ✓');
        return;
      } catch (e) {}
      if (item && /^data:/.test(item.img || '')) {
        item.img = '';
        if (!item.sticker) item.sticker = '🎁';
        try {
          write();
          toast('The picture was too big to save, so I kept your wish with a sticker 💕');
          return;
        } catch (e2) {}
      }
      toast("Couldn't save right now 😢 Try removing a picture");
    }
    if (added && store) save(null, true);
    return {
      items: function () { return s.items; },
      add: function (data) {
        var it = { id: newId(), fav: false, mine: true };
        FIELDS.forEach(function (k) { it[k] = data[k] || ''; });
        s.items.unshift(it);
        save(it);
        render();
        return it.id;
      },
      update: function (id, data) {
        var it = find(s.items, id);
        if (!it) return;
        Object.keys(data).forEach(function (k) { it[k] = data[k]; });
        save(it);
        render();
      },
      remove: function (id) {
        var it = find(s.items, id);
        if (!it) return null;
        var i = s.items.indexOf(it);
        s.items.splice(i, 1);
        save(null);
        render();
        return function () {
          s.items.splice(Math.min(i, s.items.length), 0, it);
          freshId = it.id;
          save(it);
          render();
        };
      },
      pending: function () { return s.items.filter(function (it) { return it.mine && !it.uploaded; }); },
      uploaded: function (ids) {
        s.items.forEach(function (it) { if (ids.indexOf(it.id) !== -1) it.uploaded = true; });
        save(null, true);
      }
    };
  })();

  var mode = 'local', cloud = null;
  function api() { return mode === 'cloud' ? cloud : local; }
  function current() { return mode === 'cloud' ? cloud.items : local.items(); }

  function cleanDoc(data) {
    var out = {};
    FIELDS.forEach(function (k) { out[k] = typeof data[k] === 'string' ? data[k] : ''; });
    out.fav = !!data.fav;
    out.order = typeof data.order === 'number' && isFinite(data.order) ? data.order : 0;
    out.updated = Date.now();
    return out;
  }
  function byOrder(a, b) { return (a.order - b.order) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0); }

  function startCloud(cfg, key) {
    var db;
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      db = firebase.firestore();
      try {
        var p = db.enablePersistence({ synchronizeTabs: true });
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    } catch (e) {
      setBase(MSG.error);
      return null;
    }
    var listRef = db.collection('wishlists').doc(key);
    var itemsRef = listRef.collection('items');
    var c = { items: [], live: false, checked: false, pending: false, stopped: false };
    function fail() {
      if (c.stopped) return;
      c.stopped = true;
      if (c.unsubscribe) c.unsubscribe();
      mode = 'local';
      setBase(MSG.error);
      render();
    }
    function writeFail() {
      if (!c.stopped) toast("Couldn't save that online 😢 Please try again");
    }
    setTimeout(function () {
      if (!c.live && !c.stopped) setBase(mode === 'cloud' ? MSG.offline : MSG.offlineLocal);
    }, 6000);
    function lowestOrder() {
      return c.items.reduce(function (m, it) { return Math.min(m, it.order); }, 1000);
    }
    c.add = function (data) {
      var id = newId();
      itemsRef.doc(id).set(cleanDoc({
        name: data.name, detail: data.detail, note: data.note, link: data.link, img: data.img, sticker: data.sticker,
        fav: false, order: lowestOrder() - 1
      })).catch(writeFail);
      return id;
    };
    c.update = function (id, data) {
      var it = find(c.items, id);
      if (!it) return;
      var next = {};
      Object.keys(it).forEach(function (k) { next[k] = it[k]; });
      Object.keys(data).forEach(function (k) { next[k] = data[k]; });
      itemsRef.doc(id).set(cleanDoc(next)).catch(writeFail);
    };
    c.remove = function (id) {
      var it = find(c.items, id);
      if (!it) return null;
      var copy = cleanDoc(it);
      itemsRef.doc(id).delete().catch(writeFail);
      return function () {
        freshId = id;
        itemsRef.doc(id).set(copy).catch(writeFail);
      };
    };
    function firstSync() {
      listRef.get().then(function (snap) {
        var data = snap.exists ? snap.data() : null;
        var seeded = data && Array.isArray(data.seeded) ? data.seeded : [];
        var missing = DEFAULTS.filter(function (d) { return seeded.indexOf(d.id) === -1; });
        var mine = local.pending();
        c.checked = true;
        if (!missing.length && !mine.length) {
          mode = 'cloud';
          render();
          return;
        }
        var batch = db.batch();
        missing.forEach(function (d) { batch.set(itemsRef.doc(d.id), cleanDoc(defaultItem(d, DEFAULTS.indexOf(d)))); });
        if (missing.length) {
          batch.set(listRef, {
            seeded: firebase.firestore.FieldValue.arrayUnion.apply(null, missing.map(function (d) { return d.id; })),
            updated: Date.now()
          }, { merge: true });
        }
        var low = lowestOrder();
        mine.forEach(function (it, k) {
          var d = cleanDoc(it);
          d.order = low - mine.length + k;
          batch.set(itemsRef.doc(it.id), d);
        });
        return batch.commit().then(function () {
          if (mine.length) local.uploaded(mine.map(function (it) { return it.id; }));
        });
      }).catch(fail);
    }
    c.unsubscribe = itemsRef.onSnapshot({ includeMetadataChanges: true }, function (snap) {
      if (c.stopped) return;
      var meta = snap.metadata;
      if (!meta.fromCache && !c.live) {
        c.live = true;
        firstSync();
      }
      c.items = snap.docs.map(function (d) {
        var v = d.data();
        v.id = d.id;
        return v;
      }).sort(byOrder);
      if (!c.checked && snap.empty) return;
      if (c.pending && !meta.hasPendingWrites && !meta.fromCache) flash('Saved online ✓');
      c.pending = meta.hasPendingWrites;
      setBase(meta.hasPendingWrites ? MSG.saving : !meta.fromCache ? MSG.online : c.live ? MSG.offline : MSG.connecting);
      mode = 'cloud';
      render();
    }, fail);
    return c;
  }

  function hearts(target) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = target.getBoundingClientRect();
    ['💕', '💖', '✨'].forEach(function (h, i) {
      setTimeout(function () {
        var s = make('span', 'heart-sparkle', h);
        s.style.left = (r.left + r.width / 2 - 12) + 'px';
        s.style.top = (r.top - 6) + 'px';
        s.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
        doc.body.appendChild(s);
        s.addEventListener('animationend', function () { s.remove(); });
      }, i * 90);
    });
  }

  function safeLink(raw) {
    var v = (raw || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    try {
      var u = new URL(v);
      return /^https?:$/.test(u.protocol) ? u.href : '';
    } catch (e) {
      return '';
    }
  }

  var freshId = null, cards = {};
  function card(it, i) {
    var el = make('article', 'wish' + (it.fav ? ' fav-on' : '') + (it.id === freshId ? ' pop' : ''));
    el.setAttribute('data-id', it.id);
    var pic = make('div', 'wish-pic');
    if (it.img) {
      var im = make('img');
      im.alt = it.name;
      im.onerror = function () {
        pic.textContent = it.sticker || '🎁';
        pic.classList.add('sticker');
      };
      im.src = it.img;
      pic.appendChild(im);
    } else {
      pic.textContent = it.sticker || '🎁';
      pic.classList.add('sticker');
    }
    el.appendChild(pic);
    var fav = make('button', 'fav' + (it.fav ? ' on' : ''), it.fav ? '♥' : '♡');
    fav.type = 'button';
    fav.title = 'I really really want this';
    fav.setAttribute('aria-label', 'Favourite: ' + it.name);
    fav.setAttribute('aria-pressed', it.fav ? 'true' : 'false');
    fav.addEventListener('click', function () {
      if (!it.fav) hearts(fav);
      api().update(it.id, { fav: !it.fav });
    });
    el.appendChild(fav);
    el.appendChild(make('h3', '', it.name));
    if (it.detail) el.appendChild(make('p', 'detail', it.detail));
    if (it.note) el.appendChild(make('p', 'note', it.note));
    var row = make('div', 'row');
    if (it.link) {
      var a = make('a', 'mini', '🔗');
      a.href = it.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = 'Open the link';
      a.setAttribute('aria-label', 'Open the link for ' + it.name);
      row.appendChild(a);
    }
    var ed = make('button', 'mini', '✎');
    ed.type = 'button';
    ed.title = 'Edit';
    ed.setAttribute('aria-label', 'Edit ' + it.name);
    ed.addEventListener('click', function () { openEditor(it); });
    row.appendChild(ed);
    var rm = make('button', 'mini', '✕');
    rm.type = 'button';
    rm.title = 'Remove';
    rm.setAttribute('aria-label', 'Remove ' + it.name);
    rm.addEventListener('click', function () {
      var undo = api().remove(it.id);
      if (undo) toast('Removed “' + it.name + '”', undo);
    });
    row.appendChild(rm);
    el.appendChild(row);
    return el;
  }
  function render() {
    var list = current(), seen = {};
    list.forEach(function (it, i) {
      var sig = JSON.stringify([it.name, it.detail, it.note, it.link, it.img, it.sticker, !!it.fav]);
      var entry = cards[it.id];
      if (!entry || entry.sig !== sig || it.id === freshId) {
        if (entry && entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
        entry = { el: card(it, i), sig: sig };
        cards[it.id] = entry;
      }
      seen[it.id] = true;
      for (var c = 0; c < 4; c++) entry.el.classList.toggle('c' + c, c === i % 4);
      grid.appendChild(entry.el);
    });
    Object.keys(cards).forEach(function (id) {
      if (seen[id]) return;
      var el = cards[id].el;
      if (el.parentNode) el.parentNode.removeChild(el);
      delete cards[id];
    });
    empty.hidden = list.length > 0;
    if (freshId && seen[freshId]) {
      var fresh = cards[freshId].el;
      freshId = null;
      setTimeout(function () { hearts(fresh); }, 80);
    }
  }

  var editingId = null, pendingImg = '', pendingSticker = '🎁';
  STICKERS.forEach(function (s) {
    var b = make('button', '', s);
    b.type = 'button';
    b.setAttribute('aria-label', 'Sticker ' + s);
    b.addEventListener('click', function () {
      pendingSticker = s;
      pendingImg = '';
      fFile.value = '';
      showPreview();
    });
    stickerBox.appendChild(b);
  });
  function showPreview() {
    preview.textContent = '';
    if (pendingImg) {
      var im = make('img');
      im.alt = '';
      im.src = pendingImg;
      preview.appendChild(im);
      fClear.hidden = false;
    } else {
      preview.textContent = pendingSticker;
      fClear.hidden = true;
    }
    Array.prototype.forEach.call(stickerBox.children, function (b) {
      b.classList.toggle('on', !pendingImg && b.textContent === pendingSticker);
    });
  }
  function openEditor(it) {
    editingId = it ? it.id : null;
    title.textContent = it ? 'Edit your wish ✨' : 'Add a wish 💭';
    saveBtn.textContent = it ? 'Save changes ✨' : 'Add to my wishlist 💕';
    fName.value = it ? it.name : '';
    fDetail.value = it ? it.detail || '' : '';
    fLink.value = it ? it.link || '' : '';
    fNote.value = it ? it.note || '' : '';
    fName.classList.remove('bad');
    fFile.value = '';
    pendingImg = it ? it.img || '' : '';
    pendingSticker = it && it.sticker ? it.sticker : STICKERS[Math.floor(Math.random() * 4)];
    showPreview();
    if (typeof editor.showModal === 'function') editor.showModal();
    else editor.setAttribute('open', '');
    setTimeout(function () { fName.focus(); }, 40);
  }
  function closeEditor() {
    if (typeof editor.close === 'function') editor.close();
    else editor.removeAttribute('open');
  }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('read')); };
      reader.onload = function () {
        var im = new Image();
        im.onerror = function () { reject(new Error('decode')); };
        im.onload = function () {
          var s = Math.min(1, 520 / Math.max(im.naturalWidth, im.naturalHeight));
          var c = doc.createElement('canvas');
          c.width = Math.max(1, Math.round(im.naturalWidth * s));
          c.height = Math.max(1, Math.round(im.naturalHeight * s));
          var g = c.getContext('2d');
          g.fillStyle = '#fff';
          g.fillRect(0, 0, c.width, c.height);
          g.drawImage(im, 0, 0, c.width, c.height);
          try { resolve(c.toDataURL('image/jpeg', 0.8)); } catch (e) { reject(e); }
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  fFile.addEventListener('change', function () {
    var file = fFile.files && fFile.files[0];
    if (!file) return;
    shrink(file).then(function (data) {
      pendingImg = data;
      showPreview();
    }, function () {
      fFile.value = '';
      toast("This picture type doesn't work here. Try a JPG or PNG 💕");
    });
  });
  fClear.addEventListener('click', function () {
    pendingImg = '';
    fFile.value = '';
    showPreview();
  });
  $('f-cancel').addEventListener('click', closeEditor);
  editor.addEventListener('click', function (e) { if (e.target === editor) closeEditor(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = fName.value.trim();
    if (!name) {
      fName.classList.remove('bad');
      void fName.offsetWidth;
      fName.classList.add('bad');
      fName.focus();
      return;
    }
    var data = {
      name: name,
      detail: fDetail.value.trim(),
      link: safeLink(fLink.value),
      note: fNote.value.trim(),
      img: pendingImg,
      sticker: pendingImg ? '' : pendingSticker
    };
    var wasEditing = editingId;
    closeEditor();
    if (wasEditing) {
      api().update(wasEditing, data);
    } else {
      var a = api();
      var id = a.add(data);
      freshId = id;
      if (a === local) render();
      toast('Added to your wishlist 💕');
    }
  });
  fName.addEventListener('input', function () { fName.classList.remove('bad'); });

  $('add').addEventListener('click', function () { openEditor(null); });
  $('copy').addEventListener('click', function () {
    var lines = ["Quynh's wishlist 💕", ''];
    current().forEach(function (it) {
      var line = (it.fav ? '♥ ' : '• ') + it.name + (it.detail ? ' (' + it.detail + ')' : '');
      if (it.note) line += ' - ' + it.note;
      if (it.link) line += ' ' + it.link;
      lines.push(line);
    });
    var text = lines.join('\n');
    function ok() { toast('Copied! Paste it into a message 💌'); }
    function fallback() {
      var ta = make('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      doc.body.appendChild(ta);
      ta.select();
      var done = false;
      try { done = doc.execCommand('copy'); } catch (e) { done = false; }
      ta.remove();
      if (done) ok();
      else toast("Couldn't copy here 😢");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  });

  render();

  var cfg = window.WISHLIST_FIREBASE;
  var configured = !!(cfg && cfg.apiKey && cfg.projectId && cfg.appId);
  var hash = /(?:^#|&)list=([A-Za-z0-9_-]{20,64})/.exec(location.hash);
  var key = '';
  if (typeof window.WISHLIST_KEY === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(window.WISHLIST_KEY)) key = window.WISHLIST_KEY;
  else if (hash) key = hash[1];
  else if (store) key = store.getItem(LINK_KEY) || '';
  if (hash && store) {
    try { store.setItem(LINK_KEY, hash[1]); } catch (e) {}
  }
  if (configured && !key) {
    setBase(MSG.needLink);
  } else if (configured && window.firebase && typeof firebase.initializeApp === 'function') {
    setBase(MSG.connecting);
    cloud = startCloud(cfg, key);
  }
})();
