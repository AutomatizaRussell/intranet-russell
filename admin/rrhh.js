// 1. Inicialización de Supabase
// Asegúrate de importar el script de Supabase en tu HTML antes de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const adminSupabaseUrl = 'https://db.rbgct.cloud';
const adminSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.empG3TVP0rYZ-FUYZcm08Ua-nUfhD2NXsAjTEfGs-ic';
const supabaseAdmin = window.supabase.createClient(adminSupabaseUrl, adminSupabaseKey);

let solicitudesData = [];
let solicitudActualParaPDF = null;
let vacantesData = []; 
let empleadosData = []; // <--- Variable global para el CRUD de Empleados

// ==========================================
// TOAST DE NOTIFICACIONES
// ==========================================
function mostrarNotificacion(mensaje, tipo = 'exito') {
    const toast = document.createElement('div');
    const colorBg = tipo === 'exito' ? 'bg-green-600' : 'bg-red-500';
    const icono = tipo === 'exito' ? 'fa-circle-check' : 'fa-circle-exclamation';

    toast.className = `fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 translate-y-20 opacity-0 z-[100] ${colorBg} text-white font-medium text-sm`;
    toast.innerHTML = `<i class="fa-solid ${icono} text-xl"></i> <span>${mensaje}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-20', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDirectorio();
    await cargarSolicitudesCertificados();
    await cargarPostulaciones();
    await cargarGestionVacantes();

    document.getElementById('btn-logout').addEventListener('click', async () => {
        if(window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.href = '../index.html';
    });
});

// ==========================================
// MÓDULO: CRUD DE DIRECTORIO PERSONAL
// ==========================================
async function cargarDirectorio() {
    try {
        const { data, error } = await supabaseAdmin.from('empleados').select('*').order('nombre_completo', { ascending: true });
        if (error) throw error;
        empleadosData = data; // Guardamos en memoria para poder editar
        
        const tbody = document.querySelector('#tabla-personal tbody');
        tbody.innerHTML = ''; 

        if (data.length === 0) return tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-500">No hay empleados registrados.</td></tr>';
        
        data.forEach(emp => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            
            const area = emp.area || emp.division || '-';
            const badgeAdmin = emp.rol === 'admin' ? '<span class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-md uppercase font-bold" title="Administrador"><i class="fa-solid fa-shield-halved"></i> Admin</span>' : '';

            tr.innerHTML = `
                <td class="py-4 px-6 font-mono text-sm text-gray-600">${emp.documento}</td>
                <td class="py-4 px-6 font-bold text-gray-800 flex items-center">${emp.nombre_completo} ${badgeAdmin}</td>
                <td class="py-4 px-6"><div class="text-sm text-[#001871] font-medium">${area}</div><div class="text-xs text-gray-500">${emp.cargo || '-'}</div></td>
                <td class="py-4 px-6 text-sm text-gray-600">${emp.fecha_ingreso || '-'}</td>
                <td class="py-4 px-6 text-right space-x-2">
                    <button onclick="abrirModalEmpleado('${emp.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition" title="Editar Empleado">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button onclick="eliminarEmpleado('${emp.id}')" class="text-red-500 hover:bg-red-100 p-2 rounded-lg transition" title="Eliminar Empleado">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error('Error:', err); }
}

window.abrirModalEmpleado = function(id = null) {
    const form = document.getElementById('formEmpleado');
    form.reset();
    document.getElementById('empleadoId').value = '';

    if (id) {
        const emp = empleadosData.find(x => x.id === id);
        document.getElementById('empleadoId').value = emp.id;
        document.getElementById('empDocumento').value = emp.documento || '';
        document.getElementById('empNombre').value = emp.nombre_completo || '';
        document.getElementById('empCorreo').value = emp.correo_corporativo || emp.correo || '';
        document.getElementById('empArea').value = emp.area || emp.division || '';
        document.getElementById('empCargo').value = emp.cargo || '';
        document.getElementById('empSalario').value = emp.salario || emp.sueldo || '';
        document.getElementById('empFechaIngreso').value = emp.fecha_ingreso || '';
        document.getElementById('empRol').value = emp.rol || 'empleado';
        document.getElementById('modalEmpleadoTitle').innerText = 'Editar Empleado';
    } else {
        document.getElementById('modalEmpleadoTitle').innerText = 'Nuevo Empleado';
        document.getElementById('empRol').value = 'empleado';
    }

    document.getElementById('modalEmpleado').classList.remove('hidden');
}

window.cerrarModalEmpleado = function() {
    document.getElementById('modalEmpleado').classList.add('hidden');
}

window.guardarEmpleado = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarEmpleado');
    const ogText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const id = document.getElementById('empleadoId').value;
    
    // Objeto con los datos capturados
    const data = {
        documento: document.getElementById('empDocumento').value.trim(),
        nombre_completo: document.getElementById('empNombre').value.trim(),
        correo_corporativo: document.getElementById('empCorreo').value.trim(),
        area: document.getElementById('empArea').value.trim(),
        cargo: document.getElementById('empCargo').value.trim(),
        salario: document.getElementById('empSalario').value,
        fecha_ingreso: document.getElementById('empFechaIngreso').value,
        rol: document.getElementById('empRol').value
    };

    try {
        let error;
        if (id) {
            const res = await supabaseAdmin.from('empleados').update(data).eq('id', id);
            error = res.error;
        } else {
            const res = await supabaseAdmin.from('empleados').insert([data]);
            error = res.error;
        }

        if (error) {
            if (error.code === '23505') throw new Error('El documento o correo corporativo ya pertenece a otro empleado.');
            throw error;
        }
        
        mostrarNotificacion('Empleado guardado correctamente', 'exito');
        cerrarModalEmpleado();
        cargarDirectorio(); // Recargamos la tabla
    } catch (err) {
        console.error(err);
        mostrarNotificacion(err.message || 'Error al guardar el empleado', 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = ogText;
    }
}

window.eliminarEmpleado = async function(id) {
    if(!confirm("⚠️ ¡ADVERTENCIA!\n\nSi eliminas este empleado, se borrará todo su historial, incluyendo sus solicitudes de certificados.\n\n¿Estás completamente seguro de querer eliminarlo?")) return;
    
    try {
        const { error } = await supabaseAdmin.from('empleados').delete().eq('id', id);
        if (error) throw error;
        mostrarNotificacion('Empleado eliminado del sistema', 'exito');
        cargarDirectorio();
    } catch (err) {
        console.error(err);
        mostrarNotificacion('Error al eliminar el empleado', 'error');
    }
}

// ==========================================
// MÓDULO: POSTULACIONES RECIBIDAS
// ==========================================
async function cargarPostulaciones() {
    try {
        const { data, error } = await supabaseAdmin.from('postulaciones').select('id, nombre_candidato, correo, telefono, url_cv, vacantes(titulo)').order('created_at', { ascending: false });
        if (error) throw error;

        const tbody = document.querySelector('#tabla-postulaciones tbody');
        tbody.innerHTML = '';
        if (data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">Aún no hay postulaciones recibidas.</td></tr>';

        data.forEach(post => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            const tituloVacante = post.vacantes ? post.vacantes.titulo : 'Vacante cerrada/eliminada';

            tr.innerHTML = `
                <td class="py-4 px-6 font-bold text-gray-800">${post.nombre_candidato}</td>
                <td class="py-4 px-6">
                    <div class="text-sm text-gray-600"><i class="fa-solid fa-envelope mr-1 text-gray-400"></i> ${post.correo}</div>
                    <div class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-phone mr-1 text-gray-400"></i> ${post.telefono || 'No registrado'}</div>
                </td>
                <td class="py-4 px-6"><span class="px-3 py-1 bg-orange-50 text-orange-500 border border-orange-100 rounded-lg text-xs font-bold uppercase tracking-wide">${tituloVacante}</span></td>
                <td class="py-4 px-6 text-right">
                    <a href="${post.url_cv}" target="_blank" class="inline-flex items-center justify-center bg-gray-50 hover:bg-[#001871] text-[#001871] hover:text-white font-medium text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-transparent transition-colors">
                        <i class="fa-solid fa-file-pdf mr-2 text-red-500 group-hover:text-white"></i> Ver CV
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error('Error:', err); }
}

// ==========================================
// MÓDULO: CRUD DE VACANTES
// ==========================================
async function cargarGestionVacantes() {
    try {
        const { data, error } = await supabaseAdmin.from('vacantes').select('*').order('fecha_publicacion', { ascending: false });
        if (error) throw error;
        vacantesData = data;

        const tbody = document.querySelector('#tabla-gestion-vacantes tbody');
        tbody.innerHTML = '';
        if (data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">No tienes vacantes creadas.</td></tr>';

        data.forEach(v => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            
            const badgeEstado = v.estado === 'abierta' 
                ? '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase"><i class="fa-solid fa-check-circle mr-1"></i> Abierta</span>'
                : '<span class="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold uppercase"><i class="fa-solid fa-lock mr-1"></i> Cerrada</span>';

            tr.innerHTML = `
                <td class="py-4 px-6">${badgeEstado}</td>
                <td class="py-4 px-6 font-bold text-gray-800">${v.titulo}</td>
                <td class="py-4 px-6 text-sm text-gray-600">${v.area_solicitante}</td>
                <td class="py-4 px-6 text-right space-x-2">
                    <button onclick="abrirModalVacante('${v.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button onclick="eliminarVacante('${v.id}')" class="text-red-500 hover:bg-red-100 p-2 rounded-lg transition" title="Eliminar definitivamente">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error('Error:', err); }
}

window.abrirModalVacante = function(id = null) {
    const form = document.getElementById('formVacante');
    form.reset();
    document.getElementById('vacanteId').value = '';
    
    if (id) {
        const v = vacantesData.find(x => x.id === id);
        document.getElementById('vacanteId').value = v.id;
        document.getElementById('vacanteTitulo').value = v.titulo;
        document.getElementById('vacanteArea').value = v.area_solicitante;
        document.getElementById('vacanteDescripcion').value = v.descripcion;
        document.getElementById('vacanteEstado').value = v.estado;
        document.getElementById('modalVacanteTitle').innerText = 'Editar Vacante';
    } else {
        document.getElementById('modalVacanteTitle').innerText = 'Nueva Vacante';
        document.getElementById('vacanteEstado').value = 'abierta';
    }
    document.getElementById('modalVacante').classList.remove('hidden');
}

window.cerrarModalVacante = function() {
    document.getElementById('modalVacante').classList.add('hidden');
}

window.guardarVacante = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarVacante');
    const ogText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const id = document.getElementById('vacanteId').value;
    const data = {
        titulo: document.getElementById('vacanteTitulo').value.trim(),
        area_solicitante: document.getElementById('vacanteArea').value,
        descripcion: document.getElementById('vacanteDescripcion').value.trim(),
        estado: document.getElementById('vacanteEstado').value
    };

    try {
        let error;
        if (id) {
            const res = await supabaseAdmin.from('vacantes').update(data).eq('id', id);
            error = res.error;
        } else {
            const res = await supabaseAdmin.from('vacantes').insert([data]);
            error = res.error;
        }
        if (error) throw error;
        
        mostrarNotificacion('Vacante guardada correctamente', 'exito');
        cerrarModalVacante();
        cargarGestionVacantes();
    } catch (err) { console.error(err); mostrarNotificacion('Error al guardar la vacante', 'error'); } 
    finally { btn.disabled = false; btn.innerHTML = ogText; }
}

window.eliminarVacante = async function(id) {
    if(!confirm("⚠️ ¡ADVERTENCIA!\n\nSi eliminas esta vacante, también SE BORRARÁN todas las postulaciones asociadas a ella.\n\n¿Estás seguro?")) return;
    try {
        const { error } = await supabaseAdmin.from('vacantes').delete().eq('id', id);
        if (error) throw error;
        mostrarNotificacion('Vacante eliminada', 'exito');
        cargarGestionVacantes();
        cargarPostulaciones(); 
    } catch (err) { console.error(err); mostrarNotificacion('Error al eliminar', 'error'); }
}

// ==========================================
// MÓDULO: CERTIFICADOS Y GENERACIÓN PDF
// ==========================================
async function cargarSolicitudesCertificados() {
    try {
        const { data, error } = await supabaseAdmin.from('solicitudes_certificados').select('id, tipo_certificado, fecha_solicitud, comentarios_rrhh, empleados (*)').eq('estado', 'pendiente');
        if (error) throw error;
        solicitudesData = data;
        
        const tbody = document.querySelector('#tabla-solicitudes tbody');
        const badge = document.getElementById('badge-certificados');
        tbody.innerHTML = '';

        if (data.length === 0) {
            badge.style.display = 'none';
            return tbody.innerHTML = '<tr><td colspan="3" class="text-center py-6 text-gray-500">Bandeja limpia. No hay solicitudes pendientes.</td></tr>';
        }

        badge.innerText = data.length;
        badge.style.display = 'flex';

        data.forEach(sol => {
            const emp = sol.empleados;
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            tr.innerHTML = `
                <td class="py-4 px-6"><div class="font-bold text-gray-800">${emp.nombre_completo}</div><div class="text-xs text-gray-500">C.C. ${emp.documento}</div></td>
                <td class="py-4 px-6"><span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">${sol.tipo_certificado.toUpperCase()}</span></td>
                <td class="py-4 px-6 text-right">
                    <button onclick="previsualizarCertificado('${sol.id}')" class="bg-[#001871] hover:bg-blue-900 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition">
                        <i class="fa-solid fa-eye mr-2"></i> Previsualizar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) { console.error('Error:', err); }
}

window.previsualizarCertificado = function(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud || !solicitud.empleados) return alert("Error: Datos no encontrados.");
    
    solicitudActualParaPDF = solicitud;
    const emp = solicitud.empleados;

    let opciones = { dirigido: 'A QUIEN INTERESE', sueldo: true, cargo: true };
    try { if(solicitud.comentarios_rrhh) opciones = Object.assign(opciones, JSON.parse(solicitud.comentarios_rrhh)); } catch(e) {}

    const salario = emp.sueldo || emp.salario || 0;
    const sueldoFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(salario);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    let fechaIngresoTxt = '[FECHA NO REGISTRADA]';
    if(emp.fecha_ingreso) {
        const d = new Date(emp.fecha_ingreso); d.setDate(d.getDate() + 1);
        fechaIngresoTxt = `${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    }

    const hoy = new Date();
    const fechaHoyTxt = `${String(hoy.getDate()).padStart(2, '0')} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
    const expedicion = emp.lugar_expedicion_cedula ? ` de ${emp.lugar_expedicion_cedula}` : '';
    const empresa = emp.razon_social || emp.division || 'GLT GESTIÓN LEGAL Y TRIBUTARIA S.A.S';

    let textoBase = `Certificamos que el señor(a) <strong class="uppercase">${emp.nombre_completo}</strong> identificado con cédula de ciudadanía No ${new Intl.NumberFormat('es-CO').format(emp.documento)}${expedicion}, labora en <strong class="uppercase">${empresa}</strong> con Nit. 900930391-1, desde el ${fechaIngresoTxt}, con contrato a término indefinido`;

    if (opciones.cargo && emp.cargo) textoBase += `, desempeñando el cargo de <strong class="uppercase">${emp.cargo}</strong>`;
    if (opciones.sueldo && salario > 0) textoBase += ` y devengando un salario mensual de <strong>${sueldoFormat}</strong>`;
    textoBase += `.`;

    document.getElementById('cert-dirigido-text').innerText = opciones.dirigido;
    document.getElementById('cert-body-editable').innerHTML = textoBase;
    document.getElementById('cert-fecha-top').innerText = `Medellín, ${fechaHoyTxt}`;

    const canvas = document.getElementById('previewCanvas');
    canvas.innerHTML = ''; 
    const templateClone = document.getElementById('certificado-content').cloneNode(true);
    templateClone.id = "cloned-cert-content";
    canvas.appendChild(templateClone);

    document.getElementById('modalPreview').classList.remove('hidden');
}

window.cerrarPreview = function() {
    document.getElementById('modalPreview').classList.add('hidden');
    solicitudActualParaPDF = null;
}

window.descargarCertificado = async function() {
    if(!solicitudActualParaPDF) return;
    const btn = document.getElementById('btnDownloadFromPreview');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generando...';

    const emp = solicitudActualParaPDF.empleados;
    const element = document.getElementById('cloned-cert-content');
    const editableDiv = element.querySelector('#cert-body-editable');
    if (editableDiv) editableDiv.removeAttribute('contenteditable');

    const opt = {
        margin: 0,
        filename: `Certificado_Laboral_${emp.nombre_completo.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' } 
    };

    try {
        await html2pdf().set(opt).from(element).save();
        await supabaseAdmin.from('solicitudes_certificados').update({ estado: 'generado' }).eq('id', solicitudActualParaPDF.id);
        
        mostrarNotificacion('Certificado generado y cerrado con éxito', 'exito');
        cargarSolicitudesCertificados();
        cerrarPreview();
    } catch (err) {
        console.error(err);
        mostrarNotificacion('Error generando el PDF', 'error');
    } finally {
        btn.disabled = false; btn.innerHTML = originalText;
    }
}