// Gestor de Iniciativas - Lógica Principal (Premium UI)
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // ─── Referencias DOM ──────────────────────
    const views = {
        dashboard: document.getElementById('dashboard-view'),
        form: document.getElementById('form-view')
    };
    
    // Botones navegación
    const navBtns = document.querySelectorAll('.nav-btn[data-target]');
    const btnNew = document.getElementById('btn-new-initiative');
    const btnEmptyNew = document.getElementById('btn-empty-new');
    const btnBack = document.getElementById('btn-back-dashboard');
    const btnBackRead = document.getElementById('btn-back-dashboard-read');
    const btnSave = document.getElementById('btn-save-initiative');
    const btnPreview = document.getElementById('btn-preview-canvas');
    const btnPreviewRead = document.getElementById('btn-preview-canvas-read');
    const btnPrintDoc = document.getElementById('btn-print-doc');
    const btnEditFromRead = document.getElementById('btn-edit-from-read');
    const btnExportPptx = document.getElementById('btn-export-pptx');
    
    // Tools
    const btnExport = document.getElementById('btn-export-all');
    const btnImport = document.getElementById('btn-import-all');
    const importFile = document.getElementById('import-file');

    // Dashboard UI
    const grid = document.getElementById('initiatives-grid');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterChips = document.querySelectorAll('.filter-chips .chip');
    
    // Stats UI
    const elStatTotal = document.getElementById('stat-total');
    const elStatB2B = document.getElementById('stat-b2b');
    const elStatB2C = document.getElementById('stat-b2c');
    const elStatRecent = document.getElementById('stat-recent');

    // Modal Canvas
    const canvasModal = document.getElementById('canvas-presentation-modal');
    const btnCloseCanvas = document.getElementById('btn-close-canvas');
    const btnPrintCanvas = document.getElementById('btn-print-canvas');
    const renderCanvas = document.getElementById('render-canvas');
    const form = document.getElementById('initiative-form');

    let currentInitiativeId = null;
    let currentFilter = 'all';

    // ─── Navegación ───────────────────────────
    function switchView(viewId) {
        Object.values(views).forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none'; // reset display
        });
        
        const targetView = views[viewId.replace('-view', '')] || document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'flex';
            // force reflow
            void targetView.offsetWidth;
            targetView.classList.add('active');
        }

        navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.target === viewId));

        if(viewId === 'dashboard-view') {
            document.getElementById('nav-btn-form').style.display = 'none';
            renderDashboard();
        } else {
            document.getElementById('nav-btn-form').style.display = 'flex';
        }
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            if (target === 'dashboard-view') switchView(target);
        });
    });

    btnBack.addEventListener('click', () => switchView('dashboard-view'));
    btnBackRead.addEventListener('click', () => switchView('dashboard-view'));
    btnNew.addEventListener('click', () => openForm());
    btnEmptyNew.addEventListener('click', () => openForm());
    
    btnPrintDoc.addEventListener('click', () => window.print());
    btnEditFromRead.addEventListener('click', () => openForm(currentInitiativeId));
    
    // El botón de exportar PPTX ahora está en read-view
    const btnExportPptxRead = document.getElementById('btn-export-pptx-read');
    if(btnExportPptxRead) {
        btnExportPptxRead.addEventListener('click', () => {
            const initiatives = getInitiatives();
            const data = initiatives.find(i => i.uuid === currentInitiativeId);
            if(data) generatePPTX(data);
        });
    }

    // ─── Filtros Dashboard ────────────────────
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            filterChips.forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.filter;
            renderDashboard();
        });
    });

    searchInput.addEventListener('input', renderDashboard);

    // ─── CRUD LocalStorage ────────────────────
    function getInitiatives() {
        return JSON.parse(localStorage.getItem('cvtr_initiatives') || '[]');
    }

    function saveInitiative(data) {
        const initiatives = getInitiatives();
        if (data.uuid) {
            const index = initiatives.findIndex(i => i.uuid === data.uuid);
            if (index > -1) {
                data.updatedAt = new Date().toISOString();
                initiatives[index] = data;
            }
        } else {
            data.uuid = crypto.randomUUID();
            data.createdAt = new Date().toISOString();
            data.updatedAt = data.createdAt;
            initiatives.push(data);
        }
        localStorage.setItem('cvtr_initiatives', JSON.stringify(initiatives));
        return data.uuid;
    }

    function deleteInitiative(uuid) {
        if(confirm('¿Estás seguro de eliminar esta iniciativa?')) {
            let initiatives = getInitiatives();
            initiatives = initiatives.filter(i => i.uuid !== uuid);
            localStorage.setItem('cvtr_initiatives', JSON.stringify(initiatives));
            renderDashboard();
            showToast('Iniciativa eliminada');
        }
    }

    // ─── Update Stats ─────────────────────────
    function updateStats(initiatives) {
        elStatTotal.textContent = initiatives.length;
        elStatB2B.textContent = initiatives.filter(i => i.segment_type === 'B2B').length;
        elStatB2C.textContent = initiatives.filter(i => i.segment_type === 'B2C').length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = initiatives.filter(i => new Date(i.updatedAt) >= thirtyDaysAgo).length;
        elStatRecent.textContent = recentCount;
    }

    // ─── Render Dashboard ─────────────────────
    function renderDashboard() {
        let initiatives = getInitiatives();
        updateStats(initiatives);
        
        const q = searchInput.value.toLowerCase();
        const filtered = initiatives.filter(i => {
            const matchQuery = (i.ini_id || '').toLowerCase().includes(q) || 
                               (i.ini_name || '').toLowerCase().includes(q) ||
                               (i.ini_owner || '').toLowerCase().includes(q);
            const matchFilter = currentFilter === 'all' || i.segment_type === currentFilter;
            return matchQuery && matchFilter;
        });

        // Ordenar por fecha actualización desc
        filtered.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        if (initiatives.length === 0) {
            grid.style.display = 'none';
            document.getElementById('stats-row').style.display = 'none';
            document.querySelector('.dashboard-controls').style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            document.getElementById('stats-row').style.display = 'grid';
            document.querySelector('.dashboard-controls').style.display = 'flex';
            grid.style.display = 'grid';
            
            grid.innerHTML = filtered.map(ini => {
                const dateStr = new Date(ini.updatedAt).toLocaleDateString('es-ES', {day:'2-digit', month:'short', year:'numeric'});
                
                // Generar tags visuales
                let tagsHtml = '';
                if(ini.brand) tagsHtml += `<span class="ini-tag-small">${ini.brand}</span>`;
                if(ini.network) tagsHtml += `<span class="ini-tag-small">${ini.network}</span>`;
                if(ini.segment_type) tagsHtml += `<span class="ini-tag-small">${ini.segment_type}</span>`;
                
                return `
                <div class="ini-card">
                    <div class="ini-card-header">
                        <span class="ini-badge">${ini.ini_id || 'Borrador'}</span>
                        <span class="ini-date">${dateStr}</span>
                    </div>
                    <h3 class="ini-title">${ini.ini_name || 'Iniciativa sin título'}</h3>
                    <div class="ini-owner">
                        <i data-lucide="user-circle"></i> ${ini.ini_owner || 'Owner no definido'}
                    </div>
                    <div class="ini-tags">${tagsHtml}</div>
                    <div class="ini-footer">
                        <button class="btn btn-sm btn-ghost btn-del" data-id="${ini.uuid}" title="Eliminar">
                            <i data-lucide="trash-2"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-view" data-id="${ini.uuid}">
                            <i data-lucide="file-text"></i> Ver Documento
                        </button>
                    </div>
                </div>
            `}).join('');
            
            lucide.createIcons();
            
            document.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', (e) => openReadView(e.currentTarget.dataset.id));
            });
            document.querySelectorAll('.btn-del').forEach(btn => {
                btn.addEventListener('click', (e) => deleteInitiative(e.currentTarget.dataset.id));
            });
        }
    }

    // ─── Abrir Formulario ─────────────────────
    function openForm(uuid = null) {
        form.reset();
        
        if (uuid) {
            const initiatives = getInitiatives();
            const ini = initiatives.find(i => i.uuid === uuid);
            if (ini) {
                document.getElementById('form-title').textContent = 'Editar Iniciativa';
                document.getElementById('form-subtitle').textContent = (ini.ini_id || 'ID') + ' — ' + (ini.ini_name || '');
                currentInitiativeId = uuid;
                
                // Rellenar campos texto/select
                Object.keys(ini).forEach(key => {
                    const field = document.getElementById(key);
                    if (field) field.value = ini[key];
                });

                // Checkboxes / Radios array values
                if(ini.impact && Array.isArray(ini.impact)) {
                    ini.impact.forEach(val => {
                        const cb = document.querySelector(`input[name="impact"][value="${val}"]`);
                        if(cb) cb.checked = true;
                    });
                }
                ['brand', 'segment_type', 'network'].forEach(key => {
                    if(ini[key]) {
                        const r = document.querySelector(`input[name="${key}"][value="${ini[key]}"]`);
                        if(r) r.checked = true;
                    }
                });
            }
        } else {
            currentInitiativeId = null;
            document.getElementById('form-title').textContent = 'Nueva Iniciativa';
            document.getElementById('form-subtitle').textContent = 'Completa los datos del Canvas';
            document.getElementById('ini_uuid').value = '';
        }
        
        switchView('form-view');
        document.querySelector('.form-scroll-area').scrollTop = 0;
    }

    // ─── Abrir Vista de Lectura (Read Only) ───
    function openReadView(uuid) {
        const initiatives = getInitiatives();
        const ini = initiatives.find(i => i.uuid === uuid);
        if(!ini) return;
        
        currentInitiativeId = uuid;
        
        const tagsHtml = (ini.impact || []).map(t => `<span class="doc-tag">📌 ${t}</span>`).join('');
        const statusHtml = ini.ini_status ? `<div class="doc-status">${ini.ini_status}</div>` : '';
        const priorityHtml = ini.ini_priority ? `<div class="doc-status">Prioridad: ${ini.ini_priority}</div>` : '';
        const linkHtml = ini.ini_link ? `<div style="margin-top:8px"><a href="${ini.ini_link}" target="_blank" style="font-size:12px; color:var(--red); font-weight:600;">🔗 Ver Documento de Respaldo</a></div>` : '';

        const html = `
            <div class="doc-header">
                <div class="doc-brand"><img src="logos_sin_fondo.png" alt="Logo"></div>
                <div class="doc-meta">
                    <div class="doc-id">${ini.ini_id || 'SIN-ID'}</div>
                    ${statusHtml} ${priorityHtml}
                </div>
            </div>
            <h1 class="doc-title">${ini.ini_name || 'Iniciativa sin título'}</h1>
            ${linkHtml}
            <div style="height:24px;"></div>
            
            <div class="doc-section">
                <h4>Información Estratégica</h4>
                <div class="doc-grid">
                    <div class="doc-field">
                        <div class="doc-label">Owner / Área</div>
                        <div class="doc-value">${ini.ini_owner || '—'}</div>
                    </div>
                    <div class="doc-field">
                        <div class="doc-label">Sponsor / Mesa</div>
                        <div class="doc-value">${ini.ini_sponsor || '—'}</div>
                    </div>
                    <div class="doc-field">
                        <div class="doc-label">Objetivo Estratégico</div>
                        <div class="doc-value">${ini.ini_objective || '—'}</div>
                    </div>
                    <div class="doc-field">
                        <div class="doc-label">Segmento de Negocio</div>
                        <div class="doc-value">${ini.ini_segment || '—'}</div>
                    </div>
                </div>
            </div>

            <div class="doc-section">
                <h4>Contexto y Definición</h4>
                <div class="doc-field">
                    <div class="doc-label">Problema u Oportunidad</div>
                    <div class="doc-value">${ini.ini_problem?.replace(/\\n/g,'<br>') || '—'}</div>
                </div>
                <div class="doc-grid">
                    <div class="doc-field">
                        <div class="doc-label">Situación Actual (As-Is)</div>
                        <div class="doc-value">${ini.ini_context?.replace(/\\n/g,'<br>') || '—'}</div>
                    </div>
                    <div class="doc-field">
                        <div class="doc-label">Situación Deseada (To-Be)</div>
                        <div class="doc-value">${ini.ini_desired?.replace(/\\n/g,'<br>') || '—'}</div>
                    </div>
                </div>
                <div class="doc-field">
                    <div class="doc-label">Áreas Impactadas</div>
                    <div class="doc-value">${ini.ini_impacted?.replace(/\\n/g,'<br>') || '—'}</div>
                </div>
            </div>

            <div class="doc-section">
                <h4>Captura de Valor</h4>
                <div class="doc-grid">
                    <div class="doc-field"><div class="doc-label">Beneficio Esperado</div><div class="doc-value">${ini.ini_benefit || '—'}</div></div>
                    <div class="doc-field"><div class="doc-label">Descripción del Beneficio</div><div class="doc-value">${ini.ini_benefit_desc || '—'}</div></div>
                    <div class="doc-field"><div class="doc-label">Meta</div><div class="doc-value">${ini.ini_goal || '—'}</div></div>
                    <div class="doc-field"><div class="doc-label">Fecha de Captura</div><div class="doc-value">${ini.ini_capture_date || '—'}</div></div>
                    <div class="doc-field"><div class="doc-label">Responsable de Medición</div><div class="doc-value">${ini.ini_measurement || '—'}</div></div>
                </div>
            </div>

            <div class="doc-section">
                <h4>Evaluación Cuantitativa</h4>
                <div class="doc-grid">
                    <div>
                        <div class="doc-field"><div class="doc-label">Ingresos (MM)</div><div class="doc-value">${ini.val_revenue || '—'}</div></div>
                        <div class="doc-field"><div class="doc-label">Eficiencia (MM)</div><div class="doc-value">${ini.val_efficiency || '—'}</div></div>
                        <div class="doc-field"><div class="doc-label">Experiencia</div><div class="doc-value">${ini.val_experience || '—'}</div></div>
                    </div>
                    <div>
                        <div class="doc-field"><div class="doc-label">Esfuerzo en Tiempo</div><div class="doc-value">${ini.dur_time || '—'}</div></div>
                        <div class="doc-field"><div class="doc-label">Esfuerzo en Costo</div><div class="doc-value">${ini.dur_cost || '—'}</div></div>
                        <div class="doc-field"><div class="doc-label">Incertidumbre Técnica</div><div class="doc-value">${ini.dur_uncertainty || '—'}</div></div>
                        <div class="doc-field"><div class="doc-label">Capacidad Disponible</div><div class="doc-value">${ini.dur_capacity || '—'}</div></div>
                    </div>
                </div>
            </div>

            <div class="doc-section">
                <h4>Categorización</h4>
                <div class="doc-field">
                    <div class="doc-label">Impactos</div>
                    <div class="doc-tags" style="margin-top:8px">${tagsHtml || '—'}</div>
                </div>
                <div class="doc-grid" style="margin-top:16px;">
                    <div class="doc-field"><div class="doc-label">Marca</div><div class="doc-value">${ini.brand || '—'}</div></div>
                    <div class="doc-field"><div class="doc-label">Segmento</div><div class="doc-value">${ini.segment_type || '—'}</div></div>
                    <div class="doc-field"><div class="doc-label">Tipo de Red</div><div class="doc-value">${ini.network || '—'}</div></div>
                </div>
                <div class="doc-field">
                    <div class="doc-label">Detalle de Evaluación</div>
                    <div class="doc-value">${ini.ini_evaluation_detail?.replace(/\\n/g,'<br>') || '—'}</div>
                </div>
            </div>
        `;
        
        document.getElementById('document-render').innerHTML = html;
        switchView('read-view');
        document.querySelector('#read-view .form-scroll-area').scrollTop = 0;
    }

    // ─── Guardar Iniciativa ───────────────────
    btnSave.addEventListener('click', () => {
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = { uuid: currentInitiativeId };
        
        form.querySelectorAll('input[type="text"], input[type="url"], input[type="hidden"], textarea, select').forEach(el => {
            if(el.id) data[el.id] = el.value;
        });

        data.impact = formData.getAll('impact');
        data.brand = formData.get('brand');
        data.segment_type = formData.get('segment_type');
        data.network = formData.get('network');

        currentInitiativeId = saveInitiative(data);
        showToast('Iniciativa guardada correctamente');
        
        document.getElementById('form-title').textContent = 'Editar Iniciativa';
        document.getElementById('form-subtitle').textContent = data.ini_id + ' — ' + data.ini_name;
    });

    // ─── Import / Export ──────────────────────
    btnExport.addEventListener('click', () => {
        const data = getInitiatives();
        if(data.length === 0) {
            alert("No hay iniciativas para exportar."); return;
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iniciativas_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    btnImport.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if(Array.isArray(imported)) {
                    // merge ignoring duplicate UUIDs, or just append
                    let current = getInitiatives();
                    imported.forEach(imp => {
                        if(!current.find(c => c.uuid === imp.uuid)) {
                            current.push(imp);
                        }
                    });
                    localStorage.setItem('cvtr_initiatives', JSON.stringify(current));
                    renderDashboard();
                    showToast(`${imported.length} iniciativas importadas`);
                }
            } catch(err) {
                alert("Error leyendo el archivo JSON.");
            }
        };
        reader.readAsText(file);
        // reset file input
        e.target.value = '';
    });

    // ─── Generador PPTX (Multi-Slide) ────────────
    function generatePPTX(data) {
        try {
            if(typeof pptxgen === 'undefined') {
                alert('Librería PPTXGen no cargada.');
                return;
            }
            showToast('Generando PPTX multi-diapositiva...');
            let pptx = new pptxgen();
            pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 pulgadas
            
            // Constantes de estilo
            const redColor = 'DA1222';
            const txtColor = '333333';
            const grayColor = '555555';
            const bgGray = 'FDFDFD';
            const px = (p) => p / 128; // Conversión

            // Tablas globales
            const optsTable = { fontFace:'Inter', fontSize:11, border:[{pt:1,color:'F0F0F0'},{pt:1,color:'F0F0F0'},{pt:1,color:'F0F0F0'},{pt:1,color:'F0F0F0'}] };
            const lblStyle = { bold:true, color:grayColor, fill:'FFFFFF' };

            // ==========================================
            // SLIDE 1: RESUMEN Y ESTRATEGIA
            // ==========================================
            let slide1 = pptx.addSlide();
            slide1.addShape(pptx.shapes.RECTANGLE, { x:0, y:0, w:10, h:px(70), fill:{ color:'FFFFFF' } });
            slide1.addShape(pptx.shapes.RECTANGLE, { x:0, y:px(67), w:10, h:px(3), fill:{ color:redColor } });
            slide1.addText([
                { text:`CANVAS ESTRATÉGICO – `, options:{ fontFace:'Inter', fontSize: 22, bold:true, color:redColor } },
                { text:(data.ini_name || 'Nombre Iniciativa'), options:{ fontFace:'Inter', fontSize: 22, color:txtColor } }
            ], { x:px(30), y:px(18), w:9, h:px(30), margin:0 });
            slide1.addText(`ID: ${data.ini_id || '—'} | Estado: ${data.ini_status || '—'} | Prioridad: ${data.ini_priority || '—'}`, { x:px(30), y:px(52), w:9, fontSize:10, color:grayColor, margin:0, bold:true });

            const drawPill = (slide, x, y, w, title, val) => {
                slide.addShape(pptx.shapes.RECTANGLE, { x, y, w, h:px(80), fill:{ color:bgGray }, line:{color:'E5E5E5', width:1} });
                slide.addShape(pptx.shapes.RECTANGLE, { x, y, w, h:px(4), fill:{ color:redColor } });
                slide.addText(title.toUpperCase(), { x:x+px(14), y:y+px(12), w:w-px(28), h:px(20), fontSize:10, bold:true, color:redColor, margin:0 });
                slide.addText((val || '—'), { x:x+px(14), y:y+px(32), w:w-px(28), h:px(40), fontSize:12, color:grayColor, margin:0 });
            };
            
            drawPill(slide1, px(40), px(120), px(380), 'Owner / Área', data.ini_owner);
            drawPill(slide1, px(440), px(120), px(380), 'Sponsor / Mesa', data.ini_sponsor);
            drawPill(slide1, px(840), px(120), px(380), 'Objetivo Estratégico', data.ini_objective);
            drawPill(slide1, px(40), px(220), px(380), 'Segmento de Negocio', data.ini_segment);
            
            slide1.addText('Categorización', { x:px(40), y:px(340), fontSize:14, bold:true, color:txtColor });
            const tableCats = [
                [{ text:'Marca', options:lblStyle }, data.brand || '—'],
                [{ text:'Tipo de Segmento', options:lblStyle }, data.segment_type || '—'],
                [{ text:'Tipo de Red', options:lblStyle }, data.network || '—'],
                [{ text:'Impactos', options:lblStyle }, (data.impact || []).join(', ') || '—']
            ];
            slide1.addTable(tableCats, { x:px(40), y:px(380), w:px(600), colW:[2, 4], ...optsTable, rowH:px(40) });


            // ==========================================
            // SLIDE 2: CONTEXTO Y DEFINICIÓN
            // ==========================================
            let slide2 = pptx.addSlide();
            slide2.addShape(pptx.shapes.RECTANGLE, { x:0, y:0, w:10, h:px(60), fill:{ color:redColor } });
            slide2.addText('1. Contexto y Definición', { x:px(30), y:px(15), w:9, h:px(30), fontFace:'Inter', fontSize: 20, bold:true, color:'FFFFFF', margin:0 });

            const drawBox = (slide, x, y, w, h, title, textVal) => {
                slide.addShape(pptx.shapes.RECTANGLE, { x, y, w, h, fill:{ color:bgGray }, line:{color:'E5E5E5', width:1} });
                slide.addText(title, { x:x+px(14), y:y+px(14), w:w-px(28), fontSize:14, bold:true, color:redColor, margin:0 });
                slide.addText(textVal || '—', { x:x+px(14), y:y+px(44), w:w-px(28), h:h-px(50), fontSize:12, color:txtColor, margin:0, valign:'top' });
            };

            drawBox(slide2, px(40), px(80), px(1180), px(180), 'Problema u Oportunidad', data.ini_problem);
            drawBox(slide2, px(40), px(280), px(580), px(220), 'Situación Actual (As-Is)', data.ini_context);
            drawBox(slide2, px(640), px(280), px(580), px(220), 'Situación Deseada (To-Be)', data.ini_desired);
            drawBox(slide2, px(40), px(520), px(1180), px(150), 'Áreas Impactadas', data.ini_impacted);


            // ==========================================
            // SLIDE 3: VALOR Y EVALUACIÓN
            // ==========================================
            let slide3 = pptx.addSlide();
            slide3.addShape(pptx.shapes.RECTANGLE, { x:0, y:0, w:10, h:px(60), fill:{ color:redColor } });
            slide3.addText('2. Captura de Valor y Evaluación', { x:px(30), y:px(15), w:9, h:px(30), fontFace:'Inter', fontSize: 20, bold:true, color:'FFFFFF', margin:0 });

            slide3.addText('Beneficios y Metas', { x:px(40), y:px(80), fontSize:14, bold:true, color:txtColor });
            const tableBen = [
                [{ text:'Beneficio Esperado', options:lblStyle }, data.ini_benefit || '—'],
                [{ text:'Descripción', options:lblStyle }, data.ini_benefit_desc || '—'],
                [{ text:'Meta', options:lblStyle }, data.ini_goal || '—'],
                [{ text:'Fecha Captura', options:lblStyle }, data.ini_capture_date || '—'],
                [{ text:'Responsable', options:lblStyle }, data.ini_measurement || '—']
            ];
            slide3.addTable(tableBen, { x:px(40), y:px(110), w:px(1180), colW:[2.5, 7.5], ...optsTable, rowH:px(30) });

            slide3.addText('Evaluación Cuantitativa', { x:px(40), y:px(310), fontSize:14, bold:true, color:txtColor });
            
            const r3a = [
                [{ text:'Valor Negocio', options:lblStyle }, { text:'MM', options:lblStyle }],
                ['Ingresos', data.val_revenue || '—'],
                ['Eficiencia', data.val_efficiency || '—'],
                ['Experiencia', data.val_experience || '—']
            ];
            const r3b = [
                [{ text:'Esfuerzos / Riesgos', options:lblStyle }, { text:'Indicador', options:lblStyle }],
                ['Esfuerzo tiempo', data.dur_time || '—'],
                ['Esfuerzo costo', data.dur_cost || '—'],
                ['Incertidumbre Téc.', data.dur_uncertainty || '—']
            ];
            slide3.addTable(r3a, { x:px(40), y:px(340), w:px(570), colW:[2, 2], ...optsTable, rowH:px(30) });
            slide3.addTable(r3b, { x:px(650), y:px(340), w:px(570), colW:[2, 2], ...optsTable, rowH:px(30) });

            slide3.addText('Detalle de la Evaluación', { x:px(40), y:px(520), fontSize:14, bold:true, color:txtColor });
            drawBox(slide3, px(40), px(550), px(1180), px(120), '', data.ini_evaluation_detail);

            // Guardar archivo
            pptx.writeFile({ fileName: `Iniciativa_${data.ini_id || 'ID'}.pptx` });
        } catch(e) {
            console.error(e);
            alert('Hubo un error al generar el PPTX: ' + e.message);
        }
    }

    // ─── Utils ────────────────────────────────
    let toastTimeout;
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.querySelector('span').textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // INIT
    renderDashboard();
});
