// background.js - El nostre "missatger" i "cervell" central

let pendingHighlights = {}; // Tasques per a pestanyes que es crearan des de zero.

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
        console.log(`Pestanya existent trobada (${tab.id}). Enviant missatge directe per ressaltar ${noteId}.`);
        
        // La posem en primer pla
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
        
        // I li enviem l'ordre directa. Aquesta sí que arriba.
        chrome.tabs.sendMessage(tab.id, { action: 'highlightNote', noteId: noteId });

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

  // --- PREGUNTA DES DEL CONTENT SCRIPT (només per a pestanyes noves) ---
  if (request.action === 'getHighlightTask') {
    const tabId = sender.tab.id;
    const noteId = pendingHighlights[tabId];
    
    if (noteId) {
      console.log(`La nova pestanya ${tabId} demana feina. Enviant ordre per ressaltar ${noteId}.`);
      sendResponse({ noteIdToHighlight: noteId });
      delete pendingHighlights[tabId]; // Netejem la tasca un cop assignada.
    } else {
      sendResponse({}); // No hi ha feina per a aquesta pestanya.
    }
    return true;
  }
});