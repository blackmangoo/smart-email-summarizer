document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save-btn').addEventListener('click', saveOptions);

function saveOptions() {
  const token = document.getElementById('hf-token').value.trim();
  const status = document.getElementById('status');

  if (!token) {
    status.textContent = 'Please enter a valid token.';
    status.style.color = '#e53e3e';
    status.style.backgroundColor = 'rgba(229, 62, 62, 0.1)';
    status.style.borderColor = 'rgba(229, 62, 62, 0.2)';
    status.classList.remove('hidden');

    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
    return;
  }

  chrome.storage.local.set({ hfToken: token }, () => {
    status.textContent = 'Settings saved successfully!';
    status.style.color = 'var(--success)';
    status.style.backgroundColor = 'rgba(56, 161, 105, 0.1)';
    status.style.borderColor = 'rgba(56, 161, 105, 0.2)';
    status.classList.remove('hidden');

    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
  });
}

function restoreOptions() {
  chrome.storage.local.get(['hfToken'], (result) => {
    if (result.hfToken) {
      document.getElementById('hf-token').value = result.hfToken;
    }
  });
}
