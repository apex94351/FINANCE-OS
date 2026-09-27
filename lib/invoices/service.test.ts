import test from 'node:test';
import assert from 'node:assert/strict';

import { getInvoiceDisplayStatus, getInvoiceSummary } from './service.ts';

test('getInvoiceDisplayStatus prefers overdue when due date is in the past', () => {
  const invoice = {
    id: '1',
    user_id: 'user-1',
    company_id: null,
    document_id: null,
    invoice_number: 'FA-001',
    invoice_type: 'payable',
    supplier_name: 'Example SAS',
    customer_name: null,
    issue_date: '2026-09-01',
    due_date: '2026-09-10',
    subtotal_ht: 1000,
    vat_amount: 200,
    vat_rate: 20,
    total_ttc: 1200,
    currency: 'EUR',
    status: 'to_pay',
    category: null,
    notes: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  };

  assert.equal(getInvoiceDisplayStatus(invoice), 'overdue');
});

test('getInvoiceSummary totals only active amounts', () => {
  const invoices = [
    {
      id: '1',
      user_id: 'user-1',
      company_id: null,
      document_id: null,
      invoice_number: 'FA-001',
      invoice_type: 'payable',
      supplier_name: 'Example SAS',
      customer_name: null,
      issue_date: '2026-09-01',
      due_date: '2026-09-10',
      subtotal_ht: 1000,
      vat_amount: 200,
      vat_rate: 20,
      total_ttc: 1200,
      currency: 'EUR',
      status: 'to_pay',
      category: null,
      notes: null,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-1',
      company_id: null,
      document_id: null,
      invoice_number: 'FA-002',
      invoice_type: 'receivable',
      supplier_name: null,
      customer_name: 'Client Test',
      issue_date: '2026-09-02',
      due_date: '2026-09-20',
      subtotal_ht: 2000,
      vat_amount: 400,
      vat_rate: 20,
      total_ttc: 2400,
      currency: 'EUR',
      status: 'paid',
      category: null,
      notes: null,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    },
  ];

  assert.deepEqual(getInvoiceSummary(invoices), {
    payable: 1200,
    receivable: 0,
    overdue: 1200,
    total: 2,
  });
});
