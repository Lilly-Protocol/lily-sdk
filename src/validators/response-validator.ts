export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  validate?: (value: unknown) => boolean;
}

export class ResponseValidator {
  constructor(private rules: Record<string, ValidationRule[]>) {}

  validate(endpoint: string, data: unknown): { valid: boolean; errors: string[] } {
    const rules = this.rules[endpoint];
    if (!rules) return { valid: true, errors: [] };

    const errors: string[] = [];
    const obj = (data || {}) as Record<string, unknown>;

    for (const rule of rules) {
      const value = obj[rule.field];
      if (value === undefined || value === null) {
        if (rule.required) errors.push(`Missing required field: ${rule.field}`);
        continue;
      }
      if (typeof value !== rule.type) {
        errors.push(`Field ${rule.field} expected ${rule.type}, got ${typeof value}`);
      }
      if (rule.validate && !rule.validate(value)) {
        errors.push(`Field ${rule.field} failed custom validation`);
      }
    }
    return { valid: errors.length === 0, errors };
  }
}
