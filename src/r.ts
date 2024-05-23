/**
 * This module defines a the `r` shorthand for all functions in the `result` module
 * @module
 */

import * as all from './'

/**
 * Shorthand for all functions in the `result` module for easy access
 */
export let r = {
	...all,
	ok: all.Ok,
	err: all.Err,
	empty: all.Empty,
	pending: all.Pending,

	isOk: all.IsOk,
	isErr: all.IsErr,
	isEmpty: all.IsEmpty,
	isResult: all.IsResult,
	isPending: all.IsPending,

	intoErr: all.intoErr,
}
