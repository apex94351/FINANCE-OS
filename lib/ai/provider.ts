import { z } from "zod";

export const invoiceExtractionSchema = z.object({
  document_type: z.string().nullable(),
  invoice_number: z.string().nullable(),
  issue_date: z.string().nullable(),
  due_date: z.string().nullable(),
  currency: z.string().nullable(),
  supplier: z.object({ name: z.string().nullable(), address: z.string().nullable(), email: z.string().nullable(), phone: z.string().nullable(), siret: z.string().nullable(), vat: z.string().nullable() }).nullable(),
  customer: z.object({ name: z.string().nullable(), address: z.string().nullable(), email: z.string().nullable(), phone: z.string().nullable(), siret: z.string().nullable(), vat: z.string().nullable() }).nullable(),
  financial: z.object({ subtotal: z.number().nullable(), discount: z.number().nullable(), vat: z.number().nullable(), vat_rate: z.number().nullable(), fees: z.number().nullable(), total: z.number().nullable() }),
  payment: z.object({ iban: z.string().nullable(), payment_terms: z.string().nullable(), payment_method: z.string().nullable() }),
  summary: z.string().nullable(),
  category: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  warnings: z.array(z.string()),
  missing_information: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  important_deadline: z.string().nullable(),
});

export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>;

export interface AIProvider {
  readonly name: string;
  extractInvoice(input: { file: Uint8Array; mimeType: string }): Promise<InvoiceExtraction>;
}

export class UnavailableAIProvider implements AIProvider {
  readonly name = "unconfigured";

  async extractInvoice(): Promise<InvoiceExtraction> {
    throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  }
}

export function getAIProvider(): AIProvider {
  return new UnavailableAIProvider();
}
