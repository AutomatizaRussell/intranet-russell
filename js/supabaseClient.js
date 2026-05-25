// js/supabaseClient.js
const supabaseUrl = 'https://rbsupabase.rbgct.cloud'; // La IP de tu VPS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzExNTQ4MDAwLCJleHAiOjIyNDE0NDgwMDB9.j4VwYWqFcGOw8y4T0b4TlriPh35W8lrs_tuIuTrrrvQ';

// Inicializamos Supabase globalmente
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'rbgct'
  }
});