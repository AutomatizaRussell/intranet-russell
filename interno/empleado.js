document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btnLogin = document.getElementById('btn-login');
            const originalButtonText = btnLogin.innerHTML;
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Iniciando sesión...';

            try {
                // Primero, intentar iniciar sesión con Supabase Auth
                const { data: { user }, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (authError) throw authError;

                // Si el login es exitoso, verificar el rol del empleado en la tabla 'empleados'
                const { data: empleado, error: empleadoError } = await window.supabaseClient
                    .from('empleados')
                    .select('rol, nombre_completo, correo_corporativo')
                    .eq('correo_corporativo', user.email)
                    .single();

                if (empleadoError) throw empleadoError;
                if (!empleado) throw new Error('Empleado no encontrado en la base de datos.');

                // Guardar información del empleado en localStorage para la sesión administrativa
                localStorage.setItem('empleado_rol', empleado.rol);
                localStorage.setItem('empleado_nombre', empleado.nombre_completo);
                localStorage.setItem('empleado_email', empleado.correo_corporativo);

                if (empleado.rol !== 'admin') {
                    await window.supabaseClient.auth.signOut();
                    localStorage.clear();
                    alert('Solo el personal administrativo puede ingresar a este panel.');
                    return;
                }

                // Redirigir al panel administrativo
                window.location.href = '../admin/panel.html';

            } catch (error) {
                console.error('Error de autenticación:', error.message);
                alert('Error al iniciar sesión: ' + error.message);
            } finally {
                btnLogin.disabled = false;
                btnLogin.innerHTML = originalButtonText;
            }
        });
    }
});

// Función para cerrar sesión (puede ser útil en dashboard.html o en el panel admin)
window.logout = async () => {
    await window.supabaseClient.auth.signOut();
    localStorage.clear();
    window.location.href = './login.html';
};