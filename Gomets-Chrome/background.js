// --- START OF FILE background.js ---

// background.js - El nostre "missatger" i "cervell" central

let pendingHighlights = {}; // Tasques pendents, ara per a TOTES les pestanyes.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // --- ORDRE CENTRALITZADA DES DEL POPUP ---
  // Aquesta és ara l'única ordre que rep del popup.
  if (request.action === 'handleHighlightRequest') {
    const { url, noteId } = request;

    // El background script busca si la pestanya ja existeix.
    chrome.tabs.query({ url: url }).then(tabs => {
      if (tabs.length > 0) {
        // CAS 1: LA PESTANYA JA EXISTEIX
        const tab = tabs[0];
        console.log(`Pestanya existent trobada (${tab.id}). Preparant tasca i recarregant.`);
        
        // Deixem la tasca pendent per a ella
        pendingHighlights[tab.id] = noteId;

        // La posem en primer pla
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });

        // I la recarreguem per assegurar que el content_script s'executa i demana la feina.
        // Això soluciona la "race condition" de que el missatge s'enviï abans que el script estigui llest.
        chrome.tabs.reload(tab.id);

      } else {
        // CAS 2: LA PESTANYA NO EXISTEIX
        console.log(`No s'ha trobat cap pestanya. Creant una de nova per a ${url}.`);
        
        // Creem la pestanya i deixem la tasca pendent per a ella.
        chrome.tabs.create({ url: url, active: true }).then(newTab => {
          console.log(`Tasca de ressaltat preparada per a la nova pestanya ${newTab.id}: nota ${noteId}`);
          pendingHighlights[newTab.id] = noteId;
        });
      }
    });
    
    return true; // Important per a operacions asíncrones.
  }

  // --- PREGUNTA DES DEL CONTENT SCRIPT (ara per a totes les pestanyes activades via popup) ---
  if (request.action === 'getHighlightTask') {
    const tabId = sender.tab.id;
    const noteId = pendingHighlights[tabId];
    
    if (noteId) {
      console.log(`La pestanya ${tabId} demana feina. Enviant ordre per ressaltar ${noteId}.`);
      sendResponse({ noteIdToHighlight: noteId });
      delete pendingHighlights[tabId]; // Netejem la tasca un cop assignada.
    } else {
      sendResponse({}); // No hi ha feina per a aquesta pestanya.
    }
    return true;
  }
});

// --- END OF FILE background.js ---