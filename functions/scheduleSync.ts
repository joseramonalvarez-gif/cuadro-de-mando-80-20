import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    // This function is called by automation, no user auth required
    const base44 = createClientFromRequest(req);

    // Get all active companies (non-demo with API keys)
    const companies = await base44.asServiceRole.entities.Company.filter({
      is_demo: false,
    });

    const results = {};

    for (const company of companies) {
      if (!company.holded_api_key) continue;

      try {
        // Call holdedApi sync for each company
        const syncResult = await base44.asServiceRole.functions.invoke('holdedApi', {
          companyId: company.id,
          action: 'sync_all',
        });

        results[company.id] = { success: true, data: syncResult.data };

        // Log audit
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: 'system',
          action: 'etl_refresh',
          module: 'system',
          company_id: company.id,
          details: { automatic: true, scheduled: true },
          ip_address: 'system',
        });
      } catch (error) {
        results[company.id] = { success: false, error: error.message };
        
        // Log error
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: 'system',
          action: 'etl_refresh',
          module: 'system',
          company_id: company.id,
          details: { automatic: true, scheduled: true, error: error.message },
          ip_address: 'system',
        });
      }
    }

    return Response.json({ 
      success: true, 
      companies_synced: Object.keys(results).length,
      results 
    });
  } catch (error) {
    console.error('Schedule sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});