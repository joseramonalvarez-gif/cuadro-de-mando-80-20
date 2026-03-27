import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, module, company_id, details } = await req.json();

    // Obtener IP del cliente (simulada en este caso)
    const ip_address = req.headers.get('x-forwarded-for') || 'unknown';

    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action,
      module: module || null,
      company_id: company_id || null,
      details: details || {},
      ip_address
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});