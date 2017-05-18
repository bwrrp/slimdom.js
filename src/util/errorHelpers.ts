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
