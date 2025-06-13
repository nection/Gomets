// --- START OF FILE content.js ---

// arxiu: content.js
(() => {
    console.log("Gomets 1.0");

    const urlPagina = window.location.href;
    const PALETA_COLORS = ['#f2c000', '#8bc34a', '#64b5f6', '#e57373', '#ba68c8', '#78909c'];
    const COLOR_CAPCALERA_PER_DEFECTE = PALETA_COLORS[0];

    // --- Funcions de renderitzat i estil ---
    const generarSelectorCSS = (el) => { if (!(el instanceof Element)) return; const parts = []; while (el.nodeType === Node.ELEMENT_NODE) { let selectorPart = el.nodeName.toLowerCase(); if (el.id) { selectorPart += '#' + el.id; parts.unshift(selectorPart); break; } else { let germans = el.parentNode.childNodes; let comptador = 0; for (let i = 0; i < germans.length; i++) { let germa = germans[i]; if (germa.nodeType === Node.ELEMENT_NODE) { comptador++; if (germa === el) { selectorPart += `:nth-child(${comptador})`; break; } } } } parts.unshift(selectorPart); el = el.parentNode; if (el.nodeName.toLowerCase() === 'body') break; } return parts.join(' > '); };
    
    // **CANVI CLAU 1: AFEGIR ESTIL PER DESACTIVAR IFRAMES DURANT L'ARROSSEGAMENT**
    const estilCSS = document.createElement('style'); estilCSS.innerHTML = ` 
        .post-it-note { position: absolute; box-shadow: 5px 5px 7px rgba(33,33,33,.7); border: 1px solid #ccc; font-family: 'Comic Sans MS', cursive, sans-serif; z-index: 9999; display: flex; flex-direction: column; background: #ffc; transition: transform 0.3s ease, box-shadow 0.3s ease; } 
        .post-it-header { padding: 5px 8px; cursor: move; color: #333; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.2); position: relative; } 
        .post-it-controls { display: flex; align-items: center; gap: 8px; } .post-it-color-picker { width: 16px; height: 16px; border-radius: 50%; cursor: pointer; border: 1px solid #555; } 
        .color-palette { position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ccc; padding: 5px; display: none; flex-wrap: wrap; gap: 5px; box-shadow: 3px 3px 5px rgba(0,0,0,0.2); z-index: 10001; width: 75px; } 
        .color-swatch { width: 20px; height: 20px; cursor: pointer; border-radius: 3px; border: 1px solid #eee; } 
        .post-it-delete { cursor: pointer; color: white; background: red; border-radius: 50%; width: 18px; height: 18px; line-height: 18px; text-align: center; font-weight: bold; } 
        .post-it-textarea { flex-grow: 1; background: transparent; border: none; resize: none; padding: 10px; font-size: 16px; outline: none; box-sizing: border-box; width: 100%; color: #333; } 
        .post-it-resizer { position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; cursor: se-resize; background: repeating-linear-gradient(135deg, #e0b000, #e0b000 2px, #ffc 2px, #ffc 4px); } 
        .post-it-arrow-handle { position: absolute; top: -12px; left: calc(50% - 12px); width: 24px; height: 24px; border-radius: 50%; cursor: crosshair; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); } 
        #post-it-svg-canvas { position: absolute; top: 0; left: 0; width: ${document.body.scrollWidth}px; height: ${document.body.scrollHeight}px; pointer-events: none; z-index: 9998; } 
        #arrow-delete-button { position: absolute; display: none; cursor: pointer; z-index: 10002; width: 20px; height: 20px; background: red; color: white; border-radius: 50%; text-align: center; line-height: 20px; font-weight: bold; font-family: monospace; pointer-events: all; box-shadow: 0 0 4px white; } 
        #post-it-svg-canvas line, #post-it-svg-canvas circle { pointer-events: auto; } 
        .no-text-select { -webkit-user-select: none; -ms-user-select: none; user-select: none; } 
        body.post-it-dragging-active a, body.post-it-dragging-active img { pointer-events: none; -webkit-user-drag: none; user-drag: none; }
        body.post-it-dragging-active iframe { pointer-events: none !important; } /* <-- AQUESTA ÉS LA LÍNIA MÀGICA */
        .post-it-highlighted { outline: 4px solid #ff00ff !important; box-shadow: 0 0 25px 15px rgba(255, 0, 255, 0.7) !important; animation: post-it-pulse 1.5s infinite; z-index: 10000 !important; } 
        @keyframes post-it-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } } 
    `; document.head.appendChild(estilCSS);
    
    const llencSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg"); llencSVG.id = 'post-it-svg-canvas'; llencSVG.innerHTML = `<defs>${PALETA_COLORS.map(color => `<marker id="arrowhead-${color.substring(1)}" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth"><polygon points="0 0, 10 3.5, 0 7" fill="${color}" /></marker>`).join('')}</defs>`; document.body.appendChild(llencSVG);
    const botoEsborrarFletxa = document.createElement('div'); botoEsborrarFletxa.id = 'arrow-delete-button'; botoEsborrarFletxa.innerHTML = '×'; botoEsborrarFletxa.title = 'Esborra aquesta fletxa'; document.body.appendChild(botoEsborrarFletxa); botoEsborrarFletxa.addEventListener('mouseleave', () => botoEsborrarFletxa.style.display = 'none');
    const desarTotesLesNotes = () => { const notesALaPagina = document.querySelectorAll('.post-it-note'); const dadesDeLesNotes = Array.from(notesALaPagina).map(elementNota => ({ id: elementNota.id, x: elementNota.style.left, y: elementNota.style.top, width: elementNota.style.width, height: elementNota.style.height, content: elementNota.querySelector('.post-it-textarea').value, color: elementNota.dataset.color, objectiusFletxa: elementNota.objectiusFletxa || [] })); chrome.storage.local.set({ [urlPagina]: dadesDeLesNotes }); };
    
    // --- LÒGICA DE LES FLETXES ---
    const renderitzarFletxesPerNota = (elementNota) => {
        const idNota = elementNota.id;
        const colorNota = elementNota.dataset.color || COLOR_CAPCALERA_PER_DEFECTE;
        const idMarcador = `url(#arrowhead-${colorNota.substring(1)})`;
        const fletxesActualsSVG = document.querySelectorAll(`[data-note-id="${idNota}"]`);
        fletxesActualsSVG.forEach(elementSVG => {
            const idObjectiu = elementSVG.dataset.arrowId;
            if (!elementNota.objectiusFletxa.some(o => o.id === idObjectiu)) elementSVG.remove();
        });

        elementNota.objectiusFletxa.forEach(objectiu => {
            let linia = document.getElementById(objectiu.id);
            let agafadorPunta = document.getElementById(`handle-for-${objectiu.id}`);
            if (!linia) {
                linia = document.createElementNS("http://www.w3.org/2000/svg", "line");
                linia.id = objectiu.id;
                linia.dataset.noteId = idNota;
                linia.dataset.arrowId = objectiu.id;
                llencSVG.appendChild(linia);
                agafadorPunta = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                agafadorPunta.id = `handle-for-${objectiu.id}`;
                agafadorPunta.dataset.noteId = idNota;
                agafadorPunta.dataset.arrowId = objectiu.id;
                agafadorPunta.setAttribute('r', '15');
                agafadorPunta.style.fill = 'transparent';
                agafadorPunta.style.cursor = 'move';
                llencSVG.appendChild(agafadorPunta);

                linia.addEventListener('mouseenter', () => {
                    const startX = parseFloat(linia.getAttribute('x1'));
                    const startY = parseFloat(linia.getAttribute('y1'));
                    const endX = parseFloat(linia.getAttribute('x2'));
                    const endY = parseFloat(linia.getAttribute('y2'));
                    const length = Math.hypot(endX - startX, endY - startY);
                    let posX, posY;
                    if (length < 70) {
                        posX = (startX + endX) / 2;
                        posY = (startY + endY) / 2;
                    } else {
                        const distance_from_tip = 35;
                        const unitX = (startX - endX) / length;
                        const unitY = (startY - endY) / length;
                        posX = endX + unitX * distance_from_tip;
                        posY = endY + unitY * distance_from_tip;
                    }
                    botoEsborrarFletxa.style.left = `${posX - 10}px`;
                    botoEsborrarFletxa.style.top = `${posY - 10}px`;
                    botoEsborrarFletxa.style.display = 'block';
                    botoEsborrarFletxa.onclick = () => {
                        elementNota.objectiusFletxa = elementNota.objectiusFletxa.filter(t => t.id !== objectiu.id);
                        linia.remove();
                        agafadorPunta.remove();
                        botoEsborrarFletxa.style.display = 'none';
                        desarTotesLesNotes();
                    };
                });
                linia.addEventListener('mouseleave', (e) => {
                    if (e.relatedTarget !== botoEsborrarFletxa) botoEsborrarFletxa.style.display = 'none';
                });

                agafadorPunta.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    document.body.classList.add('no-text-select', 'post-it-dragging-active');
                    
                    const enMovimentMouse = (moveE) => {
                        objectiu.lastX = moveE.pageX;
                        objectiu.lastY = moveE.pageY;

                        const rectangleNota = elementNota.getBoundingClientRect();
                        const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2;
                        const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2;
                        linia.setAttribute('x1', iniciX);
                        linia.setAttribute('y1', iniciY);
                        linia.setAttribute('x2', moveE.pageX);
                        linia.setAttribute('y2', moveE.pageY);
                        agafadorPunta.setAttribute('cx', moveE.pageX);
                        agafadorPunta.setAttribute('cy', moveE.pageY);
                    };

                    const enDeixarAnarMouse = (upE) => {
                        document.body.classList.remove('no-text-select', 'post-it-dragging-active');
                        document.removeEventListener('mousemove', enMovimentMouse);
                        document.removeEventListener('mouseup', enDeixarAnarMouse);
                        
                        llencSVG.style.pointerEvents = 'none';
                        const elementDesti = document.elementFromPoint(upE.clientX, upE.clientY);
                        llencSVG.style.pointerEvents = 'auto';

                        if (elementDesti && elementDesti.tagName.toLowerCase() !== 'body' && elementDesti.tagName.toLowerCase() !== 'html') {
                            const selector = generarSelectorCSS(elementDesti);
                            const rectDesti = elementDesti.getBoundingClientRect();
                            objectiu.selector = selector;
                            objectiu.offsetXPercent = rectDesti.width > 0 ? (upE.pageX - (rectDesti.left + window.scrollX)) / rectDesti.width : 0.5;
                            objectiu.offsetYPercent = rectDesti.height > 0 ? (upE.pageY - (rectDesti.top + window.scrollY)) / rectDesti.height : 0.5;
                        } else {
                            delete objectiu.selector;
                            delete objectiu.offsetXPercent;
                            delete objectiu.offsetYPercent;
                        }
                        
                        desarTotesLesNotes();
                    };
                    document.addEventListener('mousemove', enMovimentMouse);
                    document.addEventListener('mouseup', enDeixarAnarMouse);
                });
            }

            const rectangleNota = elementNota.getBoundingClientRect();
            const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2;
            const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2;
            let finalX, finalY;
            const elementDesti = objectiu.selector ? document.querySelector(objectiu.selector) : null;
            
            if (elementDesti) {
                const rectDesti = elementDesti.getBoundingClientRect();
                if (typeof objectiu.offsetXPercent === 'number' && typeof objectiu.offsetYPercent === 'number') {
                    finalX = rectDesti.left + window.scrollX + (rectDesti.width * objectiu.offsetXPercent);
                    finalY = rectDesti.top + window.scrollY + (rectDesti.height * objectiu.offsetYPercent);
                } else {
                    finalX = rectDesti.left + window.scrollX + (objectiu.offsetX || 0);
                    finalY = rectDesti.top + window.scrollY + (objectiu.offsetY || 0);
                }
                objectiu.lastX = finalX;
                objectiu.lastY = finalY;
            } else {
                finalX = objectiu.lastX;
                finalY = objectiu.lastY;
            }
            linia.setAttribute('x1', iniciX);
            linia.setAttribute('y1', iniciY);
            linia.setAttribute('x2', finalX);
            linia.setAttribute('y2', finalY);
            linia.setAttribute('stroke', colorNota);
            linia.setAttribute('stroke-width', '3');
            linia.setAttribute('marker-end', idMarcador);
            agafadorPunta.setAttribute('cx', finalX);
            agafadorPunta.setAttribute('cy', finalY);
        });
    };

    const renderitzarNota = (dadesNota) => {
        const { id, x, y, width = '200px', height = '200px', content, color: colorCapcalera = COLOR_CAPCALERA_PER_DEFECTE, objectiusFletxa = [] } = dadesNota;
        const elementNota = document.createElement('div');
        elementNota.id = id;
        elementNota.className = 'post-it-note';
        elementNota.style.left = x;
        elementNota.style.top = y;
        elementNota.style.width = width;
        elementNota.style.height = height;
        elementNota.dataset.color = colorCapcalera;
        elementNota.objectiusFletxa = objectiusFletxa;
        elementNota.innerHTML = ` <div class="post-it-header" style="background-color: ${colorCapcalera};"> <span>Nota</span> <div class="post-it-controls"> <div class="post-it-color-picker" title="Canvia el color" style="background-color: ${colorCapcalera}; border: 1px solid #333;"></div> <div class="post-it-delete" title="Esborra la nota">×</div> </div> <div class="color-palette">${PALETA_COLORS.map(c => `<div class="color-swatch" style="background-color:${c}" data-color="${c}" title="${c}"></div>`).join('')}</div> </div> <textarea class="post-it-textarea" placeholder="Escriu aquí..."></textarea> <div class="post-it-resizer" title="Arrossega per canviar la mida"></div> <div class="post-it-arrow-handle" title="Arrossega per crear una fletxa nova" style="background-color: ${colorCapcalera};"></div>`;
        const areaText = elementNota.querySelector('.post-it-textarea');
        areaText.value = content;
        areaText.addEventListener('input', desarTotesLesNotes);
        const selectorColor = elementNota.querySelector('.post-it-color-picker');
        const paletaColors = elementNota.querySelector('.color-palette');
        selectorColor.addEventListener('click', (e) => { e.stopPropagation(); paletaColors.style.display = paletaColors.style.display === 'flex' ? 'none' : 'flex'; });
        document.addEventListener('click', (e) => { if (!paletaColors.contains(e.target) && e.target !== selectorColor) paletaColors.style.display = 'none'; });
        paletaColors.addEventListener('click', (e) => { if (e.target.classList.contains('color-swatch')) { e.stopPropagation(); const nouColor = e.target.dataset.color; elementNota.dataset.color = nouColor; elementNota.querySelector('.post-it-header').style.backgroundColor = nouColor; elementNota.querySelector('.post-it-arrow-handle').style.backgroundColor = nouColor; selectorColor.style.backgroundColor = nouColor; renderitzarFletxesPerNota(elementNota); desarTotesLesNotes(); paletaColors.style.display = 'none'; } });
        elementNota.querySelector('.post-it-delete').addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Estàs segur que vols esborrar aquesta nota i totes les seves fletxes?')) { elementNota.objectiusFletxa.forEach(objectiu => { document.getElementById(objectiu.id)?.remove(); document.getElementById(`handle-for-${objectiu.id}`)?.remove(); }); elementNota.remove(); desarTotesLesNotes(); } });
        
        // **CANVI CLAU 2: APLICAR CLASSE AL 'BODY' QUAN S'ARROSSEGA**
        const capcalera = elementNota.querySelector('.post-it-header');
        capcalera.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.body.classList.add('no-text-select', 'post-it-dragging-active'); // <-- Afegeix classe al body
            const desfasamentX = e.clientX - elementNota.getBoundingClientRect().left;
            const desfasamentY = e.clientY - elementNota.getBoundingClientRect().top;
            const enMovimentMouse = (moveE) => { elementNota.style.left = `${moveE.pageX - desfasamentX}px`; elementNota.style.top = `${moveE.pageY - desfasamentY}px`; renderitzarFletxesPerNota(elementNota); };
            const enDeixarAnarMouse = () => {
                document.body.classList.remove('no-text-select', 'post-it-dragging-active'); // <-- Treu classe del body
                document.removeEventListener('mousemove', enMovimentMouse);
                document.removeEventListener('mouseup', enDeixarAnarMouse);
                desarTotesLesNotes();
            };
            document.addEventListener('mousemove', enMovimentMouse);
            document.addEventListener('mouseup', enDeixarAnarMouse);
        });
        
        const cantonadaRedimensio = elementNota.querySelector('.post-it-resizer');
        cantonadaRedimensio.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.body.classList.add('no-text-select', 'post-it-dragging-active'); // <-- Afegeix classe al body
            const xInicial = e.pageX;
            const yInicial = e.pageY;
            const ampladaInicial = elementNota.offsetWidth;
            const alcadaInicial = elementNota.offsetHeight;
            const enMovimentMouse = (moveE) => { const novaAmplada = Math.max(150, ampladaInicial + (moveE.pageX - xInicial)); const novaAlcada = Math.max(100, alcadaInicial + (moveE.pageY - yInicial)); elementNota.style.width = `${novaAmplada}px`; elementNota.style.height = `${novaAlcada}px`; renderitzarFletxesPerNota(elementNota); };
            const enDeixarAnarMouse = () => {
                document.body.classList.remove('no-text-select', 'post-it-dragging-active'); // <-- Treu classe del body
                document.removeEventListener('mousemove', enMovimentMouse);
                document.removeEventListener('mouseup', enDeixarAnarMouse);
                desarTotesLesNotes();
            };
            document.addEventListener('mousemove', enMovimentMouse);
            document.addEventListener('mouseup', enDeixarAnarMouse);
        });
        
        const puntCrearFletxa = elementNota.querySelector('.post-it-arrow-handle');
        puntCrearFletxa.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.body.classList.add('no-text-select', 'post-it-dragging-active'); // <-- Afegeix classe al body
            const fletxaTemporal = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const colorFletxa = elementNota.dataset.color;
            const idMarcador = `url(#arrowhead-${colorFletxa.substring(1)})`;
            fletxaTemporal.setAttribute('stroke', colorFletxa);
            fletxaTemporal.setAttribute('stroke-width', '3');
            fletxaTemporal.setAttribute('marker-end', idMarcador);
            llencSVG.appendChild(fletxaTemporal);
            const enMovimentMouse = (moveE) => {
                const rectangleNota = elementNota.getBoundingClientRect();
                const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2;
                const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2;
                fletxaTemporal.setAttribute('x1', iniciX);
                fletxaTemporal.setAttribute('y1', iniciY);
                fletxaTemporal.setAttribute('x2', moveE.pageX);
                fletxaTemporal.setAttribute('y2', moveE.pageY);
            };
            const enDeixarAnarMouse = (upE) => {
                document.body.classList.remove('no-text-select', 'post-it-dragging-active'); // <-- Treu classe del body
                fletxaTemporal.remove();
                document.removeEventListener('mousemove', enMovimentMouse);
                document.removeEventListener('mouseup', enDeixarAnarMouse);
                const rectangleNota = elementNota.getBoundingClientRect();
                const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2;
                const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2;
                if (Math.hypot(upE.pageX - iniciX, upE.pageY - iniciY) > 30) {
                    llencSVG.style.pointerEvents = 'none';
                    const elementDesti = document.elementFromPoint(upE.clientX, upE.clientY);
                    llencSVG.style.pointerEvents = 'auto';

                    const nouObjectiu = {
                        id: `arrow-${Date.now()}`,
                        lastX: upE.pageX,
                        lastY: upE.pageY,
                    };

                    if (elementDesti && elementDesti.tagName.toLowerCase() !== 'body' && elementDesti.tagName.toLowerCase() !== 'html') {
                        nouObjectiu.selector = generarSelectorCSS(elementDesti);
                        const rectDesti = elementDesti.getBoundingClientRect();
                        nouObjectiu.offsetXPercent = rectDesti.width > 0 ? (upE.pageX - (rectDesti.left + window.scrollX)) / rectDesti.width : 0.5;
                        nouObjectiu.offsetYPercent = rectDesti.height > 0 ? (upE.pageY - (rectDesti.top + window.scrollY)) / rectDesti.height : 0.5;
                    }

                    elementNota.objectiusFletxa.push(nouObjectiu);
                    renderitzarFletxesPerNota(elementNota);
                    desarTotesLesNotes();
                }
            };
            document.addEventListener('mousemove', enMovimentMouse);
            document.addEventListener('mouseup', enDeixarAnarMouse);
        });

        document.body.appendChild(elementNota);
        if (elementNota.objectiusFletxa.length > 0) {
            setTimeout(() => renderitzarFletxesPerNota(elementNota), 100);
        }
    };

    // --- NOVA LÒGICA DE RESSALTAT CENTRALITZADA ---

    const executarRessaltat = (noteId) => {
        const notesRessaltadesAbans = document.querySelectorAll('.post-it-highlighted');
        notesRessaltadesAbans.forEach(n => n.classList.remove('post-it-highlighted'));

        const noteElement = document.getElementById(noteId);
        if (noteElement) {
            noteElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            noteElement.classList.add('post-it-highlighted');

            const eliminarRessaltatAlClic = (event) => {
                if (noteElement.contains(event.target)) return;
                noteElement.classList.remove('post-it-highlighted');
                document.body.removeEventListener('click', eliminarRessaltatAlClic, { capture: true });
            };
            document.body.addEventListener('click', eliminarRessaltatAlClic, { capture: true });
        } else {
            console.error(`Error: No s'ha trobat l'element ${noteId} per ressaltar.`);
        }
    };

    // MÈTODE 1: Escolta missatges directes (per a pestanyes ja obertes).
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'highlightNote') {
            executarRessaltat(request.noteId);
            sendResponse({ status: 'ok' });
        }
    });

    // MÈTODE 2: Pregunta al "missatger" si hi ha feina pendent per a aquesta pestanya.
    const demanarTascaPendent = () => {
        chrome.runtime.sendMessage({ action: 'getHighlightTask' }, (response) => {
            if (response && response.noteIdToHighlight) {
                console.log(`Rebuda ordre del missatger de ressaltar: ${response.noteIdToHighlight}`);
                setTimeout(() => executarRessaltat(response.noteIdToHighlight), 100);
            }
        });
    };

    const carregarNotes = () => {
        chrome.storage.local.get([urlPagina], (resultat) => {
            const notesCarregades = resultat[urlPagina] || [];
            if (notesCarregades.length > 0) console.log(`Carregant ${notesCarregades.length} notes.`);
            notesCarregades.forEach(dadesNota => renderitzarNota(dadesNota));
            
            demanarTascaPendent();
            
            let resizeTimeout;
            const debouncedRedraw = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(redibuixarTotesLesFletxes, 100);
            };
            window.addEventListener('resize', debouncedRedraw);
            window.addEventListener('scroll', redibuixarTotesLesFletxes);
        });
    };
    
    const redibuixarTotesLesFletxes = () => {
        llencSVG.style.width = `${document.body.scrollWidth}px`;
        llencSVG.style.height = `${document.body.scrollHeight}px`;
        
        const totesLesNotes = document.querySelectorAll('.post-it-note');
        totesLesNotes.forEach(nota => {
            if (nota.objectiusFletxa && nota.objectiusFletxa.length > 0) {
                renderitzarFletxesPerNota(nota);
            }
        });
    };
    document.addEventListener('click', (e) => { if (e.altKey && !e.target.closest('.post-it-note')) { e.preventDefault(); e.stopPropagation(); const novesDadesNota = { id: `post-it-${Date.now()}`, x: `${e.pageX}px`, y: `${e.pageY}px`, content: '' }; renderitzarNota(novesDadesNota); document.getElementById(novesDadesNota.id).querySelector('textarea').focus(); desarTotesLesNotes(); } });

    carregarNotes();

})();

// --- END OF FILE content.js ---