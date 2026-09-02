#!/usr/bin/env node
/**
 * Click-through checks against local EventCata via Chrome DevTools Protocol.
 * Usage: node tools/browser-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SHOT_DIR || '/tmp/eventcata-verify-shots';
const BASE = process.env.EVENTCATA_URL || 'http://127.0.0.1:8877';
const PORT = Number(process.env.CDP_PORT || 9333);
const CHROME =
  process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = `/tmp/eventcata-chrome-${Date.now()}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitPort(port, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const ok = await new Promise((resolve) => {
      const sock = createConnection({ host: '127.0.0.1', port }, () => {
        sock.end();
        resolve(true);
      });
      sock.on('error', () => resolve(false));
    });
    if (ok) return;
    await sleep(200);
  }
  throw new Error('CDP port never opened: ' + port);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}, ms = 20000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('CDP timeout ' + method));
      }, ms);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(t); resolve(v); },
        reject: (e) => { clearTimeout(t); reject(e); },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, { timeout = 8000, awaitPromise = false } = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      timeout,
    });
    if (r.exceptionDetails) {
      const t = r.exceptionDetails.exception?.description || r.exceptionDetails.text;
      throw new Error(t);
    }
    return r.result?.value;
  }
}

async function screenshot(cdp, name) {
  try {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, 8000);
    const dest = path.join(OUT, name);
    await writeFile(dest, Buffer.from(data, 'base64'));
    console.log('shot', dest);
    return dest;
  } catch (e) {
    console.log('shot skipped', name, e.message);
    return null;
  }
}

async function waitFor(cdp, expression, ms = 12000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < ms) {
    last = await cdp.eval(expression);
    if (last) return last;
    await sleep(200);
  }
  throw new Error('timeout waiting for: ' + expression + ' last=' + last);
}

const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name} — ${detail}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
    const attach = process.env.CDP_ATTACH === '1';
    let chrome = { kill() {} };
    if (!attach) {
      chrome = spawn(
        CHROME,
        [
          `--remote-debugging-port=${PORT}`,
          '--remote-allow-origins=*',
          `--user-data-dir=${PROFILE}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
          '--window-size=1280,800',
          '--headless=new',
        ],
        { stdio: 'ignore' }
      );
      await waitPort(PORT, 30000);
      await sleep(800);
    } else {
      await waitPort(PORT, 10000);
    }
    try {
    const created = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + '/')}`, {
      method: 'PUT',
    }).then((r) => r.json());
    const pageWs = created.webSocketDebuggerUrl;
    if (!pageWs) throw new Error('no page websocket: ' + JSON.stringify(created));
    const ws = new WebSocket(pageWs);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });
    const cdp = new Cdp(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    }).catch(() => {});
    await sleep(1500);

    await waitFor(
      cdp,
      `!!(document.querySelector('.empty-state') || document.querySelector('.event-card') || document.querySelector('.year-section'))`,
      15000
    );
    const cold = await cdp.eval(`(() => {
      const splash = document.getElementById('app-splash');
      const splashStyle = splash ? getComputedStyle(splash) : null;
      const empty = document.querySelector('.empty-state');
      const list = document.querySelector('.event-card, .year-section');
      const discover = document.querySelector('.discover-wrap');
      const session = document.getElementById('session-meta');
      const vis = (el) => !!(el && el.offsetParent !== null);
      return {
        title: document.title,
        splashDisplay: splashStyle ? splashStyle.display : 'missing',
        emptyText: empty ? empty.innerText.replace(/\\s+/g, ' ').trim() : '',
        hasList: !!list,
        discoverVisible: vis(discover),
        sessionVisible: vis(session),
        discoverInA11y: discover && !discover.hidden && discover.getAttribute('aria-hidden') !== 'true' && discover.offsetParent !== null,
        homeInert: document.getElementById('home')?.inert === true,
        createInert: document.getElementById('create-screen')?.inert === true,
        detailInert: document.getElementById('detail')?.inert === true,
        appText: (document.getElementById('app-root')?.innerText || '').slice(0, 400)
      };
    })()`);
    await screenshot(cdp, '02-home.png');

    const notVoid = !!(cold.emptyText || cold.hasList || (cold.appText && cold.appText.includes('EventCata')));
    rec(
      '1. Cold load',
      notVoid && cold.title === 'EventCata',
      `title=${cold.title} empty="${cold.emptyText.slice(0, 80)}" list=${cold.hasList} splash=${cold.splashDisplay}`
    );

    rec(
      '6. Title / no trending / no GPS meta',
      cold.title === 'EventCata' &&
        !cold.title.includes('Ugoo') &&
        !cold.discoverVisible &&
        !cold.sessionVisible &&
        !(cold.emptyText || '').includes('Discover Trending'),
      `title=${cold.title} discoverVis=${cold.discoverVisible} sessionVis=${cold.sessionVisible}`
    );

    rec(
      'inert inactive screens',
      cold.createInert === true && cold.detailInert === true,
      `homeInert=${cold.homeInert} createInert=${cold.createInert} detailInert=${cold.detailInert}`
    );

    await cdp.eval(`document.getElementById('install-helper-dismiss')?.click()`);
    const newBtn = await cdp.eval(`(() => {
      const btns = [...document.querySelectorAll('button')];
      const b = btns.find((el) => /New event/i.test(el.textContent || '')) ||
        document.getElementById('fab-add');
      if (b) { b.click(); return b.textContent || b.getAttribute('aria-label') || 'clicked'; }
      return null;
    })()`);
    await sleep(500);
    await screenshot(cdp, '03-create.png');
    const onCreate = await cdp.eval(`(() => {
      const create = document.getElementById('create-screen');
      const name = document.getElementById('field-name');
      const rect = name ? name.getBoundingClientRect() : null;
      const blocked = name && (document.elementFromPoint(rect.left + 10, rect.top + 8) !== name &&
        !name.contains(document.elementFromPoint(rect.left + 10, rect.top + 8)));
      return {
        active: create?.classList.contains('active'),
        path: location.pathname,
        nameExists: !!name,
        nameDisabled: !!(name && name.disabled),
        overlay: blocked || false,
        hit: (() => {
          if (!rect) return null;
          const el = document.elementFromPoint(rect.left + 10, rect.top + 8);
          return el ? (el.id || el.className || el.tagName) : null;
        })()
      };
    })()`);

    console.log('create state', JSON.stringify(onCreate));
    if (!onCreate.active || !onCreate.nameExists) {
      rec('2. Create event', false, `could not open create. btn=${newBtn} state=${JSON.stringify(onCreate)}`);
    } else if (onCreate.nameDisabled || onCreate.overlay) {
      rec('2. Create event', false, `field blocked. overlay=${onCreate.overlay} hit=${onCreate.hit}`);
    } else {
      console.log('filling name');
      await cdp.eval(`document.getElementById('field-name').value='QA Pool Night'`);
      console.log('filling location');
      await cdp.eval(`document.getElementById('field-location').value='Polo Park, Enugu'`);
      console.log('filling date');
      const dateVal = await cdp.eval(`(() => {
        const d = document.getElementById('field-date');
        d.type = 'text';
        d.value = '2026-09-20';
        return d.value;
      })()`);
      console.log('date value', dateVal);
      console.log('filled');
      const fields = await cdp.eval(`({
        name: document.getElementById('field-name').value,
        date: document.getElementById('field-date').value,
        loc: document.getElementById('field-location').value
      })`);
      console.log('fields', JSON.stringify(fields));
      await cdp.eval(`void saveEvent(); 'save-started'`);
      await waitFor(
        cdp,
        `document.getElementById('detail')?.classList.contains('active') && (document.getElementById('detail-title')?.textContent || '').includes('QA Pool Night')`,
        15000
      );
      await screenshot(cdp, '04-detail-after-save.png');
      const afterSave = await cdp.eval(`({
        title: document.getElementById('detail-title')?.textContent,
        path: location.pathname + location.search,
        id: new URLSearchParams(location.search).get('id')
      })`);
      rec(
        '2. Create event',
        afterSave.title === 'QA Pool Night',
        `title=${afterSave.title} url=${afterSave.path}`
      );

      await cdp.eval(`document.getElementById('rsvp-going')?.click()`);
      await sleep(400);
      const going = await cdp.eval(`document.getElementById('rsvp-going')?.classList.contains('active')`);
      await screenshot(cdp, '05-rsvp-going.png');

      await cdp.eval(`(() => {
        window.__shareToast = '';
        const orig = window.showToast;
        window.showToast = (m) => { window.__shareToast = String(m || ''); if (orig) orig(m); };
        return true;
      })()`);
      await cdp.eval(`document.querySelector('#detail button[onclick="shareEvent()"]')?.click(); 'shared'`);
      await sleep(800);
      const share = await cdp.eval(
        `(async () => ({
          toast: window.__shareToast || '',
          clip: await navigator.clipboard.readText().catch(() => ''),
          toastDom: document.getElementById('toast')?.textContent || ''
        }))()`,
        { awaitPromise: true }
      );
      const shareOk =
        !!going && (
          /copied|share/i.test((share.toast || '') + (share.toastDom || '') + (share.clip || '')) ||
          ((share.clip || '').includes('QA Pool Night')) ||
          ((share.toast || share.toastDom || '').includes('QA Pool Night') &&
            (share.toast || share.toastDom || '').includes('Polo Park'))
        );
      rec(
        '3. RSVP Going + share',
        !!going && shareOk,
        `going=${going} toast=${share.toast || share.toastDom} clip=${(share.clip || '').slice(0, 80)}`
      );

      const eventId = afterSave.id;
      await cdp.send('Page.navigate', { url: `${BASE}/detail?id=${encodeURIComponent(eventId)}` });
      await sleep(800);
      await waitFor(
        cdp,
        `document.getElementById('detail')?.classList.contains('active') &&
         (document.getElementById('detail-title')?.textContent || '').includes('QA Pool Night')`,
        12000
      );
      const reloaded = await cdp.eval(`({
        title: document.getElementById('detail-title')?.textContent,
        path: location.pathname + location.search,
        going: document.getElementById('rsvp-going')?.classList.contains('active')
      })`);
      await screenshot(cdp, '06-reload-detail.png');
      rec(
        '4. Reload /detail?id=',
        reloaded.title === 'QA Pool Night' && (reloaded.path || '').includes(eventId),
        `title=${reloaded.title} url=${reloaded.path} going=${reloaded.going}`
      );

      await cdp.send('Page.navigate', { url: `${BASE}/create` });
      await sleep(600);
      await waitFor(cdp, `document.getElementById('create-screen')?.classList.contains('active')`, 10000);
      await screenshot(cdp, '07-create-route.png');
      const createRoute = await cdp.eval(`({
        active: document.getElementById('create-screen')?.classList.contains('active'),
        path: location.pathname
      })`);
      await cdp.eval(`document.querySelector('#create-screen .nav-btn')?.click()`);
      await sleep(500);
      const afterBack = await cdp.eval(`({
        home: document.getElementById('home')?.classList.contains('active'),
        path: location.pathname,
        hasEvent: (document.getElementById('events-list')?.innerText || '').includes('QA Pool Night')
      })`);
      await screenshot(cdp, '08-back-home.png');
      rec(
        '5. /create then back',
        createRoute.active && createRoute.path === '/create' && afterBack.home && afterBack.hasEvent,
        `createPath=${createRoute.path} home=${afterBack.home} listed=${afterBack.hasEvent}`
      );
    }

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send('Page.navigate', { url: BASE + '/' });
    await sleep(1000);
    await waitFor(cdp, `document.getElementById('home')?.classList.contains('active')`, 10000);
    await screenshot(cdp, '09-mobile-home.png');
    const mobile = await cdp.eval(`({
      w: window.innerWidth,
      home: document.getElementById('home')?.classList.contains('active'),
      listed: (document.getElementById('events-list')?.innerText || '').includes('QA Pool Night'),
      emptyOrList: !!(document.querySelector('.empty-state, .event-card, .year-section'))
    })`);
    rec(
      '7. Desktop + mobile viewport',
      mobile.w <= 430 && mobile.home && (mobile.listed || mobile.emptyOrList),
      `mobileW=${mobile.w} listed=${mobile.listed}`
    );

    await screenshot(cdp, '10-desktop-was-1280.png');
    ws.close();
  } finally {
    if (!attach) chrome.kill('SIGKILL');
  }

  const failed = results.filter((r) => !r.pass);
  console.log('\n--- summary ---');
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
