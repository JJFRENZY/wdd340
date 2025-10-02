'use strict';

/**
 * inventory.js
 * - Listens for classification <select> changes
 * - Fetches /inv/getInventory/:classification_id (JSON)
 * - Builds an HTML table inside #inventoryDisplay
 */

(function () {
  const select = document.querySelector('#classificationList');
  const table = document.querySelector('#inventoryDisplay');

  if (!select || !table) return;

  // Fetch when the classification changes
  select.addEventListener('change', () => {
    const classification_id = select.value;
    if (!classification_id) {
      table.innerHTML = '';
      return;
    }
    const url = `/inv/getInventory/${encodeURIComponent(classification_id)}`;
    fetchInventory(url);
  });

  // If a classification is already selected (sticky), load it immediately
  if (select.value) {
    const url = `/inv/getInventory/${encodeURIComponent(select.value)}`;
    fetchInventory(url);
  }

  async function fetchInventory(url) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Network response was not OK (HTTP ${res.status})`);
      const data = await res.json();
      // Expecting an array (possibly empty)
      buildInventoryList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('There was a problem:', err);
      table.innerHTML = `<caption class="notice">Error loading inventory: ${escapeHtml(err.message || String(err))}</caption>`;
    }
  }

  // Build inventory items into HTML table components and inject into DOM
  function buildInventoryList(data) {
    if (!data.length) {
      table.innerHTML = `
        <caption>No vehicles found for this classification.</caption>
        <thead>
          <tr><th>Vehicle</th><th scope="col">Modify</th><th scope="col">Delete</th></tr>
        </thead>
        <tbody></tbody>
      `;
      return;
    }

    let html = '';
    html += '<thead>';
    html += '<tr><th scope="col">Vehicle</th><th scope="col">Modify</th><th scope="col">Delete</th></tr>';
    html += '</thead>';
    html += '<tbody>';

    data.forEach((v) => {
      // Defensive defaults
      const id = v.inv_id;
      const name = `${safe(v.inv_make)} ${safe(v.inv_model)}`;
      html += '<tr>';
      html += `<td>${name}</td>`;
      html += `<td><a href="/inv/edit/${id}" title="Click to update">Modify</a></td>`;
      html += `<td><a href="/inv/delete/${id}" title="Click to delete">Delete</a></td>`;
      html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
  }

  // Minimal escaping for caption/error output
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // For table cells that already become text (safer than raw)
  function safe(s) {
    // We don't insert HTML here—just ensure it's a string
    return (s == null) ? '' : String(s);
  }
})();
