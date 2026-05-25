// js/supabaseClient.js
const supabaseUrl = 'https://api.rbsupabase.rbgct.cloud'; // La IP de tu VPS
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3OTQ4ODk0MCwiZXhwIjo0OTM1MTYyNTQwLCJyb2xlIjoiYW5vbiJ9.LgDk68gU-GMfse0CHjrFsaDwl_SDzmiP4g5yytTDrcE';

// Inicializamos Supabase globalmente
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'rbgct'
  }
});