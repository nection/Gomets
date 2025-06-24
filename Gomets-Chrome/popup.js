// --- START OF FILE popup.js ---

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const backButton = document.getElementById('back-button');
    let allStoredData = {};

    // --- LÒGICA D'ESBORRAT (sense canvis) ---

    const handleUrlDelete = (event) => {
        event.stopPropagation();
        const urlToDelete = event.currentTarget.dataset.url;
        if (confirm(`Estàs segur que vols esborrar el web "${new URL(urlToDelete).hostname}" i totes les seves notes? Aquesta acció no es pot desfer.`)) {
            chrome.storage.local.remove([urlToDelete, '_urlOrder'], () => { // MODIFICAT: Esborra també l'ordre si cal
                delete allStoredData[urlToDelete];
                // Recalculem l'ordre per si de cas
                if (allStoredData._urlOrder) {
                    allStoredData._urlOrder = allStoredData._urlOrder.filter(u => u !== urlToDelete);
                }
                renderUrlList();
            });
        }
    };

    const handleNoteDelete = (event) => {
        event.stopPropagation();
        const url = event.currentTarget.dataset.url;
        const noteIdToDelete = event.currentTarget.dataset.noteId;

        if (confirm(`Estàs segur que vols esborrar aquesta nota? Aquesta acció no es pot desfer.`)) {
            const currentNotes = allStoredData[url] || [];
            const updatedNotes = currentNotes.filter(note => note.id !== noteIdToDelete);

            // Si la llista de notes queda buida, eliminem la URL sencera
            if (updatedNotes.length === 0) {
                 chrome.storage.local.remove(url, () => {
                    delete allStoredData[url];
                    if (allStoredData._urlOrder) {
                        allStoredData._urlOrder = allStoredData._urlOrder.filter(u => u !== url);
                        chrome.storage.local.set({ '_urlOrder': allStoredData._urlOrder });
                    }
                    renderUrlList();
                });
            } else {
                // Si encara queden notes, només actualitzem la llista
                chrome.storage.local.set({ [url]: updatedNotes }, () => {
                    allStoredData[url] = updatedNotes;
                    renderNoteList(url);
                });
            }
        }
    };

    // --- NOVA LÒGICA DE DRAG-AND-DROP ---

    const makeListSortable = (ulElement, onSortCallback) => {
        let draggedItem = null;

        ulElement.querySelectorAll('li').forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                setTimeout(() => item.classList.add('dragging'), 0);
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                setTimeout(() => {
                    draggedItem.classList.remove('dragging');
                    draggedItem = null;
                }, 0);
                 ulElement.querySelectorAll('li').forEach(li => {
                    li.classList.remove('drag-over-top', 'drag-over-bottom');
                });
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const targetItem = e.currentTarget;
                if (targetItem === draggedItem) return;

                ulElement.querySelectorAll('li').forEach(li => {
                    li.classList.remove('drag-over-top', 'drag-over-bottom');
                });
                
                const bounding = targetItem.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                
                if (e.clientY < offset) {
                    targetItem.classList.add('drag-over-top');
                } else {
                    targetItem.classList.add('drag-over-bottom');
                }
            });

            item.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('drag-over-top', 'drag-over-bottom');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetItem = e.currentTarget;
                targetItem.classList.remove('drag-over-top', 'drag-over-bottom');
                
                if (targetItem !== draggedItem) {
                    const bounding = targetItem.getBoundingClientRect();
                    const offset = bounding.y + (bounding.height / 2);
                    if (e.clientY < offset) {
                        ulElement.insertBefore(draggedItem, targetItem);
                    } else {
                        ulElement.insertBefore(draggedItem, targetItem.nextSibling);
                    }
                    onSortCallback();
                }
            });
        });
    };
    
    // --- LÒGICA DE GUARDAT DE L'ORDRE (NOVA) ---
    
    const saveUrlOrder = () => {
        const ul = container.querySelector('ul');
        const newOrder = Array.from(ul.querySelectorAll('li .item-text')).map(span => span.dataset.url);
        allStoredData['_urlOrder'] = newOrder;
        chrome.storage.local.set({ '_urlOrder': newOrder });
    };

    const saveNoteOrder = (url) => {
        const ul = container.querySelector('ul');
        const newNoteOrderIds = Array.from(ul.querySelectorAll('li .item-text')).map(span => span.dataset.noteId);
        
        // Reordenem l'array de notes original basant-nos en el nou ordre d'IDs
        const originalNotes = allStoredData[url];
        const newOrderedNotes = newNoteOrderIds.map(id => originalNotes.find(note => note.id === id));
        
        allStoredData[url] = newOrderedNotes;
        chrome.storage.local.set({ [url]: newOrderedNotes });
    };


    // --- LÒGICA DE RENDERITZAT (MODIFICADA) ---

    const renderUrlList = () => {
        container.innerHTML = '';
        backButton.classList.add('hidden');
        
        const existingUrls = Object.keys(allStoredData).filter(key => key !== '_urlOrder' && Array.isArray(allStoredData[key]) && allStoredData[key].length > 0);

        if (existingUrls.length === 0) {
            container.innerHTML = '<div id="loading">No tens cap nota guardada.</div>';
            return;
        }

        // Determina l'ordre de les URLs
        let orderedUrls = [];
        if (allStoredData['_urlOrder']) {
            // Filtra l'ordre guardat per incloure només URLs que encara existeixen
            orderedUrls = allStoredData['_urlOrder'].filter(url => existingUrls.includes(url));
        }
        // Afegeix les URLs noves (que no estiguin a l'ordre guardat) al final
        existingUrls.forEach(url => {
            if (!orderedUrls.includes(url)) {
                orderedUrls.push(url);
            }
        });
        
        allStoredData['_urlOrder'] = orderedUrls; // Sincronitza l'ordre intern
        chrome.storage.local.set({ '_urlOrder': orderedUrls });


        const ul = document.createElement('ul');
        orderedUrls.forEach(url => {
            const li = document.createElement('li');
            li.className = 'url-item list-item-container';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            try { textSpan.textContent = new URL(url).hostname; } catch (e) { textSpan.textContent = url; }
            textSpan.title = url;
            textSpan.dataset.url = url;
            textSpan.addEventListener('click', () => { renderNoteList(url); });
            li.appendChild(textSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Esborra aquest web i totes les seves notes';
            deleteBtn.dataset.url = url;
            deleteBtn.addEventListener('click', handleUrlDelete);
            li.appendChild(deleteBtn);
            
            ul.appendChild(li);
        });
        container.appendChild(ul);
        
        // APLICA LA FUNCIONALITAT DE DRAG-AND-DROP
        makeListSortable(ul, saveUrlOrder);
    };

    const renderNoteList = (url) => {
        container.innerHTML = '';
        backButton.classList.remove('hidden');
        const notes = allStoredData[url] || [];

        if (notes.length === 0) {
             renderUrlList();
             return;
        }

        const ul = document.createElement('ul');
        notes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'note-item list-item-container';

            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            const textContent = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : '[Nota buida]';
            textSpan.textContent = textContent;
            textSpan.title = note.content || 'Clica per anar a la nota';
            textSpan.dataset.url = url;
            textSpan.dataset.noteId = note.id;
            textSpan.addEventListener('click', handleNoteClick);
            li.appendChild(textSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Esborra aquesta nota';
            deleteBtn.dataset.url = url;
            deleteBtn.dataset.noteId = note.id;
            deleteBtn.addEventListener('click', handleNoteDelete);
            li.appendChild(deleteBtn);

            ul.appendChild(li);
        });
        container.appendChild(ul);
        
        // APLICA LA FUNCIONALITAT DE DRAG-AND-DROP
        makeListSortable(ul, () => saveNoteOrder(url));
    };

    const handleNoteClick = (event) => {
        const targetUrl = event.currentTarget.dataset.url;
        const noteId = event.currentTarget.dataset.noteId;

        chrome.runtime.sendMessage({
            action: 'handleHighlightRequest',
            url: targetUrl,
            noteId: noteId
        });
        
        window.close();
    };

    // --- INICIALITZACIÓ (sense canvis) ---

    backButton.addEventListener('click', renderUrlList);
    
    chrome.storage.local.get(null, (data) => {
        allStoredData = data;
        renderUrlList();
    });
});
// --- END OF FILE popup.js ---