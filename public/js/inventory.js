'use strict';

/**
 * public/js/inventory.js
 * - Listens for classification <select> changes
 * - Fetches /inv/getInventory/:classification_id (JSON)
 * - Builds an HTML table inside #inventoryDisplay
 */

(function () {
  const select = document.querySelector('#classificationList');
  const table  = document.querySelector('#inventoryDisplay');

  if (!select || !table) {
    console.warn('[inventory.js] Required elements not found.');
    return;
  }

  // Announce updates for assistive tech
  table.setAttribute('aria-live', 'polite');

  // Fetch when the classification changes
  select.addEventListener('change', () => {
    const classification_id = select.value;
    if (!classification_id) {
      table.innerHTML = '';
      return;
    }
    const url = '/inv/getInventory/' + encodeURIComponent(classification_id);
    fetchInventory(url);
  });

  // If a classification is already selected (sticky), load it immediately
  if (select.value) {
    const initialUrl = '/inv/getInventory/' + encodeURIComponent(select.value);
    fetchInventory(initialUrl);
  }

  async function fetchInventory(url) {
    try {
      // Loading state (also helpful for screen readers)
      table.setAttribute('aria-busy', 'true');
      table.innerHTML = '<caption>Loading…</caption>';

      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Network response was not OK (HTTP ' + res.status + ')');

      const payload = await res.json();
      // Some backends return { rows: [...] }; accept either shape
      const data = Array.isArray(payload) ? payload : (Array.isArray(payload?.rows) ? payload.rows : []);
      buildInventoryList(data);
    } catch (err) {
      console.error('[inventory.js] Error:', err);
      table.innerHTML =
        '<caption class="notice">Error loading inventory: ' +
        escapeHtml(err.message || String(err)) +
        '</caption>';
    } finally {
      table.removeAttribute('aria-busy');
    }
  }

  // Build inventory items into HTML table and inject into DOM
  function buildInventoryList(data) {
    // Always build a full, valid table structure
    let html = '';
    html += '<thead>';
    html += '<tr><th scope="col">Vehicle</th><th scope="col">Modify</th><th scope="col">Delete</th></tr>';
    html += '</thead>';
    html += '<tbody>';

    if (!Array.isArray(data) || data.length === 0) {
      // Empty state keeps columns consistent
      html += '<tr><td colspan="3">No vehicles found for this classification.</td></tr>';
      html += '</tbody>';
      table.innerHTML = html;
      return;
    }

    data.forEach((v) => {
      const id   = v.inv_id;
      const name = (v.inv_make ?? '') + ' ' + (v.inv_model ?? '');

      html += '<tr>';
      html += '<td scope="row">' + escapeHtml(name.trim()) + '</td>';
      html += '<td><a href="/inv/edit/' + encodeURIComponent(id) + '" title="Click to update">Modify</a></td>';
      html += '<td><a href="/inv/delete/' + encodeURIComponent(id) + '" title="Click to delete">Delete</a></td>';
      html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
  }

  // Minimal escaping for caption/error/output
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
