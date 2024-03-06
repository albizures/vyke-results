export type Ok<TValue> = {
	ok: true
	value: TValue
}

export type Err<TError> = {
	ok: false
	value: TError
}

export type Result<TValue, TError> = Ok<TValue> | Err<TError>

export let isResult = (result: unknown): result is Result<unknown, unknown> => {
	return Boolean(
		result
		&& typeof result === 'object'
		&& 'ok' in result
		&& 'value' in result,
	)
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
		ok: true,
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
		ok: false,
	}
}

export class ResultError<TError = unknown> extends Error implements Err<TError> {
	ok: false = false as const
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
	if (result.ok) {
		return result.value
	}

	const { value } = result
	throw new ResultError(
		value instanceof Error
			? value.message
			: `${value}`, value,
	)
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
	if (result.ok) {
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
	if (result.ok) {
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
export let capture = <TValue, TError = unknown>(fn: Fn<TValue, TError>) => {
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
