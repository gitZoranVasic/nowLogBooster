(function(){
  const enabledKey = 'nowlogbooster_enabled';

  function getCurrentTab(cb){
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs && tabs[0]));
  }

  function setEnabled(flag){
    return new Promise((resolve) => chrome.storage.sync.set({ [enabledKey]: !!flag }, resolve));
  }

  function getEnabled(){
    return new Promise((resolve) => {
      chrome.storage.sync.get({ [enabledKey]: true }, (res) => resolve(!!res[enabledKey]));
    });
  }

  async function init(){
    const toggle = document.getElementById('enabledToggle');
    const enabled = await getEnabled();
    toggle.checked = enabled;

    toggle.addEventListener('change', async () => {
      await setEnabled(toggle.checked);
      // reload current tab to apply
      getCurrentTab((tab) => {
        if (tab && tab.id) chrome.tabs.reload(tab.id);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
