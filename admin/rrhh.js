// 1. Inicialización de Supabase
// Asegúrate de importar el script de Supabase en tu HTML antes de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const adminSupabaseUrl = 'https://db.rbgct.cloud';
const adminSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.empG3TVP0rYZ-FUYZcm08Ua-nUfhD2NXsAjTEfGs-ic';
const supabaseAdmin = window.supabase.createClient(adminSupabaseUrl, adminSupabaseKey);

let vacantesData = [];

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
    await cargarPostulaciones();
    await cargarGestionVacantes();

    document.getElementById('btn-logout').addEventListener('click', async () => {
        if(window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.href = '../index.html';
    });
});

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