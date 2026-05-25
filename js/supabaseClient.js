// js/supabaseClient.js
const supabaseUrl = 'https://api.rbsupabase.rbgct.cloud'; // URL sin puerto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzExNTQ4MDAwLCJleHAiOjIyNDE0NDgwMDB9.j4VwYWqFcGOw8y4T0b4TlriPh35W8lrs_tuIuTrrrvQ';

// Inicializamos Supabase sin restricciones de esquema global
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);