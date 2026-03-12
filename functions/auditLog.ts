import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, module, details, company_id } = await req.json();

    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Create audit log entry
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      action,
      module: module || null,
      details: details || {},
      ip_address: ip,
      company_id: company_id || null,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});