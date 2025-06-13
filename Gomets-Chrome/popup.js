// --- START OF FILE popup.js ---

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const backButton = document.getElementById('back-button');
    let allStoredData = {};

    // --- LÒGICA D'ESBORRAT ---

    const handleUrlDelete = (event) => {
        event.stopPropagation(); // Evitem que s'activi el clic de l'element <li>
        const urlToDelete = event.currentTarget.dataset.url;
        if (confirm(`Estàs segur que vols esborrar el web "${new URL(urlToDelete).hostname}" i totes les seves notes? Aquesta acció no es pot desfer.`)) {
            // Elimina la clau de l'emmagatzematge de Chrome
            chrome.storage.local.remove(urlToDelete, () => {
                // Actualitza el nostre objecte de dades local
                delete allStoredData[urlToDelete];
                // Renderitza de nou la llista d'URLs
                renderUrlList();
            });
        }
    };

    const handleNoteDelete = (event) => {
        event.stopPropagation(); // Evitem que s'activi el clic de l'element <li>
        const url = event.currentTarget.dataset.url;
        const noteIdToDelete = event.currentTarget.dataset.noteId;

        if (confirm(`Estàs segur que vols esborrar aquesta nota? Aquesta acció no es pot desfer.`)) {
            // Obtenim la llista actual de notes per a aquesta URL
            const currentNotes = allStoredData[url] || [];
            
            // Creem una nova llista filtrant la nota a esborrar
            const updatedNotes = currentNotes.filter(note => note.id !== noteIdToDelete);

            // Guardem la nova llista a l'emmagatzematge
            chrome.storage.local.set({ [url]: updatedNotes }, () => {
                // Actualitzem el nostre objecte de dades local
                allStoredData[url] = updatedNotes;

                // Si ja no queden notes, tornem a la llista de webs.
                // Si en queden, refresquem la llista de notes.
                if (updatedNotes.length === 0) {
                    renderUrlList();
                } else {
                    renderNoteList(url);
                }
            });
        }
    };


    // --- LÒGICA DE RENDERITZAT (MODIFICADA) ---

    const renderUrlList = () => {
        container.innerHTML = '';
        backButton.classList.add('hidden');
        const urls = Object.keys(allStoredData).filter(key => key !== 'pendingHighlight' && Array.isArray(allStoredData[key]) && allStoredData[key].length > 0);
        
        if (urls.length === 0) {
            container.innerHTML = '<div id="loading">No tens cap nota guardada.</div>';
            return;
        }

        const ul = document.createElement('ul');
        urls.forEach(url => {
            const li = document.createElement('li');
            li.className = 'url-item list-item-container';
            
            // Títol del web (clicable)
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            try { textSpan.textContent = new URL(url).hostname; } catch (e) { textSpan.textContent = url; }
            textSpan.title = url;
            textSpan.dataset.url = url;
            textSpan.addEventListener('click', () => { renderNoteList(url); });
            li.appendChild(textSpan);

            // Botó d'esborrar web
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
    };

    const renderNoteList = (url) => {
        container.innerHTML = '';
        backButton.classList.remove('hidden');
        const notes = allStoredData[url] || []; // Afegit per seguretat

        if (notes.length === 0) {
             renderUrlList(); // Si no hi ha notes, torna a la llista principal
             return;
        }

        const ul = document.createElement('ul');
        notes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'note-item list-item-container';

            // Text de la nota (clicable)
            const textSpan = document.createElement('span');
            textSpan.className = 'item-text';
            const textContent = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : '[Nota buida]';
            textSpan.textContent = textContent;
            textSpan.title = note.content || 'Clica per anar a la nota';
            textSpan.dataset.url = url;
            textSpan.dataset.noteId = note.id;
            textSpan.addEventListener('click', handleNoteClick);
            li.appendChild(textSpan);

            // Botó d'esborrar nota
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
    };

    const handleNoteClick = (event) => {
        const targetUrl = event.currentTarget.dataset.url;
        const noteId = event.currentTarget.dataset.noteId;

        // La única responsabilitat del popup: demanar l'acció al background script.
        chrome.runtime.sendMessage({
            action: 'handleHighlightRequest',
            url: targetUrl,
            noteId: noteId
        });
        
        window.close();
    };

    // --- INICIALITZACIÓ ---

    backButton.addEventListener('click', renderUrlList);
    
    chrome.storage.local.get(null, (data) => {
        allStoredData = data;
        renderUrlList();
    });
});

// --- END OF FILE popup.js ---