import { EntityRefEvent } from './parserEvents';
import { throwErrorWithContext } from './parsingAlgorithms';

/*
 * Guard against entity expansion attacks by keeping track of the initial input
 * length vs. the expanded input length. The latter includes the length of the
 * replacement text for each processed entity reference. An attack is likely if
 * the ratio between the two exceeds the maximum amplification factor AND the
 * expanded input length exceeds a threshold. This approach and defaults are
 * taken from libexpat's billion laughs attack protection.
 */
export default class EntityExpansionGuard {
	private readonly _initialInputLength: number;

	private _expandedInputLength: number;

	private readonly _entityExpansionThreshold: number;

	private readonly _entityExpansionMaxAmplification: number;

	private _topLevelEntityRef: EntityRefEvent | null = null;

	private _depth = 0;

	public constructor(
		initialInputLength: number,
		entityExpansionThreshold: number,
		entityExpansionMaxAmplification: number
	) {
		this._initialInputLength = initialInputLength;
		this._expandedInputLength = initialInputLength;
		this._entityExpansionThreshold = entityExpansionThreshold;
		this._entityExpansionMaxAmplification = entityExpansionMaxAmplification;
	}

	public enter(event: EntityRefEvent, replacementTextLength: number): void {
		const topLevelEntityRef = this._topLevelEntityRef ?? event;
		this._expandedInputLength += replacementTextLength;
		if (this._expandedInputLength > this._entityExpansionThreshold) {
			const amplification = this._expandedInputLength / this._initialInputLength;
			if (amplification > this._entityExpansionMaxAmplification) {
				throwErrorWithContext('too much entity expansion', topLevelEntityRef);
			}
		}
		this._topLevelEntityRef = topLevelEntityRef;
		this._depth += 1;
	}

	public exit(): void {
		this._depth -= 1;
		if (this._depth === 0) {
			this._topLevelEntityRef = null;
		}
	}
}
