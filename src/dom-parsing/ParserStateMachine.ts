import { end, Parser, ParseResult } from 'prsc';
import { Input } from './parserEvents';

export const enum ParserStateType {
	one,
	star,
	optional,
}

export type ParserState<T> = {
	parser: Parser<T | void, Input>;
	type: ParserStateType;
};

export default class ParserStateMachine<T> implements Iterator<T> {
	private _states: ParserState<T>[];
	private _state = 0;

	private _input: Input;
	private _offset = 0;

	constructor(input: Input, states: ParserState<T>[]) {
		this._input = input;
		this._states = states;
	}

	public next(): IteratorResult<T, ParseResult<unknown>> {
		if (this._state >= this._states.length) {
			return { done: true, value: end(this._input, this._offset) };
		}

		const { parser, type } = this._states[this._state];
		const res = parser(this._input, this._offset);
		if (!res.success) {
			if (type === ParserStateType.one || res.fatal) {
				return { done: true, value: res };
			}
			this._state += 1;
			return this.next();
		}
		this._offset = res.offset;
		if (type !== ParserStateType.star) {
			this._state += 1;
		}
		if (res.value === undefined) {
			return this.next();
		}
		return { done: false, value: res.value };
	}
}
