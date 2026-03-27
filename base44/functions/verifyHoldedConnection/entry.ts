import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey } = await req.json();

    if (!apiKey) {
      return Response.json({ error: 'API Key required' }, { status: 400 });
    }

    // Verificar con endpoint de contactos
    const response = await fetch('https://api.holded.com/api/invoicing/v1/contacts?page=1&perPage=1', {
      headers: {
        'key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return Response.json({ valid: true, message: 'Conexión verificada correctamente' });
    } else {
      return Response.json({ valid: false, message: 'API Key inválida' });
    }

  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});