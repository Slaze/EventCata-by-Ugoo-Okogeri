#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const root = process.cwd();
const stylesPath = path.join(root, 'src', 'styles.css');
const appJsPath = path.join(root, 'src', 'app.js');
const offlinePath = path.join(root, 'offline.html');
const indexPath = path.join(root, 'index.html');

const CSS_MARKER = '/* EC_AUTOINJECT_SECURITY_CSS */';
const JS_MARKER = '// EC_AUTOINJECT_SECURITY_JS';

const cssSnippet = `
${CSS_MARKER}
.current-session {
  background: linear-gradient(90deg, rgba(10,132,255,0.06), rgba(10,132,255,0.03));
  border-radius: 10px;
  padding: 10px;
}
input[type="checkbox"].permanent {
  position: absolute !important;
  width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; clip: rect(0 0 0 0);
  clip-path: inset(50%); overflow: hidden; white-space: nowrap; opacity: 0; pointer-events: none;
}
.search-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px;
  border-radius: 8px; background: var(--accent, #0a84ff); color: #fff; border: none; cursor: pointer;
}
.mini-map { cursor: pointer; border-radius: 8px; overflow: hidden; }
`;

const jsSnippet = `
${JS_MARKER}
(function(){
  const OWNER_PASSKEY_FLAG = 'ec_owner_passkey_set';
  async function createOwnerPasskey(displayName='EventCata Owner') {
    if (!window.PublicKeyCredential) return false;
    if (localStorage.getItem(OWNER_PASSKEY_FLAG)) return true;
    const publicKey = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'EventCata' },
      user: { id: Uint8Array.from(String(Date.now()), c=>c.charCodeAt(0)), name: 'owner@eventcata.local', displayName },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000, attestation: 'none'
    };
    try {
      const cred = await navigator.credentials.create({ publicKey });
      if (cred) { localStorage.setItem(OWNER_PASSKEY_FLAG, '1'); return true; }
    } catch(e){ console.warn('createOwnerPasskey', e); throw e; }
    return false;
  }
  async function requireOwnerAuth() {
    if (!localStorage.getItem(OWNER_PASSKEY_FLAG) || !window.PublicKeyCredential) return false;
    try {
      const publicKey = { challenge: crypto.getRandomValues(new Uint8Array(32)), timeout:60000, userVerification:'required' };
      const assertion = await navigator.credentials.get({ publicKey });
      return !!assertion;
    } catch(e){ return false; }
  }
  function showLockedOverlay(){
    if(document.getElementById('ec-locked-overlay')) return;
    const el=document.createElement('div'); el.id='ec-locked-overlay';
    Object.assign(el.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,0.6)',zIndex:'99999',display:'flex',alignItems:'center',justifyContent:'center'});
    el.innerHTML='<div style="color:#fff;padding:18px;background:#071026;border-radius:10px">Locked — confirm device biometrics to continue</div>';
    document.body.appendChild(el);
  }
  function hideLockedOverlay(){ const el=document.getElementById('ec-locked-overlay'); if(el) el.remove(); }

  document.addEventListener('visibilitychange', async ()=> {
    if (document.visibilityState === 'visible' && localStorage.getItem(OWNER_PASSKEY_FLAG)) {
      const ok = await requireOwnerAuth();
      if (!ok) { document.body.classList.add('locked-by-passkey'); showLockedOverlay(); } else { document.body.classList.remove('locked-by-passkey'); hideLockedOverlay(); }
    }
  });

  document.addEventListener('DOMContentLoaded', ()=> {
    document.querySelectorAll('input[type="checkbox"].permanent').forEach(cb=>{ cb.checked=true; cb.disabled=true; });
    if (typeof maplibregl !== 'undefined') {
      document.querySelectorAll('[data-mini-map]').forEach(el=>{
        const lat=parseFloat(el.dataset.lat), lon=parseFloat(el.dataset.lon);
        if (!isNaN(lat)&&!isNaN(lon)) {
          try {
            const map=new maplibregl.Map({container:el,style:'https://demotiles.maplibre.org/style.json',center:[lon,lat],zoom:14,interactive:false});
            new maplibregl.Marker().setLngLat([lon,lat]).addTo(map);
            el.addEventListener('click', ()=> {
              const ev = new CustomEvent('ec-open-fullmap',{detail:{lat,lon}}); window.dispatchEvent(ev);
            });
          } catch(e){ console.warn('mini map init', e); }
        }
      });
    }
  });

  window.addEventListener('ec-open-fullmap', (e)=>{
    const {lat,lon}=e.detail||{};
    if (lat==null||lon==null) return;
    if (document.getElementById('ec-fullmap')) return;
    const modal=document.createElement('div'); modal.id='ec-fullmap';
    Object.assign(modal.style,{position:'fixed',inset:'0',zIndex:'100000',background:'#070819',display:'flex',flexDirection:'column'});
    modal.innerHTML=\`
      <div style="padding:10px;display:flex;gap:8px;justify-content:flex-end;background:transparent">
        <button id="ec-close-fullmap" class="search-btn">Close</button>
      </div>
      <div id="ec-fullmap-map" style="flex:1;min-height:60vh"></div>
      <div style="padding:12px;display:flex;gap:8px;justify-content:center;">
        <button id="ec-open-google" class="search-btn">Google Maps</button>
        <button id="ec-open-apple" class="search-btn">Apple Maps</button>
        <button id="ec-open-osm" class="search-btn">OpenStreetMap</button>
      </div>\`;
    document.body.appendChild(modal);
    const map=new maplibregl.Map({container:'ec-fullmap-map',style:'https://demotiles.maplibre.org/style.json',center:[lon,lat],zoom:14});
    new maplibregl.Marker().setLngLat([lon,lat]).addTo(map);
    document.getElementById('ec-open-google').addEventListener('click', ()=> window.open(\`https://www.google.com/maps/search/?api=1&query=\${lat},\${lon}\`,'_blank'));
    document.getElementById('ec-open-apple').addEventListener('click', ()=> window.open(\`https://maps.apple.com/?q=\${lat},\${lon}\`,'_blank'));
    document.getElementById('ec-open-osm').addEventListener('click', ()=> window.open(\`https://www.openstreetmap.org/?mlat=\${lat}&mlon=\${lon}#map=16/\${lat}/\${lon}\`,'_blank'));
    document.getElementById('ec-close-fullmap').addEventListener('click', ()=> { map.remove(); modal.remove(); });
  });

  window.EventCata = window.EventCata || {};
  Object.assign(window.EventCata, { createOwnerPasskey, requireOwnerAuth });
})();
`;

async function safeAppend(filePath, marker, snippet) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    if (content.includes(marker)) {
      console.log('Already contains marker:', filePath);
      return;
    }
    content = content + '\n' + snippet;
    await fs.writeFile(filePath, content, 'utf8');
    console.log('Appended snippet to', filePath);
  } catch (err) {
    console.warn('Failed to append to', filePath, err.message);
  }
}

(async ()=> {
  await fs.mkdir(path.join(root,'src'), { recursive: true });
  await safeAppend(stylesPath, CSS_MARKER, cssSnippet);
  await safeAppend(appJsPath, JS_MARKER, jsSnippet);

  try {
    const idx = await fs.readFile(indexPath, 'utf8');
    const t = (idx.match(/<title[^>]*>([\s\S]*?)</title>/i) || [])[1];
    if (t) {
      let off = await fs.readFile(offlinePath, 'utf8');
      off = off.replace(/<title[^>]*>[\s\S]*?<\\/title>/i, '<title>' + t + '</title>');
      await fs.writeFile(offlinePath, off, 'utf8');
      console.log('Updated offline.html title to match index.html');
    }
  } catch(e){ /* ignore */ }

  console.log('Done. Restart dev server and test.');
})();
