export function expectArity(args: IArguments, minArity: number): void {
	// According to WebIDL overload resolution semantics, only a lower bound applies to the number of arguments provided
	if (args.length < minArity) {
		throw new TypeError(`Function should be called with at least ${minArity} arguments`);
	}
}

export function expectObject<T>(value: T, Constructor: any): void {
	if (!(value instanceof Constructor)) {
		throw new TypeError(`Value should be an instance of ${Constructor.name}`);
	}
}

function createDOMException(name: string, code: number, message: string): Error {
	const err = new Error(`${name}: ${message}`);
	err.name = name;
	(err as any).code = code;
	return err;
}

export function throwHierarchyRequestError(message: string): never {
	throw createDOMException('HierarchyRequestError', 3, message);
}

export function throwIndexSizeError(message: string): never {
	throw createDOMException('IndexSizeError', 1, message);
}

export function throwInUseAttributeError(message: string): never {
	throw createDOMException('InUseAttributeError', 10, message);
}

export function throwInvalidCharacterError(message: string): never {
	throw createDOMException('InvalidCharacterError', 5, message);
}

export function throwInvalidNodeTypeError(message: string): never {
	throw createDOMException('InvalidNodeTypeError', 24, message);
}

export function throwNamespaceError(message: string): never {
	throw createDOMException('NamespaceError', 14, message);
}

export function throwNotFoundError(message: string): never {
	throw createDOMException('NotFoundError', 8, message);
}

export function throwNotSupportedError(message: string): never {
	throw createDOMException('NotSupportedError', 9, message);
}

export function throwWrongDocumentError(message: string): never {
	throw createDOMException('WrongDocumentError', 4, message);
}
