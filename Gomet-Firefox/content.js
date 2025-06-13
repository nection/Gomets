// arxiu: content.js
(() => {
    // --- CONFIGURACIÓ DE FIREBASE AMB LES TEVES CLAUS REALS ---
    const firebaseConfig = {
      apiKey: "AIzaSyDaU2c7kWrbrCvV4pl69wQz2V0O-oygskg",
      authDomain: "gomets-15452.firebaseapp.com",
      projectId: "gomets-15452",
      storageBucket: "gomets-15452.firebasestorage.app",
      messagingSenderId: "539094270501",
      appId: "1:539094270501:web:5c6ad4a2b3993cc330f5cc",
      measurementId: "G-6L7SSC4S37"
    };

    // --- LA RESTA DEL CODI (SENSE ABREVIAR, NO ES TOCA RES MÉS) ---
    console.log("Post-it Col·laboratiu (Firefox) v5.1 Carregat.");

    if (typeof firebase === 'undefined') {
        console.error("Firebase no s'ha carregat. Assegura't que els arxius .js estiguin a la carpeta i al manifest.json");
        return;
    }

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const urlPagina = window.location.href;
    const urlCodificada = btoa(urlPagina).replace(/=/g, '');
    
    const PALETA_COLORS = ['#f2c000', '#8bc34a', '#64b5f6', '#e57373', '#ba68c8', '#78909c'];
    const COLOR_CAPCALERA_PER_DEFECTE = PALETA_COLORS[0];

    const estilCSS = document.createElement('style');
    estilCSS.innerHTML = `
        .post-it-note { position: absolute; box-shadow: 5px 5px 7px rgba(33,33,33,.7); border: 1px solid #ccc; font-family: 'Comic Sans MS', cursive, sans-serif; z-index: 9999; display: flex; flex-direction: column; background: #ffc; }
        .post-it-header { padding: 5px 8px; cursor: move; color: #333; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.2); position: relative; }
        .post-it-controls { display: flex; align-items: center; gap: 8px; }
        .post-it-color-picker { width: 16px; height: 16px; border-radius: 50%; cursor: pointer; border: 1px solid #555; }
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
    `;
    document.head.appendChild(estilCSS);

    const llencSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    llencSVG.id = 'post-it-svg-canvas';
    llencSVG.innerHTML = `<defs>${PALETA_COLORS.map(color => `<marker id="arrowhead-${color.substring(1)}" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth"><polygon points="0 0, 10 3.5, 0 7" fill="${color}" /></marker>`).join('')}</defs>`;
    document.body.appendChild(llencSVG);
    
    const botoEsborrarFletxa = document.createElement('div');
    botoEsborrarFletxa.id = 'arrow-delete-button';
    botoEsborrarFletxa.innerHTML = '&times;';
    botoEsborrarFletxa.title = 'Esborra aquesta fletxa';
    document.body.appendChild(botoEsborrarFletxa);
    botoEsborrarFletxa.addEventListener('mouseleave', () => botoEsborrarFletxa.style.display = 'none');
    
    const desarTotesLesNotes = () => {
        const notesALaPagina = document.querySelectorAll('.post-it-note');
        const dadesDeLesNotes = Array.from(notesALaPagina).map(elementNota => ({
            id: elementNota.id, x: elementNota.style.left, y: elementNota.style.top,
            width: elementNota.style.width, height: elementNota.style.height,
            content: elementNota.querySelector('.post-it-textarea').value,
            color: elementNota.dataset.color,
            objectiusFletxa: elementNota.objectiusFletxa || []
        }));
        db.collection("pagines").doc(urlCodificada).set({ notes: dadesDeLesNotes })
            .then(() => console.log("Notes desades a la pissarra central."))
            .catch((error) => console.error("Error en desar les notes: ", error));
    };

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
                    const startX = parseFloat(linia.getAttribute('x1')), startY = parseFloat(linia.getAttribute('y1'));
                    const endX = parseFloat(linia.getAttribute('x2')), endY = parseFloat(linia.getAttribute('y2'));
                    const length = Math.hypot(endX - startX, endY - startY);
                    let posX, posY;
                    if (length < 70) {
                        posX = (startX + endX) / 2;
                        posY = (startY + endY) / 2;
                    } else {
                        const distance_from_tip = 35;
                        const unitX = (startX - endX) / length, unitY = (startY - endY) / length;
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
                    document.body.classList.add('no-text-select');
                    const enMovimentMouse = (moveE) => {
                        objectiu.x = moveE.pageX;
                        objectiu.y = moveE.pageY;
                        renderitzarFletxesPerNota(elementNota);
                    };
                    const enDeixarAnarMouse = () => {
                        document.body.classList.remove('no-text-select');
                        document.removeEventListener('mousemove', enMovimentMouse);
                        document.removeEventListener('mouseup', enDeixarAnarMouse);
                        desarTotesLesNotes();
                    };
                    document.addEventListener('mousemove', enMovimentMouse);
                    document.addEventListener('mouseup', enDeixarAnarMouse);
                });
            }
            const rectangleNota = elementNota.getBoundingClientRect();
            const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2;
            const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2;
            linia.setAttribute('x1', iniciX);
            linia.setAttribute('y1', iniciY);
            linia.setAttribute('x2', objectiu.x);
            linia.setAttribute('y2', objectiu.y);
            linia.setAttribute('stroke', colorNota);
            linia.setAttribute('stroke-width', '3');
            linia.setAttribute('marker-end', idMarcador);
            agafadorPunta.setAttribute('cx', objectiu.x);
            agafadorPunta.setAttribute('cy', objectiu.y);
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
        elementNota.innerHTML = `
            <div class="post-it-header" style="background-color: ${colorCapcalera};"><span>Nota</span><div class="post-it-controls"><div class="post-it-color-picker" title="Canvia el color" style="background-color: ${colorCapcalera}; border: 1px solid #333;"></div><div class="post-it-delete" title="Esborra la nota">&times;</div></div><div class="color-palette">${PALETA_COLORS.map(c => `<div class="color-swatch" style="background-color:${c}" data-color="${c}" title="${c}"></div>`).join('')}</div></div>
            <textarea class="post-it-textarea" placeholder="Escriu aquí..."></textarea>
            <div class="post-it-resizer" title="Arrossega per canviar la mida"></div>
            <div class="post-it-arrow-handle" title="Arrossega per crear una fletxa nova" style="background-color: ${colorCapcalera};"></div>`;
        const areaText = elementNota.querySelector('.post-it-textarea');
        areaText.value = content;
        areaText.addEventListener('input', desarTotesLesNotes);
        const selectorColor = elementNota.querySelector('.post-it-color-picker');
        const paletaColors = elementNota.querySelector('.color-palette');
        selectorColor.addEventListener('click', (e) => { e.stopPropagation(); paletaColors.style.display = paletaColors.style.display === 'flex' ? 'none' : 'flex'; });
        document.addEventListener('click', (e) => { if (!paletaColors.contains(e.target) && e.target !== selectorColor) paletaColors.style.display = 'none'; });
        paletaColors.addEventListener('click', (e) => {
             if (e.target.classList.contains('color-swatch')) {
                e.stopPropagation();
                const nouColor = e.target.dataset.color;
                elementNota.dataset.color = nouColor;
                elementNota.querySelector('.post-it-header').style.backgroundColor = nouColor;
                elementNota.querySelector('.post-it-arrow-handle').style.backgroundColor = nouColor;
                selectorColor.style.backgroundColor = nouColor;
                renderitzarFletxesPerNota(elementNota);
                desarTotesLesNotes();
                paletaColors.style.display = 'none';
            }
        });
        elementNota.querySelector('.post-it-delete').addEventListener('click', (e) => {
             e.stopPropagation();
             if (confirm('Estàs segur que vols esborrar aquesta nota i totes les seves fletxes?')) {
                elementNota.objectiusFletxa.forEach(objectiu => { document.getElementById(objectiu.id)?.remove(); document.getElementById(`handle-for-${objectiu.id}`)?.remove(); });
                elementNota.remove();
                desarTotesLesNotes();
            }
        });
        const capcalera = elementNota.querySelector('.post-it-header');
        capcalera.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.body.classList.add('no-text-select');
            const desfasamentX = e.clientX - elementNota.getBoundingClientRect().left; const desfasamentY = e.clientY - elementNota.getBoundingClientRect().top;
            const enMovimentMouse = (moveE) => { elementNota.style.left = `${moveE.pageX - desfasamentX}px`; elementNota.style.top = `${moveE.pageY - desfasamentY}px`; renderitzarFletxesPerNota(elementNota); };
            const enDeixarAnarMouse = () => { document.body.classList.remove('no-text-select'); document.removeEventListener('mousemove', enMovimentMouse); document.removeEventListener('mouseup', enDeixarAnarMouse); desarTotesLesNotes(); };
            document.addEventListener('mousemove', enMovimentMouse);
            document.addEventListener('mouseup', enDeixarAnarMouse);
        });
        const cantonadaRedimensio = elementNota.querySelector('.post-it-resizer');
        cantonadaRedimensio.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.body.classList.add('no-text-select');
            const xInicial = e.pageX; const yInicial = e.pageY; const ampladaInicial = elementNota.offsetWidth; const alcadaInicial = elementNota.offsetHeight;
            const enMovimentMouse = (moveE) => { const novaAmplada = Math.max(150, ampladaInicial + (moveE.pageX - xInicial)); const novaAlcada = Math.max(100, alcadaInicial + (moveE.pageY - yInicial)); elementNota.style.width = `${novaAmplada}px`; elementNota.style.height = `${novaAlcada}px`; renderitzarFletxesPerNota(elementNota); };
            const enDeixarAnarMouse = () => { document.body.classList.remove('no-text-select'); document.removeEventListener('mousemove', enMovimentMouse); document.removeEventListener('mouseup', enDeixarAnarMouse); desarTotesLesNotes(); };
            document.addEventListener('mousemove', enMovimentMouse);
            document.addEventListener('mouseup', enDeixarAnarMouse);
        });
        const puntCrearFletxa = elementNota.querySelector('.post-it-arrow-handle');
        puntCrearFletxa.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.body.classList.add('no-text-select');
            const fletxaTemporal = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const colorFletxa = elementNota.dataset.color; const idMarcador = `url(#arrowhead-${colorFletxa.substring(1)})`;
            fletxaTemporal.setAttribute('stroke', colorFletxa); fletxaTemporal.setAttribute('stroke-width', '3'); fletxaTemporal.setAttribute('marker-end', idMarcador);
            llencSVG.appendChild(fletxaTemporal);
            const enMovimentMouse = (moveE) => { const rectangleNota = elementNota.getBoundingClientRect(); const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2; const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2; fletxaTemporal.setAttribute('x1', iniciX); fletxaTemporal.setAttribute('y1', iniciY); fletxaTemporal.setAttribute('x2', moveE.pageX); fletxaTemporal.setAttribute('y2', moveE.pageY); };
            const enDeixarAnarMouse = (upE) => {
                document.body.classList.remove('no-text-select');
                fletxaTemporal.remove();
                document.removeEventListener('mousemove', enMovimentMouse);
                document.removeEventListener('mouseup', enDeixarAnarMouse);
                const nouObjectiu = { id: `arrow-${Date.now()}`, x: upE.pageX, y: upE.pageY };
                const rectangleNota = elementNota.getBoundingClientRect();
                const iniciX = rectangleNota.left + window.scrollX + rectangleNota.width / 2; const iniciY = rectangleNota.top + window.scrollY + rectangleNota.height / 2;
                if (Math.hypot(nouObjectiu.x - iniciX, nouObjectiu.y - iniciY) > 30) { elementNota.objectiusFletxa.push(nouObjectiu); renderitzarFletxesPerNota(elementNota); desarTotesLesNotes(); }
            };
            document.addEventListener('mousemove', enMovimentMouse);
            document.addEventListener('mouseup', enDeixarAnarMouse);
        });
        document.body.appendChild(elementNota);
        if (elementNota.objectiusFletxa.length > 0) renderitzarFletxesPerNota(elementNota);
    };
    
    // MODIFICAT: Ara carrega des de Firebase
    const carregarNotes = () => {
        db.collection("pagines").doc(urlCodificada).get()
            .then((doc) => {
                if (doc.exists) {
                    const notesCarregades = doc.data().notes || [];
                    console.log(`Carregant ${notesCarregades.length} notes de la pissarra central.`);
                    notesCarregades.forEach(dadesNota => renderitzarNota(dadesNota));
                } else {
                    console.log("Aquesta pàgina no té notes a la pissarra central.");
                }
            }).catch((error) => {
                console.error("Error en carregar les notes: ", error);
            });
    };
    
    document.addEventListener('click', (e) => {
        if (e.altKey && !e.target.closest('.post-it-note')) {
            e.preventDefault(); e.stopPropagation();
            const novesDadesNota = { id: `post-it-${Date.now()}`, x: `${e.pageX}px`, y: `${e.pageY}px`, content: '' };
            renderitzarNota(novesDadesNota);
            document.getElementById(novesDadesNota.id).querySelector('textarea').focus();
            desarTotesLesNotes();
        }
    });

    carregarNotes();
})();