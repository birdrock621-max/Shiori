(() => {
  try {
    const value = localStorage.getItem('shiori-theme');
    document.documentElement.dataset.theme = ['auto', 'light', 'dark'].includes(value) ? value : 'auto';
  } catch {
    document.documentElement.dataset.theme = 'auto';
  }
})();
