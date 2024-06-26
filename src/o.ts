/**
 * This module defines a the `o` shorthand for all functions in the `option` module
 * @module
 */

import { None, Some, isNone, isSome, unwrap, unwrapOr } from './option'

/**
 * Shorthand for all functions in the `result` module for easy access
 */
export const o = {
	Some,
	None,
	isSome,
	isNone,
	unwrap,
	unwrapOr,
}

export type { Option } from './option'
