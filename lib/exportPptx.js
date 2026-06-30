import pptxgen from 'pptxgenjs';

export function exportToPPTX(data) {
  try {
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
    
    const redColor = 'DA1222';
    const txtColor = '333333';
    const grayColor = '555555';
    const bgGray = 'FDFDFD';

    // Helper functions for PPTX shapes
    const drawHeader = (slide) => {
        slide.addText(`CANVAS – ${data.ini_id || 'ID'} – ${data.ini_name || 'Nombre Iniciativa'}`, { 
            x:0.2, y:0.2, w:8.0, h:0.4, 
            fontFace:'Inter', fontSize: 18, bold:true, color:redColor, margin:0, border:[0,0,{pt:1,color:redColor},0] 
        });
        slide.addText('Claro-', { 
            x:8.2, y:0.2, w:1.6, h:0.4, 
            fontFace:'Inter', fontSize: 22, bold:true, color:redColor, margin:0, border:[0,0,{pt:1,color:redColor},0], align:'right' 
        });
    };

    const drawRedBox = (slide, x, y, w, h, title, val) => {
        slide.addShape(pptx.shapes.RECTANGLE, { x, y, w, h, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
        slide.addText(title, { x:x, y:y+0.05, w:w, h:0.2, fontSize:10, bold:true, color:redColor, align:'center', margin:0 });
        slide.addText((val || '—'), { x:x+0.1, y:y+0.25, w:w-0.2, h:h-0.3, fontSize:10, color:grayColor, align:'center', margin:0, valign:'middle' });
    };

    const isObj = (val) => data.ini_objective === val;

    // ==========================================
    // SLIDE 1: CANVAS DENSO (EL MAESTRO)
    // ==========================================
    let slide1 = pptx.addSlide();
    drawHeader(slide1);

    // TOP 4 BOXES
    const yTop = 0.7;
    const hTop = 0.9;
    
    // Owner
    drawRedBox(slide1, 0.2, yTop, 2.3, hTop, 'Owner / Area solicitante', data.ini_owner);
    // Sponsor
    drawRedBox(slide1, 2.6, yTop, 2.3, hTop, 'Sponsor / Mesa de trabajo', data.ini_sponsor);
    
    // Objetivo Estratégico (Custom rendering inside box)
    slide1.addShape(pptx.shapes.RECTANGLE, { x:5.0, y:yTop, w:2.3, h:hTop, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
    slide1.addText('Objetivo estratégico', { x:5.0, y:yTop+0.05, w:2.3, h:0.2, fontSize:10, bold:true, color:redColor, align:'center', margin:0 });
    const objText = `Eficiencia: ${isObj('Eficiencia (ahorro)')?'✔':'-'}\nIngresos: ${isObj('Ingresos')?'✔':'-'}\nReg/Norm: ${isObj('Reg. / Norm.')?'✔':'-'}\nExpCliente: ${isObj('Exp. Cliente')?'✔':'-'}\nOtros: ${isObj('Otro')?'✔':'-'}`;
    slide1.addText(objText, { x:5.1, y:yTop+0.25, w:2.1, h:hTop-0.3, fontSize:9, color:grayColor, margin:0, valign:'middle' });

    // Línea de trabajo
    slide1.addShape(pptx.shapes.RECTANGLE, { x:7.4, y:yTop, w:2.4, h:hTop, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
    slide1.addText('Línea de trabajo / Segmento / Negocio', { x:7.4, y:yTop+0.05, w:2.4, h:0.2, fontSize:9, bold:true, color:redColor, align:'center', margin:0 });
    const linText = `Claro: ${data.brand==='Claro'?'✔':'-'} | VTR: ${data.brand==='VTR'?'✔':'-'}\nB2B: ${data.segment_type==='B2B'?'✔':'-'} | B2C: ${data.segment_type==='B2C'?'✔':'-'}\nMóvil: ${data.network==='Móvil'?'✔':'-'} | Fijo: ${data.network==='Fijo'?'✔':'-'}`;
    slide1.addText(linText, { x:7.5, y:yTop+0.25, w:2.2, h:hTop-0.3, fontSize:9, color:grayColor, margin:0, valign:'middle', align:'center' });

    // LEFT COLUMN (1. Descripción y contexto)
    const yBody = 1.7;
    const wLeft = 4.4;
    slide1.addShape(pptx.shapes.RECTANGLE, { x:0.2, y:yBody, w:wLeft, h:3.8, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
    slide1.addText('1. Descripción y contexto', { x:0.2, y:yBody, w:wLeft, h:0.3, fontSize:12, bold:true, color:grayColor, margin:0.1, border:[0,0,{pt:1.5,color:redColor},0] });
    
    const leftRows = [
        ['Problema u oportunidad', data.ini_problem || '—'],
        ['Contexto actual', data.ini_context ? data.ini_context.substring(0, 150) + '... (ver As Is)' : '—'],
        ['Situación deseada', data.ini_desired ? data.ini_desired.substring(0, 150) + '... (ver To Be)' : '—'],
        ['Áreas impactadas', data.ini_impacted || '—']
    ];
    
    let curY = yBody + 0.3;
    leftRows.forEach((row, i) => {
        const isLast = i === leftRows.length - 1;
        const rowH = 3.5 / 4;
        slide1.addText(row[0], { x:0.2, y:curY, w:1.2, h:rowH, fontSize:10, bold:true, color:grayColor, margin:0.1, border:isLast ? [0, {pt:1.5,color:redColor}, 0, 0] : [0, {pt:1.5,color:redColor}, {pt:1.5,color:redColor}, 0] });
        slide1.addText(row[1], { x:1.4, y:curY, w:3.2, h:rowH, fontSize:9, color:grayColor, margin:0.1, valign:'top', border:isLast ? [0,0,0,0] : [0,0,{pt:1.5,color:redColor},0] });
        curY += rowH;
    });

    // RIGHT COLUMN
    const xRight = 4.8;
    const wRight = 5.0;

    // 2. Valor y captura
    slide1.addShape(pptx.shapes.RECTANGLE, { x:xRight, y:yBody, w:wRight, h:1.3, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
    slide1.addText('2. Valor y captura de beneficio', { x:xRight, y:yBody, w:wRight, h:0.3, fontSize:12, bold:true, color:grayColor, margin:0.1, border:[0,0,{pt:1.5,color:redColor},0] });
    
    const valRows = [
        [{text:'Beneficio', options:{bold:true, color:grayColor}}, data.ini_benefit || '—', {text:'Meta', options:{bold:true, color:grayColor}}, data.ini_goal || '—'],
        [{text:'Descripción', options:{bold:true, color:grayColor}}, data.ini_benefit_desc || '—', {text:'Fecha cap.', options:{bold:true, color:grayColor}}, data.ini_capture_date || '—'],
    ];
    slide1.addTable(valRows, { x:xRight, y:yBody+0.3, w:wRight, colW:[1.0, 1.5, 1.0, 1.5], border:[0,0,{pt:1,color:redColor},0], fontSize:9, margin:0.05, rowH:0.3 });

    // 3. Evaluación
    const yEval = yBody + 1.4;
    slide1.addShape(pptx.shapes.RECTANGLE, { x:xRight, y:yEval, w:wRight, h:1.3, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
    slide1.addText('3. Evaluación', { x:xRight, y:yEval, w:wRight, h:0.3, fontSize:12, bold:true, color:grayColor, margin:0.1, border:[0,0,{pt:1.5,color:redColor},0] });
    
    const evalData1 = [
        [{text:'Valor Negocio', options:{fill:redColor, color:'FFFFFF', bold:true}}, {text:'MM', options:{fill:redColor, color:'FFFFFF', bold:true}}],
        ['Ingresos', data.val_revenue || '—'],
        ['Eficiencia', data.val_efficiency || '—']
    ];
    const evalData2 = [
        [{text:'Duración', options:{fill:redColor, color:'FFFFFF', bold:true}}, {text:'Indicador', options:{fill:redColor, color:'FFFFFF', bold:true}}],
        ['Esfuerzo tiempo', data.dur_time || '—'],
        ['Esfuerzo costo', data.dur_cost || '—']
    ];
    slide1.addTable(evalData1, { x:xRight+0.1, y:yEval+0.4, w:2.3, colW:[1.5, 0.8], border:[{pt:1,color:'E5E5E5'},{pt:1,color:'E5E5E5'},{pt:1,color:'E5E5E5'},{pt:1,color:'E5E5E5'}], fontSize:9, margin:0.05, rowH:0.2 });
    slide1.addTable(evalData2, { x:xRight+2.6, y:yEval+0.4, w:2.3, colW:[1.5, 0.8], border:[{pt:1,color:'E5E5E5'},{pt:1,color:'E5E5E5'},{pt:1,color:'E5E5E5'},{pt:1,color:'E5E5E5'}], fontSize:9, margin:0.05, rowH:0.2 });

    // 4. Detalle
    const yDet = yBody + 2.8;
    slide1.addShape(pptx.shapes.RECTANGLE, { x:xRight, y:yDet, w:wRight, h:1.0, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.1 });
    slide1.addText('4. Detalle evaluación', { x:xRight, y:yDet, w:wRight, h:0.3, fontSize:12, bold:true, color:grayColor, margin:0.1 });
    slide1.addText(data.ini_evaluation_detail || '—', { x:xRight, y:yDet+0.3, w:wRight, h:0.6, fontSize:9, color:grayColor, margin:0.1, valign:'top' });


    // ==========================================
    // SLIDE 2: AS IS
    // ==========================================
    let slide2 = pptx.addSlide();
    drawHeader(slide2);
    slide2.addShape(pptx.shapes.RECTANGLE, { x:0.2, y:0.8, w:9.6, h:4.6, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.05 });
    slide2.addText('1. As Is', { x:0.2, y:0.8, w:9.6, h:0.4, fontSize:14, bold:true, color:grayColor, margin:0.2, border:[0,0,{pt:1.5,color:redColor},0] });
    slide2.addText('Contexto actual', { x:0.2, y:1.2, w:1.5, h:4.2, fontSize:12, bold:true, color:grayColor, margin:0.2, border:[0,{pt:1.5,color:redColor},0,0], align:'center' });
    slide2.addText(data.ini_context || '—', { x:1.7, y:1.2, w:8.1, h:4.2, fontSize:11, color:grayColor, margin:0.2, valign:'top' });


    // ==========================================
    // SLIDE 3: TO BE
    // ==========================================
    let slide3 = pptx.addSlide();
    drawHeader(slide3);
    slide3.addShape(pptx.shapes.RECTANGLE, { x:0.2, y:0.8, w:9.6, h:4.6, fill:{ color:'FFFFFF' }, line:{color:redColor, width:1.5}, roundness:0.05 });
    slide3.addText('1. To Be', { x:0.2, y:0.8, w:9.6, h:0.4, fontSize:14, bold:true, color:grayColor, margin:0.2, border:[0,0,{pt:1.5,color:redColor},0] });
    slide3.addText('Situación deseada', { x:0.2, y:1.2, w:1.5, h:4.2, fontSize:12, bold:true, color:grayColor, margin:0.2, border:[0,{pt:1.5,color:redColor},0,0], align:'center' });
    slide3.addText(data.ini_desired || '—', { x:1.7, y:1.2, w:8.1, h:4.2, fontSize:11, color:grayColor, margin:0.2, valign:'top' });

    // Guardar archivo
    pptx.writeFile({ fileName: `Iniciativa_${data.ini_id || 'ID'}.pptx` });
  } catch(e) {
      console.error(e);
      alert('Hubo un error al generar el PPTX: ' + e.message);
  }
}
