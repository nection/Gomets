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
    

    /* ---------- EINA ANTIBOJA: valida I “clampa” coordenades ---------- */
    const segures = (x, y, refX, refY) => {
    const MAX_DIST = 8000;                // límit perquè la línia no s’allargui infinit
    const esFi = Number.isFinite(x) && Number.isFinite(y);
    const massaLuny = Math.hypot(x - refX, y - refY) > MAX_DIST;
    return esFi && !massaLuny ? [x, y] : [refX, refY];
    };


    // --- LÒGICA DE LES FLETXES ---
    const renderitzarFletxesPerNota = (elementNota) => {

    /* Helper: valida i “clampa” coordenades                       */
    const segures = (x, y, refX, refY) => {
        const MAX_DIST = 3000;                // ≈ 2 pantalles 4K d’alçada
        const invalid  = !Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0);
        const massaLuny = Math.hypot(x - refX, y - refY) > MAX_DIST;
        return (invalid || massaLuny) ? [refX, refY] : [x, y];
    };

    const idNota     = elementNota.id;
    const colorNota  = elementNota.dataset.color || COLOR_CAPCALERA_PER_DEFECTE;
    const idMarcador = `url(#arrowhead-${colorNota.substring(1)})`;

    /* 1) Elimina fletxes esborrades de la llista ---------------- */
    document.querySelectorAll(`[data-note-id="${idNota}"]`).forEach(svgEl => {
        if (!elementNota.objectiusFletxa.some(o => o.id === svgEl.dataset.arrowId)) svgEl.remove();
    });

    /* 2) Processa cada objectiu --------------------------------- */
    elementNota.objectiusFletxa.forEach(objectiu => {

        /* -- Creació “lazy” de la línia i la punta --------------- */
        let linia = document.getElementById(objectiu.id);
        let punta = document.getElementById(`handle-for-${objectiu.id}`);

        if (!linia) {
            linia = document.createElementNS("http://www.w3.org/2000/svg", "line");
            linia.id              = objectiu.id;
            linia.dataset.noteId  = idNota;
            linia.dataset.arrowId = objectiu.id;
            llencSVG.appendChild(linia);

            punta = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            punta.id              = `handle-for-${objectiu.id}`;
            punta.dataset.noteId  = idNota;
            punta.dataset.arrowId = objectiu.id;
            punta.setAttribute('r', '15');
            punta.style.fill   = 'transparent';
            punta.style.cursor = 'move';
            llencSVG.appendChild(punta);

            /* --- LISTENERS originals: esborrar + arrossegar ------- */
            linia.addEventListener('mouseenter', () => {
                const x1 = +linia.getAttribute('x1'), y1 = +linia.getAttribute('y1');
                const x2 = +linia.getAttribute('x2'), y2 = +linia.getAttribute('y2');
                const d  = Math.hypot(x2 - x1, y2 - y1);

                const posX = d < 70 ? (x1 + x2) / 2 : x2 + (x1 - x2) / d * 35;
                const posY = d < 70 ? (y1 + y2) / 2 : y2 + (y1 - y2) / d * 35;

                botoEsborrarFletxa.style.left   = `${posX - 10}px`;
                botoEsborrarFletxa.style.top    = `${posY - 10}px`;
                botoEsborrarFletxa.style.display = 'block';
                botoEsborrarFletxa.onclick = () => {
                    elementNota.objectiusFletxa = elementNota.objectiusFletxa.filter(o => o.id !== objectiu.id);
                    linia.remove(); punta.remove();
                    botoEsborrarFletxa.style.display = 'none';
                    desarTotesLesNotes();
                };
            });
            linia.addEventListener('mouseleave', (e) => {
                if (e.relatedTarget !== botoEsborrarFletxa) botoEsborrarFletxa.style.display = 'none';
            });

            punta.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                document.body.classList.add('no-text-select', 'post-it-dragging-active');

                const moure = mv => {
                    objectiu.lastX = mv.pageX; objectiu.lastY = mv.pageY;
                    const rN = elementNota.getBoundingClientRect();
                    const cx = rN.left + window.scrollX + rN.width / 2;
                    const cy = rN.top  + window.scrollY + rN.height / 2;
                    linia.setAttribute('x1', cx);   linia.setAttribute('y1', cy);
                    linia.setAttribute('x2', mv.pageX);
                    linia.setAttribute('y2', mv.pageY);
                    punta.setAttribute('cx', mv.pageX);
                    punta.setAttribute('cy', mv.pageY);
                };

                const deixar = up => {
                    document.body.classList.remove('no-text-select', 'post-it-dragging-active');
                    document.removeEventListener('mousemove', moure);
                    document.removeEventListener('mouseup', deixar);

                    llencSVG.style.pointerEvents = 'none';
                    const elDesti = document.elementFromPoint(up.clientX, up.clientY);
                    llencSVG.style.pointerEvents = 'auto';

                    if (elDesti && !['body','html'].includes(elDesti.tagName.toLowerCase())) {
                        const sel = generarSelectorCSS(elDesti);
                        const r   = elDesti.getBoundingClientRect();
                        objectiu.selector       = sel;
                        objectiu.offsetXPercent = r.width  ? (up.pageX - (r.left + window.scrollX)) / r.width  : 0.5;
                        objectiu.offsetYPercent = r.height ? (up.pageY - (r.top  + window.scrollY)) / r.height : 0.5;
                    } else {
                        delete objectiu.selector; delete objectiu.offsetXPercent; delete objectiu.offsetYPercent;
                    }
                    desarTotesLesNotes();
                };

                document.addEventListener('mousemove', moure);
                document.addEventListener('mouseup', deixar);
            });
        }

        /* -- Punt d’origen (centre de la nota) --------------------- */
        const rN = elementNota.getBoundingClientRect();
        const x0 = rN.left + window.scrollX + rN.width  / 2;
        const y0 = rN.top  + window.scrollY + rN.height / 2;

        /* -- Punt final robust ------------------------------------- */
        let xf, yf;
        const elDesti = objectiu.selector && document.querySelector(objectiu.selector);

        if (elDesti) {
            const rD = elDesti.getBoundingClientRect();
            if (rD.width && rD.height) {
                if (typeof objectiu.offsetXPercent === 'number' && typeof objectiu.offsetYPercent === 'number') {
                    xf = rD.left + window.scrollX + rD.width  * objectiu.offsetXPercent;
                    yf = rD.top  + window.scrollY + rD.height * objectiu.offsetYPercent;
                } else {
                    xf = rD.left + window.scrollX + (objectiu.offsetX || 0);
                    yf = rD.top  + window.scrollY + (objectiu.offsetY || 0);
                }
                [xf, yf] = segures(xf, yf, objectiu.lastX ?? x0, objectiu.lastY ?? y0);
                objectiu.lastX = xf; objectiu.lastY = yf;
            }
        }

        /* Fallback si destí invàlid / desaparegut ------------------ */
        [xf, yf] = segures(
            xf ?? objectiu.lastX,
            yf ?? objectiu.lastY,
            x0, y0
        );

        /* -- Dibuixa ---------------------------------------------- */
        linia.setAttribute('x1', x0); linia.setAttribute('y1', y0);
        linia.setAttribute('x2', xf); linia.setAttribute('y2', yf);
        linia.setAttribute('stroke', colorNota);
        linia.setAttribute('stroke-width', '3');
        linia.setAttribute('marker-end', idMarcador);

        punta.setAttribute('cx', xf); punta.setAttribute('cy', yf);
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