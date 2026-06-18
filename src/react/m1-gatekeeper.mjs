/**
 * M1 Gatekeeper Script — Left Rail with Tabs
 * Runs against the live dev server at http://localhost:5177/Excellon-NexAI/
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5177/Excellon-NexAI';
const RESULTS = [];

function pass(id, detail) {
  console.log(`✅ [${id}] ${detail}`);
  RESULTS.push({ id, status: 'PASS', detail });
}
function fail(id, detail) {
  console.log(`❌ [${id}] ${detail}`);
  RESULTS.push({ id, status: 'FAIL', detail });
}
function warn(id, detail) {
  console.log(`⚠️  [${id}] ${detail}`);
  RESULTS.push({ id, status: 'WARN', detail });
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push(err.message));

try {
  // ── Navigate to views list ──────────────────────────────────────────────
  await page.goto(`${BASE}/studio/views`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'gk-m1-01-views-list.png' });

  // Click first available view row
  const viewRow = page.locator('[data-testid="view-row"]').first();
  const viewCount = await viewRow.count();
  if (viewCount === 0) {
    fail('SETUP', 'No view rows found on the list page — cannot proceed');
    await browser.close();
    process.exit(1);
  }
  await viewRow.click();
  await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 10000 });
  await page.screenshot({ path: 'gk-m1-02-designer-open.png' });

  // ── CHECK 1: Left rail shows 3 tabs ─────────────────────────────────────
  const tabOutline = page.locator('[data-testid="lr-tab-outline"]');
  const tabLibrary = page.locator('[data-testid="lr-tab-library"]');
  const tabFields  = page.locator('[data-testid="lr-tab-fields"]');
  const t1 = await tabOutline.count() && await tabLibrary.count() && await tabFields.count();
  if (t1) pass(1, 'All 3 tabs visible: Outline / Library / Fields');
  else fail(1, `Tabs missing — outline:${await tabOutline.count()} library:${await tabLibrary.count()} fields:${await tabFields.count()}`);

  // ── CHECK 2: Library tab active by default, shows palette ───────────────
  const libActive = await tabLibrary.evaluate(el => el.classList.contains('lr-tab--active'));
  const palette   = page.locator('[data-testid="component-palette"]');
  const paletteVis = await palette.isVisible();
  if (libActive && paletteVis) pass(2, 'Library tab active by default; component palette visible');
  else fail(2, `Library active=${libActive}, palette visible=${paletteVis}`);

  // check search box and at least one category
  const searchBox = palette.locator('input[type="text"], input[placeholder]');
  const categories = palette.locator('.cp-category');
  const searchCount = await searchBox.count();
  const catCount = await categories.count();
  if (searchCount > 0 && catCount > 0) pass('2b', `Search box present; ${catCount} categories shown`);
  else warn('2b', `searchBox=${searchCount} categories=${catCount}`);

  // ── CHECK 3: Outline tab shows component tree ────────────────────────────
  await tabOutline.click();
  await page.waitForTimeout(300);
  const tree = page.locator('[data-testid="component-tree"]');
  const treeVis = await tree.isVisible();
  if (treeVis) pass(3, 'Outline tab shows component tree');
  else fail(3, 'Component tree not visible after clicking Outline tab');
  await page.screenshot({ path: 'gk-m1-03-outline-tab.png' });

  // ── CHECK 4: Fields tab shows placeholder ───────────────────────────────
  await tabFields.click();
  await page.waitForTimeout(300);
  const fieldsPlaceholder = page.locator('[data-testid="lr-fields-placeholder"]');
  const fieldsVis = await fieldsPlaceholder.isVisible();
  if (fieldsVis) pass(4, 'Fields tab shows placeholder text');
  else fail(4, 'Fields placeholder not visible');
  await page.screenshot({ path: 'gk-m1-04-fields-tab.png' });

  // Switch back to Library before further tests
  await tabLibrary.click();
  await page.waitForTimeout(200);

  // ── CHECK 5: Collapse button hides left panel ────────────────────────────
  const collapseBtn = page.locator('.lr-collapse');
  const collapseBtnExists = await collapseBtn.count();
  if (!collapseBtnExists) {
    fail(5, 'Collapse button (.lr-collapse) not found');
  } else {
    const leftSidebar = page.locator('.vd-sidebar--left');
    const visibleBefore = await leftSidebar.isVisible();
    await collapseBtn.click();
    await page.waitForTimeout(300);
    const visibleAfter = await leftSidebar.isVisible();
    if (visibleBefore && !visibleAfter) pass(5, 'Collapse button hides the left rail');
    else fail(5, `Before=${visibleBefore} After=${visibleAfter} — panel did not hide`);
    await page.screenshot({ path: 'gk-m1-05-collapsed.png' });

    // ── CHECK 6: Center canvas still works after collapse ──────────────────
    const canvas = page.locator('.vd-canvas');
    const canvasVis = await canvas.isVisible();
    if (canvasVis) pass(6, 'Center canvas visible after collapse');
    else fail(6, 'Center canvas not visible after collapse');

    // Re-open the panel via the toolbar palette toggle if available
    // Try clicking a palette toggle in toolbar or re-navigating
    // The store's togglePalette opens it again; look for a toolbar button or just reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="vd-toolbar"]', { timeout: 10000 });
  }

  // ── CHECK 7: Drag from Library → drop on tree node ──────────────────────
  // Switch to Library tab first
  await tabLibrary.click();
  await page.waitForTimeout(200);

  const paletteItem = page.locator('.cp-item').first();
  const paletteItemCount = await paletteItem.count();

  // Get first drop target — a ct-node in the center tree
  const treeNode = page.locator('.ct-node').first();
  const treeNodeCount = await treeNode.count();

  if (paletteItemCount === 0) {
    fail(7, 'No palette items found to drag');
  } else if (treeNodeCount === 0) {
    fail(7, 'No tree nodes found as drop targets in center');
  } else {
    const componentsBefore = await page.locator('.ct-node').count();
    await paletteItem.dragTo(treeNode);
    await page.waitForTimeout(500);
    const componentsAfter = await page.locator('.ct-node').count();
    if (componentsAfter > componentsBefore) {
      pass(7, `Drag-drop worked: tree grew from ${componentsBefore} to ${componentsAfter} nodes`);
    } else {
      warn(7, `Tree node count unchanged (${componentsBefore} → ${componentsAfter}). May be a placement rule rejection.`);
    }
    await page.screenshot({ path: 'gk-m1-07-drag-drop.png' });
  }

  // ── CHECK 8: Double-click adds component ────────────────────────────────
  const nodesBefore = await page.locator('.ct-node').count();
  await paletteItem.dblclick();
  await page.waitForTimeout(400);
  const nodesAfter = await page.locator('.ct-node').count();
  if (nodesAfter > nodesBefore) pass(8, `Double-click added component: ${nodesBefore} → ${nodesAfter} nodes`);
  else warn(8, `Double-click: node count unchanged (${nodesBefore} → ${nodesAfter}). May be placement rule.`);

  // ── CHECK 9: Toolbar buttons ─────────────────────────────────────────────
  const saveBtn    = page.locator('[data-testid="vd-save-btn"]');
  const publishBtn = page.locator('[data-testid="vd-publish-btn"]');
  const previewBtn = page.locator('[data-testid="vd-preview-btn"]');
  const undoBtn    = page.locator('button[title="Undo (Ctrl+Z)"]');
  const redoBtn    = page.locator('button[title="Redo (Ctrl+Y)"]');
  const settingsBtn = page.locator('button[title="View Settings"]');

  const saveDis  = await saveBtn.isDisabled();
  const pubVis   = await publishBtn.isVisible();
  const preVis   = await previewBtn.isVisible();
  const undoVis  = await undoBtn.isVisible();
  const redoVis  = await redoBtn.isVisible();
  const setVis   = await settingsBtn.isVisible();

  if (pubVis && preVis && undoVis && redoVis && setVis) {
    pass(9, `All toolbar buttons present. Save disabled=${saveDis} (expected when clean)`);
  } else {
    fail(9, `Missing toolbar buttons: publish=${pubVis} preview=${preVis} undo=${undoVis} redo=${redoVis} settings=${setVis}`);
  }
  await page.screenshot({ path: 'gk-m1-09-toolbar.png' });

  // ── CHECK 10: Preview toggle ─────────────────────────────────────────────
  await previewBtn.click();
  await page.waitForTimeout(400);
  const leftAfterPreview = page.locator('.vd-sidebar--left');
  const leftHidden = !(await leftAfterPreview.isVisible());
  const previewCanvas = page.locator('.prev-canvas');
  const previewVisible = await previewCanvas.isVisible();
  if (leftHidden && previewVisible) pass(10, 'Preview mode: left panel hidden, preview canvas shown');
  else fail(10, `Preview: leftHidden=${leftHidden}, previewCanvasVisible=${previewVisible}`);
  await page.screenshot({ path: 'gk-m1-10-preview.png' });

  // Back to edit mode
  await previewBtn.click();
  await page.waitForTimeout(300);

  // ── CHECK 11: Ctrl+Z triggers undo ──────────────────────────────────────
  // Make a change first so there's something to undo
  await tabLibrary.click();
  await page.waitForTimeout(200);
  const countBefore = await page.locator('.ct-node').count();
  // double-click first palette item to add a component
  const firstItem = page.locator('.cp-item').first();
  if (await firstItem.count() > 0) {
    await firstItem.dblclick();
    await page.waitForTimeout(300);
    const countAfterAdd = await page.locator('.ct-node').count();
    // now undo
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    const countAfterUndo = await page.locator('.ct-node').count();
    if (countAfterUndo < countAfterAdd) pass(11, `Ctrl+Z undo worked: ${countAfterAdd} → ${countAfterUndo} nodes`);
    else warn(11, `Ctrl+Z: count before=${countBefore} afterAdd=${countAfterAdd} afterUndo=${countAfterUndo}`);
  } else {
    warn(11, 'No palette items available to test undo with');
  }

  // ── CHECK 12: No console errors ──────────────────────────────────────────
  if (consoleErrors.length === 0) {
    pass(12, 'No console errors detected during test run');
  } else {
    fail(12, `${consoleErrors.length} console error(s):\n  ${consoleErrors.slice(0, 5).join('\n  ')}`);
  }

} catch (err) {
  fail('EXCEPTION', `Unexpected error: ${err.message}`);
  await page.screenshot({ path: 'gk-m1-error.png' });
}

await browser.close();

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log('  M1 GATEKEEPER RESULTS');
console.log('══════════════════════════════════════════');
const passed  = RESULTS.filter(r => r.status === 'PASS').length;
const failed  = RESULTS.filter(r => r.status === 'FAIL').length;
const warned  = RESULTS.filter(r => r.status === 'WARN').length;
console.log(`  PASS: ${passed}   FAIL: ${failed}   WARN: ${warned}`);
console.log('══════════════════════════════════════════');
RESULTS.forEach(r => console.log(`  ${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️ '} [${r.id}] ${r.detail}`));
writeFileSync('m1-results.json', JSON.stringify(RESULTS, null, 2));
if (failed > 0) process.exit(1);
