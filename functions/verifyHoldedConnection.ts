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
      return Response.json({ error: 'API Key is required' }, { status: 400 });
    }

    // Test connection to Holded API
    const testResponse = await fetch('https://api.holded.com/api/invoicing/v1/contacts?page=1&perPage=1', {
      headers: {
        'Accept': 'application/json',
        'Key': apiKey,
      },
    });

    if (testResponse.ok) {
      return Response.json({ success: true, message: 'Conexión verificada correctamente' });
    } else {
      const error = await testResponse.text();
      return Response.json({ 
        success: false, 
        message: `Error ${testResponse.status}: ${error}` 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
});