export type ResultStatus = Result<unknown, unknown>['status']

export type OkResult<TValue> = {
	status: 'success'
	value: TValue
}

export type ErrResult<TError> = {
	status: 'error'
	value: TError
}

export type PendingResult = {
	status: 'pending'
}

export type EmptyResult = {
	status: 'empty'
}

export type Result<TValue, TError> = OkResult<TValue> | ErrResult<TError> | PendingResult | EmptyResult

/**
 * Checks if the given value is a result
 * @alias r.isResult
 */
export let IsResult = (result: unknown): result is Result<unknown, unknown> => {
	return Boolean(result && typeof result === 'object' && 'status' in result && 'value' in result)
}

/**
 * Checks if the result is an _ok_ result
 * @alias r.isOk
 */
export let IsOk = <TValue, TError>(result: Result<TValue, TError>): result is OkResult<TValue> => {
	return result.status === 'success'
}

/**
 * Checks if the result is an _err_ result
 * @alias r.isErr
 */
export let IsErr = <TValue, TError>(result: Result<TValue, TError>): result is ErrResult<TError> => {
	return result.status === 'error'
}

/**
 * Checks if the result is a _empty_ result
 * @alias r.isEmpty
 */
export let IsEmpty = <TValue, TError>(result: Result<TValue, TError>): result is EmptyResult => {
	return result.status === 'empty'
}

/**
 * Checks if the result is a _pending_ result
 * @alias r.isPending
 */
export let IsPending = <TValue, TError>(result: Result<TValue, TError>): result is PendingResult => {
	return result.status === 'pending'
}

export let config = {
	verbose: false,
}

/**
 * Creates a new _ok_ result with the given value
 * @alias r.ok
 * @example
 * ```ts
 * import { Ok } from '@vyke/results'
 *
 * const result = Ok(123)
 * //      ^? Result<number, never>
 * ```
 */
export let Ok = <TValue>(value: TValue): Result<TValue, never> => {
	return {
		value,
		status: 'success',
	}
}

/**
 * Creates a new _err_ result with the given error
 * @alias r.err
 * @example
 * ```ts
 * import { Err } from '@vyke/results'
 *
 * const result = Err(new Error('some error'))
 * //      ^? Result<never, Error>
 * ```
 * > [!NOTE]
 * > Error values don't need to be an error, they can be anything
 */
export let Err = <TError>(error: TError): Result<never, TError> => {
	return {
		value: error,
		status: 'error',
	}
}

/**
 * Creates a new _empty_ result
 * @alias r.empty
 * @example
 * ```ts
 * import { Empty, IsEmpty } from '@vyke/results'
 *
 * const result = Empty()
 *
 * if (IsEmpty(result)) {
 * 	console.log('The result is empty')
 * }
 *
 * result.value // not available
 * ```
 */
export let Empty = (): EmptyResult => {
	return {
		status: 'empty',
	}
}

/**
 * Creates a new _pending_ result
 * @alias r.pending
 * @example
 * ```ts
 * import { IsPending, Pending } from '@vyke/results'
 *
 * const result = Pending()
 *
 * if (Pending(result)) {
 * 	console.log('The result is pending')
 * }
 *
 * result.value // not available
 * ```
 */
export let Pending = (): PendingResult => {
	return {
		status: 'pending',
	}
}

export class ResultError<TError = unknown> extends Error implements ErrResult<TError> {
	status: 'error' = 'error' as const
	value: TError
	constructor(message: string, value: TError) {
		super(message)
		this.value = value
	}
}

/**
 * Unwraps the result value or throws the error
 * @alias r.unwrap
 * @example
 * ```ts
 * import { Ok, unwrap } from '@vyke/results'
 *
 * const value = unwrap(Ok(123))
 * //      ^? number
 * unwrap(Err(new Error('some error'))) // throws the error
 * ```
 */
export let unwrap = <TValue, TError>(result: Result<TValue, TError>): TValue => {
	if (IsOk(result)) {
		return result.value
	}

	if (IsErr(result)) {
		const { value } = result
		throw new ResultError(
			value instanceof Error
				? value.message
				: `${value}`, value,
		)
	}

	throw new ResultError('Cannot unwrap a pending or empty result', result)
}

/**
 * Unwraps the result value or returns the default value
 * @alias r.unwrapOr
 * @example
 * ```ts
 * import { Ok, unwrapOr } from '@vyke/results'
 *
 * const value = unwrapOr(Ok(123), 10)
 * //      ^? number
 * unwrapOr(Err(new Error('some error')), 10) // returns 10 instead of the error
 * ```
 */
export let unwrapOr = <TValue, TError>(
	result: Result<TValue, TError>,
	defaultValue: TValue,
): TValue => {
	if (IsOk(result)) {
		return result.value
	}

	return defaultValue
}

/**
 * Similar to unwraps but with a custom error
 * @alias r.expect
 * @example
 * ```ts
 * import { Err, Ok, expect } from '@vyke/results'
 *
 * const value = expect(Ok(123), 'some error')
 * //     ^? number
 *
 * expect(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
 * ```
 */
export let expect = <TValue, TError, TMessage>(result: Result<TValue, TError>, message: TMessage): TValue => {
	if (IsOk(result)) {
		return result.value
	}

	throw typeof message === 'string' ? new Error(message) : message
}

type Fn<TValue, TError = unknown> = () => Result<TValue, TError>

/**
 * Runs the given function and always returns a result,
 * in case of error it will _capture_ and convert to result if needed
 * @alias r.capture
 * @example
 * ```ts
 * import { Err, Ok, capture, unwrap } from '@vyke/results'
 *
 * const result1 = capture(() => Ok(123)) // only returns the result
 * //     ^? Result<number, unknown>
 *
 * const result2 = capture(() => {
 * 	unwrap(Err(new Error('some error')))
 * })
 * ```
 */
export let capture = <TValue, TError = unknown>(fn: Fn<TValue, TError>): Result<TValue, TError | unknown> => {
	try {
		return fn()
	}
	catch (error) {
		if (error instanceof ResultError) {
			return error
		}
		return Err(error)
	}
}
