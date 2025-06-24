document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const backButton = document.getElementById('back-button');
    const searchBox = document.getElementById('search-box');
    const searchEverywhereContainer = document.getElementById('search-everywhere-container');
    const searchEverywhereCheckbox = document.getElementById('search-everywhere-checkbox');

    let allStoredData = {};
    let currentView = {
        type: 'urls', // pot ser 'urls' o 'notes'
        url: null
    };
    // NOU: Variable de control per diferenciar clic de drag
    let isDragging = false; 

    // --- LÒGICA DE CERCA (Funciona com abans) ---

    const performSearch = () => {
        const searchTerm = searchBox.value.toLowerCase().trim();

        if (currentView.type === 'urls') {
            const searchEverywhere = searchEverywhereCheckbox.checked;
            let filteredUrls;

            const orderedUrls = allStoredData['_urlOrder'] 
                ? allStoredData['_urlOrder'].filter(url => allStoredData[url] && allStoredData[url].length > 0)
                : Object.keys(allStoredData).filter(key => key !== '_urlOrder');

            if (!searchTerm) {
                filteredUrls = orderedUrls;
            } else {
                if (searchEverywhere) {
                    filteredUrls = orderedUrls.filter(url => {
                        const urlMatch = url.toLowerCase().includes(searchTerm);
                        if (urlMatch) return true;
                        const notes = allStoredData[url] || [];
                        return notes.some(note => note.content && note.content.toLowerCase().includes(searchTerm));
                    });
                } else {
                    filteredUrls = orderedUrls.filter(url => url.toLowerCase().includes(searchTerm));
                }
            }
            renderUrlList(filteredUrls);

        } else if (currentView.type === 'notes') {
            const notes = allStoredData[currentView.url] || [];
            let filteredNotes;

            if (!searchTerm) {
                filteredNotes = notes;
            } else {
                filteredNotes = notes.filter(note => note.content && note.content.toLowerCase().includes(searchTerm));
            }
            renderNoteList(currentView.url, filteredNotes);
        }
    };

    // --- LÒGICA D'ESBORRAT (Funciona com abans) ---

    const handleUrlDelete = (event) => {
        event.stopPropagation();
        const urlToDelete = event.currentTarget.dataset.url;
        if (confirm(`Estàs segur que vols esborrar el web "${new URL(urlToDelete).hostname}" i totes les seves notes? Aquesta acció no es pot desfer.`)) {
            chrome.storage.local.remove([urlToDelete, '_urlOrder'], () => {
                delete allStoredData[urlToDelete];
                if (allStoredData._urlOrder) {
                    allStoredData._urlOrder = allStoredData._urlOrder.filter(u => u !== urlToDelete);
                }
                searchBox.value = '';
                performSearch();
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

            if (updatedNotes.length === 0) {
                 chrome.storage.local.remove(url, () => {
                    delete allStoredData[url];
                    if (allStoredData._urlOrder) {
                        allStoredData._urlOrder = allStoredData._urlOrder.filter(u => u !== url);
                        chrome.storage.local.set({ '_urlOrder': allStoredData._urlOrder });
                    }
                    goBackToUrlList();
                });
            } else {
                chrome.storage.local.set({ [url]: updatedNotes }, () => {
                    allStoredData[url] = updatedNotes;
                    performSearch();
                });
            }
        }
    };

    // --- LÒGICA DE DRAG-AND-DROP (MODIFICADA per evitar conflictes amb el clic) ---

    const makeListSortable = (ulElement, onSortCallback) => {
        let draggedItem = null;

        ulElement.querySelectorAll('li').forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', (e) => {
                isDragging = true; // Indiquem que comença un arrossegament
                draggedItem = item;
                setTimeout(() => item.classList.add('dragging'), 0);
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                // Esperem una fracció de segon abans de resetejar 'isDragging'
                // per evitar que s'activi un 'click' accidentalment al final.
                setTimeout(() => {
                    isDragging = false; 
                }, 50);

                draggedItem.classList.remove('dragging');
                draggedItem = null;
                
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
    
    // --- LÒGICA DE GUARDAT DE L'ORDRE (Funciona com abans) ---
    
    const saveUrlOrder = () => {
        const ul = container.querySelector('ul');
        const newOrder = Array.from(ul.querySelectorAll('li')).map(li => li.dataset.url);
        allStoredData['_urlOrder'] = newOrder;
        chrome.storage.local.set({ '_urlOrder': newOrder });
    };

    const saveNoteOrder = (url) => {
        const ul = container.querySelector('ul');
        const newNoteOrderIds = Array.from(ul.querySelectorAll('li')).map(li => li.dataset.noteId);
        
        const originalNotes = allStoredData[url];
        const newOrderedNotes = newNoteOrderIds.map(id => originalNotes.find(note => note.id === id));
        
        allStoredData[url] = newOrderedNotes;
        chrome.storage.local.set({ [url]: newOrderedNotes });
    };


    // --- LÒGICA DE RENDERITZAT (MODIFICADA per ampliar l'àrea de clic) ---

    const renderUrlList = (urlsToDisplay = null) => {
        currentView = { type: 'urls', url: null };
        container.innerHTML = '';
        backButton.classList.add('hidden');
        searchEverywhereContainer.classList.remove('hidden');
        
        if (urlsToDisplay === null) {
            const existingUrls = Object.keys(allStoredData).filter(key => key !== '_urlOrder' && Array.isArray(allStoredData[key]) && allStoredData[key].length > 0);
            let orderedUrls = [];
            if (allStoredData['_urlOrder']) {
                orderedUrls = allStoredData['_urlOrder'].filter(url => existingUrls.includes(url));
            }
            existingUrls.forEach(url => {
                if (!orderedUrls.includes(url)) {
                    orderedUrls.push(url);
                }
            });
            urlsToDisplay = orderedUrls;
            allStoredData['_urlOrder'] = urlsToDisplay;
            chrome.storage.local.set({ '_urlOrder': urlsToDisplay });
        }

        if (urlsToDisplay.length === 0) {
            container.innerHTML = '<div id="loading">No s\'han trobat resultats.</div>';
            return;
        }

        const ul = document.createElement('ul');
        urlsToDisplay.forEach(url => {
            const li = document.createElement('li');
            li.className = 'url-item list-item-container';
            li.dataset.url = url; // Afegim les dades a tot el 'li'
            
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            try { textSpan.textContent = new URL(url).hostname; } catch (e) { textSpan.textContent = url; }
            textSpan.title = url;
            li.appendChild(textSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Esborra aquest web i totes les seves notes';
            deleteBtn.dataset.url = url;
            deleteBtn.addEventListener('click', handleUrlDelete);
            li.appendChild(deleteBtn);
            
            // L'event de clic s'assigna a tot el 'li'
            li.addEventListener('click', () => {
                if (isDragging) return; // Evitem el clic si s'està arrossegant
                searchBox.value = '';
                renderNoteList(url);
            });
            
            ul.appendChild(li);
        });
        container.appendChild(ul);
        
        makeListSortable(ul, saveUrlOrder);
    };

    const renderNoteList = (url, notesToDisplay = null) => {
        currentView = { type: 'notes', url: url };
        container.innerHTML = '';
        backButton.classList.remove('hidden');
        searchEverywhereContainer.classList.add('hidden');

        const notes = notesToDisplay === null ? (allStoredData[url] || []) : notesToDisplay;

        if (notes.length === 0) {
             container.innerHTML = '<div id="loading">No s\'han trobat notes.</div>';
             return;
        }

        const ul = document.createElement('ul');
        notes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'note-item list-item-container';
            li.dataset.url = url; // Afegim les dades a tot el 'li'
            li.dataset.noteId = note.id;

            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            const textContent = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : '[Nota buida]';
            textSpan.textContent = textContent;
            textSpan.title = note.content || 'Clica per anar a la nota';
            li.appendChild(textSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Esborra aquesta nota';
            deleteBtn.dataset.url = url;
            deleteBtn.dataset.noteId = note.id;
            deleteBtn.addEventListener('click', handleNoteDelete);
            li.appendChild(deleteBtn);

            // L'event de clic s'assigna a tot el 'li'
            li.addEventListener('click', (event) => {
                if (isDragging) return; // Evitem el clic si s'està arrossegant
                handleNoteClick(event);
            });

            ul.appendChild(li);
        });
        container.appendChild(ul);
        
        makeListSortable(ul, () => saveNoteOrder(url));
    };

    const handleNoteClick = (event) => {
        // Obtenim les dades del 'li' clicat
        const targetUrl = event.currentTarget.dataset.url;
        const noteId = event.currentTarget.dataset.noteId;

        chrome.runtime.sendMessage({
            action: 'handleHighlightRequest',
            url: targetUrl,
            noteId: noteId
        });
        
        window.close();
    };
    
    const goBackToUrlList = () => {
        searchBox.value = '';
        renderUrlList();
    };

    // --- INICIALITZACIÓ (Funciona com abans) ---

    backButton.addEventListener('click', goBackToUrlList);
    searchBox.addEventListener('input', performSearch);
    searchEverywhereCheckbox.addEventListener('change', performSearch);
    
    chrome.storage.local.get(null, (data) => {
        allStoredData = data;
        renderUrlList();
    });
});