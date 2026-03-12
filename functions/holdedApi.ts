import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const HOLDED_BASE = 'https://api.holded.com/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function fetchHolded(apiKey, endpoint, retries = 0) {
  const url = `${HOLDED_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'key': apiKey,
      'Accept': 'application/json',
    },
  });

  if (response.status === 429 && retries < MAX_RETRIES) {
    const delay = RETRY_DELAY_MS * Math.pow(2, retries);
    await new Promise(r => setTimeout(r, delay));
    return fetchHolded(apiKey, endpoint, retries + 1);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Holded API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function fetchHoldedAllPages(apiKey, endpoint) {
  let allData = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const pagedEndpoint = `${endpoint}${separator}page=${page}`;
    const data = await fetchHolded(apiKey, pagedEndpoint);
    
    if (Array.isArray(data) && data.length > 0) {
      allData = [...allData, ...data];
      hasMore = data.length >= 100;
      page++;
    } else if (Array.isArray(data)) {
      hasMore = false;
    } else {
      return data;
    }
  }
  
  return allData.length > 0 ? allData : [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    const { action, companyId, company_id, endpoint, params } = body;

    const finalCompanyId = companyId || company_id;

    if (!finalCompanyId) {
      return Response.json({ error: 'companyId requerido' }, { status: 400 });
    }

  // Get company and API key (service role to access the key)
  const companies = await base44.asServiceRole.entities.Company.filter({ id: finalCompanyId });
  const company = companies[0];
  
  if (!company || !company.holded_api_key) {
    return Response.json({ error: 'Empresa sin API Key configurada', is_demo: true }, { status: 400 });
  }

  const apiKey = company.holded_api_key;
  const startTime = Date.now();

    if (action === 'fetch') {
      if (!endpoint) {
        return Response.json({ error: 'endpoint requerido para action=fetch' }, { status: 400 });
      }

      const data = await fetchHoldedAllPages(apiKey, endpoint);
      const elapsed = Date.now() - startTime;

      // Log the API call
      await base44.asServiceRole.entities.ApiLog.create({
        company_id: finalCompanyId,
        endpoint,
        method: 'GET',
        status_code: 200,
        response_time_ms: elapsed,
        records_fetched: Array.isArray(data) ? data.length : 1,
      });

      return Response.json({ success: true, data, records: Array.isArray(data) ? data.length : 1 });
    }

    if (action === 'sync_all') {
      // Only admin can trigger full sync
      if (user.role !== 'admin') {
        return Response.json({ error: 'Solo administradores pueden sincronizar' }, { status: 403 });
      }

    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - (180 * 24 * 60 * 60);

    const endpoints = [
      { type: 'invoices_sale', path: `/invoicing/v1/documents/invoice?starttmp=${sixMonthsAgo}&endtmp=${now}` },
      { type: 'invoices_purchase', path: `/invoicing/v1/documents/purchase?starttmp=${sixMonthsAgo}&endtmp=${now}` },
      { type: 'creditnotes', path: `/invoicing/v1/documents/creditnote?starttmp=${sixMonthsAgo}&endtmp=${now}` },
      { type: 'contacts', path: '/invoicing/v1/contacts' },
      { type: 'treasuries', path: '/treasury/v1/treasury' },
      { type: 'payments', path: `/invoicing/v1/payments?starttmp=${sixMonthsAgo}&endtmp=${now}` },
      { type: 'products', path: '/invoicing/v1/products' },
      { type: 'taxes', path: '/invoicing/v1/taxes' },
      { type: 'employees', path: '/team/v1/employees' },
      { type: 'times', path: `/team/v1/times?starttmp=${sixMonthsAgo}&endtmp=${now}` },
      { type: 'ledger', path: `/accounting/v1/dailyledger?starttmp=${sixMonthsAgo}&endtmp=${now}` },
      { type: 'accounts', path: '/accounting/v1/chartofaccounts' },
    ];

    const results = {};
    for (const ep of endpoints) {
      try {
        const epStart = Date.now();
        const data = await fetchHoldedAllPages(apiKey, ep.path);
        const elapsed = Date.now() - epStart;

        // Cache the data
        const existing = await base44.asServiceRole.entities.CachedData.filter({
          company_id: finalCompanyId,
          data_type: ep.type,
        });

        if (existing.length > 0) {
          await base44.asServiceRole.entities.CachedData.update(existing[0].id, {
            data: { items: Array.isArray(data) ? data : [data] },
            last_fetched: new Date().toISOString(),
            last_timestamp: now,
          });
        } else {
          await base44.asServiceRole.entities.CachedData.create({
            company_id: finalCompanyId,
            data_type: ep.type,
            data: { items: Array.isArray(data) ? data : [data] },
            last_fetched: new Date().toISOString(),
            last_timestamp: now,
          });
        }

        await base44.asServiceRole.entities.ApiLog.create({
          company_id: finalCompanyId,
          endpoint: ep.path,
          method: 'GET',
          status_code: 200,
          response_time_ms: elapsed,
          records_fetched: Array.isArray(data) ? data.length : 1,
        });

        results[ep.type] = Array.isArray(data) ? data.length : 1;
      } catch (error) {
        console.error(`Error syncing ${ep.type}:`, error.message);
        results[ep.type] = { error: error.message };
        
        // Log the error
        await base44.asServiceRole.entities.ApiLog.create({
          company_id: finalCompanyId,
          endpoint: ep.path,
          method: 'GET',
          status_code: 500,
          response_time_ms: 0,
          error_message: error.message,
        });
      }
    }

    // Update company last sync date
    await base44.asServiceRole.entities.Company.update(finalCompanyId, {
      last_sync_date: new Date().toISOString(),
      is_demo: false,
    });

      return Response.json({ success: true, results });
    }

    return Response.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('holdedApi error:', error);
    return Response.json({ 
      error: error.message || 'Error interno del servidor',
      details: error.toString()
    }, { status: 500 });
  }
});