import * as all from './'

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
}
