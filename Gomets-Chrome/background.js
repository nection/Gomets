chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // --- ORDRE DES DEL POPUP ---
  if (request.action === 'handleHighlightRequest') {
    const { url, noteId } = request;
    console.log(`[BG] Rebuda petició per ressaltar ${noteId} a ${url}`);

    // Guardem la tasca associada a la URL. Això és clau per a pestanyes noves.
    chrome.storage.session.set({ ['task_for_' + url]: noteId });

    chrome.tabs.query({ url: url }).then(tabs => {
      if (tabs.length > 0) {
        // CAS 1: LA PESTANYA JA EXISTEIX
        const tab = tabs[0];
        const tabIdStr = tab.id.toString();
        console.log(`[BG] Pestanya existent (${tabIdStr}). Guardant tasca i recarregant.`);
        
        // Guardem la tasca també per a l'ID específic de la pestanya.
        chrome.storage.session.set({ [tabIdStr]: noteId }).then(() => {
          chrome.tabs.update(tab.id, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
          chrome.tabs.reload(tab.id);
        });

      } else {
        // CAS 2: LA PESTANYA NO EXISTEIX
        console.log(`[BG] Creant pestanya nova.`);
        chrome.tabs.create({ url: url, active: true });
      }
    });
    
    return true; // Important per a operacions asíncrones.
  }

  // --- "HANDSHAKE": EL CONTENT SCRIPT AVISA QUAN ESTÀ LLEST ---
  if (request.action === 'contentScriptReady') {
    const tabId = sender.tab.id;
    const tabUrl = sender.tab.url;
    const tabIdStr = tabId.toString();
    const urlTaskKey = 'task_for_' + tabUrl;
    
    console.log(`[BG] El Content Script de la pestanya ${tabId} està llest. Comprovant feina...`);

    // Busquem si hi ha una tasca pendent per a aquest ID de pestanya o per a la seva URL.
    chrome.storage.session.get([tabIdStr, urlTaskKey], (result) => {
      const noteId = result[tabIdStr] || result[urlTaskKey];

      if (noteId) {
        console.log(`[BG] Feina trobada! Enviant ordre per ressaltar ${noteId} a la pestanya ${tabId}.`);
        
        // Enviem l'ordre directa al content script que ens ha avisat.
        chrome.tabs.sendMessage(tabId, { action: 'executeHighlight', noteIdToHighlight: noteId });
        
        // Netejem les tasques un cop assignades.
        chrome.storage.session.remove([tabIdStr, urlTaskKey]);
      } else {
        console.log(`[BG] No hi ha feina pendent per a la pestanya ${tabId}.`);
      }
    });

    return true;
  }
});