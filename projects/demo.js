(() => {
  const themeButton = document.querySelector('[data-theme-toggle]');
  let savedTheme;
  try {
    savedTheme = localStorage.getItem('theme');
  } catch (error) {
    console.error('Could not read the saved theme preference.', error);
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',
      theme === 'dark' ? '#121316' : '#f7f1e3');
    if (themeButton) {
      const dark = theme === 'dark';
      themeButton.textContent = dark ? 'Light mode' : 'Dark mode';
      themeButton.setAttribute('aria-pressed', String(dark));
    }
  }

  applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (prefersDark ? 'dark' : 'light'));

  themeButton?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', nextTheme);
    } catch (error) {
      console.error('Could not save the theme preference.', error);
    }
    applyTheme(nextTheme);
  });
})();
