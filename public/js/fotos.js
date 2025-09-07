document.addEventListener('DOMContentLoaded', () => {
  // ---- Tabs ----
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active', 'border-green-700', 'text-green-700');
        b.classList.add('border-transparent', 'text-gray-700');
      });

      tabContents.forEach(tc => tc.classList.add('hidden'));

      btn.classList.add('active', 'border-green-700', 'text-green-700');
      btn.classList.remove('border-transparent', 'text-gray-700');

      const tabId = 'tab-' + btn.dataset.tab;
      const selectedTab = document.getElementById(tabId);
      if (selectedTab) selectedTab.classList.remove('hidden');
    });
  });

  // ---- Copy URL buttons ----
  const copyButtons = document.querySelectorAll('.copy-url-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (url) navigator.clipboard.writeText(url);
    });
  });
});
