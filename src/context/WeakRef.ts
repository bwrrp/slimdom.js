// TODO: remove when interface is included in dom.d.ts typings
export interface WeakRef<T> {
	deref(): T | undefined;
}
interface WeakRefConstructor<T> {
	new (target: T): WeakRef<T>;
}
declare var WeakRef: WeakRefConstructor<any>;

class FakeWeakRef<T> implements WeakRef<T> {
	private _target: T;

	constructor(target: T) {
		this._target = target;
	}

	public deref(): T {
		return this._target;
	}
}

export function createWeakRef<T>(target: T): WeakRef<T> {
	if (typeof WeakRef === 'function') {
		return new WeakRef(target);
	}

	return new FakeWeakRef(target);
}
