'use strict';

/**
 * inventory.js
 * - Listens for classification <select> changes
 * - Fetches /inv/getInventory/:classification_id (JSON)
 * - Builds an HTML table inside #inventoryDisplay
 */

(function () {
  var select = document.querySelector('#classificationList');
  var table  = document.querySelector('#inventoryDisplay');

  if (!select || !table) {
    console.warn('[inventory.js] Required elements not found.');
    return;
  }

  // Fetch when the classification changes
  select.addEventListener('change', function () {
    var classification_id = select.value;
    if (!classification_id) {
      table.innerHTML = '';
      return;
    }
    var url = '/inv/getInventory/' + encodeURIComponent(classification_id);
    fetchInventory(url);
  });

  // If a classification is already selected (sticky), load it immediately
  if (select.value) {
    var initialUrl = '/inv/getInventory/' + encodeURIComponent(select.value);
    fetchInventory(initialUrl);
  }

  async function fetchInventory(url) {
    try {
      // Loading state (also helpful for screen readers)
      table.setAttribute('aria-busy', 'true');
      table.innerHTML = '<caption>Loading…</caption>';

      var res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Network response was not OK (HTTP ' + res.status + ')');

      var data = await res.json();
      // Expecting an array (possibly empty)
      buildInventoryList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[inventory.js] Error:', err);
      table.innerHTML = '<caption class="notice">Error loading inventory: ' +
        escapeHtml(err.message || String(err)) +
        '</caption>';
    } finally {
      table.removeAttribute('aria-busy');
    }
  }

  // Build inventory items into HTML table components and inject into DOM
  function buildInventoryList(data) {
    if (!data.length) {
      table.innerHTML = [
        '<caption>No vehicles found for this classification.</caption>',
        '<thead>',
        '<tr><th scope="col">Vehicle</th><th scope="col">Modify</th><th scope="col">Delete</th></tr>',
        '</thead>',
        '<tbody></tbody>'
      ].join('');
      return;
    }

    var html = '';
    html += '<thead>';
    html += '<tr><th scope="col">Vehicle</th><th scope="col">Modify</th><th scope="col">Delete</th></tr>';
    html += '</thead>';
    html += '<tbody>';

    data.forEach(function (v) {
      var id   = v.inv_id;
      var name = safe(v.inv_make) + ' ' + safe(v.inv_model);

      html += '<tr>';
      html += '<td scope="row">' + name + '</td>';
      html += '<td><a href="/inv/edit/' + id + '" title="Click to update">Modify</a></td>';
      html += '<td><a href="/inv/delete/' + id + '" title="Click to delete">Delete</a></td>';
      html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
  }

  // Minimal escaping for caption/error output
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Convert possibly-null values to strings for safe text insertion
  function safe(s) {
    return (s == null) ? '' : String(s);
  }
})();
