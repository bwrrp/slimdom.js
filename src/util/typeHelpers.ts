import { expectObject } from './errorHelpers';

export function asUnsignedLong(number: number): number {
	return number >>> 0;
}

export function treatNullAsEmptyString(value: string | null): string {
	// Treat null as empty string
	if (value === null) {
		return '';
	}

	// Coerce other values to string
	return String(value);
}

export function asObject<T>(value: T, Constructor: any, typeName: string): T {
	expectObject(value, Constructor, typeName);

	return value;
}

export function asNullableObject<T>(value: T | null | undefined, Constructor: any, typeName: string): T | null {
	if (value === undefined || value === null) {
		return null;
	}

	return asObject(value, Constructor, typeName);
}

export function asNullableString(value: string | null | undefined): string | null {
	// Treat undefined as null
	if (value === undefined) {
		return null;
	}

	return value;
}
