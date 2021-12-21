export function expectArity(args: IArguments, minArity: number): void {
	// According to WebIDL overload resolution semantics, only a lower bound applies to the number
	// of arguments provided
	if (args.length < minArity) {
		throw new TypeError(`Function should be called with at least ${minArity} arguments`);
	}
}

export function expectObject<T>(value: T, Constructor: Function): void {
	if (!(value instanceof Constructor)) {
		throw new TypeError(`Value should be an instance of ${Constructor.name}`);
	}
}

const codeByName: Record<string, number> = {
	IndexSizeError: 1,
	HierarchyRequestError: 3,
	WrongDocumentError: 4,
	InvalidCharacterError: 5,
	NotFoundError: 8,
	NotSupportedError: 9,
	InUseAttributeError: 10,
	InvalidStateError: 11,
	NamespaceError: 14,
	InvalidNodeTypeError: 24,
};

/**
 * Exception type used for DOM errors
 *
 * @public
 */
export class DOMException extends Error {
	public readonly name: string;
	public readonly message: string;
	public readonly code: number;
	public readonly stack: string | undefined;

	constructor(message: string = '', name: string = 'Error') {
		super(message);

		this.message = message;
		this.name = name;
		this.code = codeByName[name] || 0;
		this.stack = new Error(message).stack;
	}
}

function createDOMException(name: string, message: string): Error {
	return new DOMException(`${name}: ${message}`, name);
}

export function throwHierarchyRequestError(message: string): never {
	throw createDOMException('HierarchyRequestError', message);
}

export function throwIndexSizeError(message: string): never {
	throw createDOMException('IndexSizeError', message);
}

export function throwInUseAttributeError(message: string): never {
	throw createDOMException('InUseAttributeError', message);
}

export function throwInvalidCharacterError(message: string): never {
	throw createDOMException('InvalidCharacterError', message);
}

export function throwInvalidNodeTypeError(message: string): never {
	throw createDOMException('InvalidNodeTypeError', message);
}

export function throwInvalidStateError(message: string): never {
	throw createDOMException('InvalidStateError', message);
}

export function throwNamespaceError(message: string): never {
	throw createDOMException('NamespaceError', message);
}

export function throwNotFoundError(message: string): never {
	throw createDOMException('NotFoundError', message);
}

export function throwNotSupportedError(message: string): never {
	throw createDOMException('NotSupportedError', message);
}

export function throwWrongDocumentError(message: string): never {
	throw createDOMException('WrongDocumentError', message);
}
