import { Types } from 'mongoose';
import { httpError } from './http';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type StringOptions = {
  min?: number;
  max?: number;
  allowEmpty?: boolean;
};

function hasOwn(source: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

export function objectRecord(value: unknown, field = 'body'): Record<string, unknown> {
  if (value === undefined) return {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw httpError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requiredString(value: unknown, field: string, options: StringOptions = {}): string {
  if (typeof value !== 'string') {
    throw httpError(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (!options.allowEmpty && trimmed.length === 0) {
    throw httpError(`${field} is required`);
  }
  if (options.min !== undefined && trimmed.length < options.min) {
    throw httpError(`${field} must be at least ${options.min} characters`);
  }
  if (options.max !== undefined && trimmed.length > options.max) {
    throw httpError(`${field} must be at most ${options.max} characters`);
  }

  return trimmed;
}

export function optionalString(
  source: Record<string, unknown>,
  field: string,
  options: StringOptions & { nullable: true },
): string | null | undefined;

export function optionalString(
  source: Record<string, unknown>,
  field: string,
  options?: StringOptions & { nullable?: false },
): string | undefined;

export function optionalString(
  source: Record<string, unknown>,
  field: string,
  options: StringOptions & { nullable?: boolean } = {},
): string | null | undefined {
  if (!hasOwn(source, field)) return undefined;
  const value = source[field];
  if (value === null && options.nullable) return null;
  return requiredString(value, field, options);
}

export function optionalBoolean(source: Record<string, unknown>, field: string): boolean | undefined {
  if (!hasOwn(source, field)) return undefined;
  if (typeof source[field] !== 'boolean') {
    throw httpError(`${field} must be a boolean`);
  }
  return source[field];
}

export function optionalNumber(
  source: Record<string, unknown>,
  field: string,
  options: { min?: number; max?: number; integer?: boolean } = {},
): number | undefined {
  if (!hasOwn(source, field)) return undefined;
  const value = source[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw httpError(`${field} must be a number`);
  }
  if (options.integer && !Number.isInteger(value)) {
    throw httpError(`${field} must be an integer`);
  }
  if (options.min !== undefined && value < options.min) {
    throw httpError(`${field} must be at least ${options.min}`);
  }
  if (options.max !== undefined && value > options.max) {
    throw httpError(`${field} must be at most ${options.max}`);
  }
  return value;
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw httpError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

export function optionalOneOf<const T extends readonly string[]>(
  source: Record<string, unknown>,
  field: string,
  allowed: T,
): T[number] | undefined {
  if (!hasOwn(source, field)) return undefined;
  return oneOf(source[field], field, allowed);
}

export function isoDate(value: unknown, field = 'date'): string {
  const date = requiredString(value, field);
  if (!DATE_RE.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime())) {
    throw httpError(`${field} must be a valid YYYY-MM-DD date`);
  }
  return date;
}

export function optionalIsoDate(source: Record<string, unknown>, field: string): string | undefined {
  if (!hasOwn(source, field)) return undefined;
  return isoDate(source[field], field);
}

export function stringArray(value: unknown, field: string, options: { maxItems?: number; maxItemLength?: number } = {}): string[] {
  if (!Array.isArray(value)) {
    throw httpError(`${field} must be an array`);
  }
  if (options.maxItems !== undefined && value.length > options.maxItems) {
    throw httpError(`${field} must contain at most ${options.maxItems} items`);
  }

  return value.map((item, index) => requiredString(item, `${field}[${index}]`, {
    max: options.maxItemLength,
  }));
}

export function assertObjectId(value: string, field = 'id'): void {
  if (!Types.ObjectId.isValid(value)) {
    throw httpError(`${field} is invalid`);
  }
}

export function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

export function validatePasswordStrength(password: string): void {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  if (passed < 3) {
    const tips: string[] = [];
    if (!checks.length) tips.push('at least 8 characters');
    if (!checks.uppercase) tips.push('an uppercase letter');
    if (!checks.lowercase) tips.push('a lowercase letter');
    if (!checks.digit) tips.push('a number');
    if (!checks.special) tips.push('a special character');
    throw httpError(`Password must include ${tips.join(', ')}`);
  }
}
