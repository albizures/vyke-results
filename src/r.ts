/**
 * This module defines a the `r` shorthand for all functions in the `result` module
 * @module
 */

import {
	Err,
	Ok,
	andThen,
	capture,
	expectOk,
	isErr,
	isOk,
	map,
	mapInto,
	next,
	to,
	toExpectOk,
	toUnwrap,
	toUnwrapOr,
	unwrap,
	unwrapOr,
} from './result'

/**
 * Shorthand for all functions in the `result` module for easy access
 */
export const r = {
	Ok,
	Err,
	isOk,
	isErr,
	map,
	unwrap,
	mapInto,
	capture,
	unwrapOr,
	expectOk,
	to,
	next,
	andThen,
	toUnwrap,
	toUnwrapOr,
	toExpectOk,
}

export type { Result } from './result'
