export function expectArity (args: IArguments, minArity: number): void {
	// According to WebIDL overload resolution semantics, only a lower bound applies to the number of arguments provided
	if (args.length < minArity) {
		throw new TypeError(`Function should be called with at least ${minArity} arguments`);
	}
}

export function expectObject<T> (value: T, Constructor: any): void {
	if (!(value instanceof Constructor)) {
		throw new TypeError(`Value should be an instance of ${Constructor.name}`);
	}
}

function createDOMException (name: string, code: number, message: string): Error {
	const err = new Error(`${name}: ${message}`);
	err.name = name;
	(err as any).code = code;
	return err;
}

export function throwHierarchyRequestError (message: string): never {
	throw new Error(`HierarchyRequestError: ${message}`);
}

export function throwIndexSizeError (message: string): never {
	throw new Error(`IndexSizeError: ${message}`);
}

export function throwInUseAttributeError (message: string): never {
	throw new Error(`InUseAttributeError: ${message}`);
}

export function throwInvalidNodeTypeError (message: string): never {
	throw new Error(`InvalidNodeTypeError: ${message}`);
}

export function throwNamespaceError (message: string): never {
	throw new Error(`NamespaceError: ${message}`);
}

export function throwNotFoundError (message: string): never {
	throw new Error(`NotFoundError: ${message}`);
}

export function throwNotSupportedError (message: string): never {
	throw new Error(`NotSupportedError: ${message}`);
}

export function throwWrongDocumentError (message: string): never {
	throw new Error(`WrongDocumentError: ${message}`);
}
