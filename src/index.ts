export type Ok<TValue> = {
	ok: true
	value: TValue
}

export type Err<TError> = {
	ok: false
	value: TError
}

export type Result<TValue, TError> = Ok<TValue> | Err<TError>

export type Mapper<TValue, TResult extends Result<any, any>> = (value: TValue) => TResult

export const config = {
	verbose: false,
}

/**
 * Creates a new _ok_ result with the given value
 * @alias r.ok
 * @example
 * import { Ok } from '@vyke/results'
 *
 * const result = Ok(123)
 */
export function Ok<TValue>(value: TValue): Result<TValue, never> {
	return {
		value,
		ok: true,
	}
}

/**
 * Creates a new _err_ result with the given error
 * @alias r.err
 * @example
 * import { Err } from '@vyke/results'
 *
 * const result = Err(new Error('some error'))
 */
export function Err<TError>(error: TError): Result<never, TError> {
	return {
		value: error,
		ok: false,
	}
}

/**
 * Unwraps the result return the value or throwing the error
 * @alias r.unwrap
 * @example
 * import { Ok, unwrap } from '@vyke/results'
 *
 * const value = unwrap(Ok(123))
 * //      ^? number
 * unwrap(Err(new Error('some error'))) // throws the error
 */
export function unwrap<TValue, TError>(result: Result<TValue, TError>): TValue {
	if (result.ok) {
		return result.value
	}

	throw result.value
}

/**
 * Similar to unwraps but with a custom error
 * @alias r.expect
 * @example
 * import { Err, Ok, expect } from '@vyke/results'
 *
 * const value = expect(Ok(123), 'some error')
 * //     ^? number
 * expect(Err(new Error('some error')), 'another error') // throws the error with the mssage `another error`
 */
export function expect<TValue, TError, TMessage>(result: Result<TValue, TError>, message: TMessage): TValue {
	if (result.ok) {
		return result.value
	}

	throw typeof message === 'string' ? new Error(message) : message
}

/**
 * Converts a promise to a result
 * @alias `r.to`
 * @example
 * import { to } from '@vyke/results'
 *
 * const result = await to(Promise.resolve(123))
 * //     ^? Result<number, unknown>
 */
export async function to<TValue, TError = unknown>(promise: Promise<TValue>): Promise<Result<TValue, TError>> {
	try {
		const data = await promise

		return Ok(data)
	}
	catch (error) {
		if (config.verbose) {
			console.error(error)
		}
		return Err(error as TError)
	}
}

/**
 * Converts a promise to a result
 * @alias `r.andThen`
 * @example
 * import { Ok, andThen } from '@vyke/results'
 *
 * const result = andThen(Ok(123), (value) => {
 * 	return Ok(String(value))
 * })
 */
export function andThen<TValue, TError, TNewValue = TValue, TNewError = TError>(
	result: Result<TValue, TError>,
	fn: Mapper<TValue, Result<TNewValue, TNewError>>,
): Err<TError> | Result<TNewValue, TNewError> {
	if (result.ok) {
		return fn(result.value)
	}

	return result
}

export function next<TValue, TNextValue, TNextError>(
	nextFn: (value: TValue) => Result<TNextValue, TNextError> | Promise<Result<TNextValue, TNextError>>,
	message?: string,
) {
	return async <TError>(result: Result<TValue, TError>): Promise<Result<TNextValue, TError | TNextError | Error>> => {
		if (result.ok) {
			const nextResult = await nextFn(result.value)

			if (!nextResult.ok) {
				if (message) {
					if (config.verbose) {
						console.error(nextResult.value)
					}

					return Err(new Error(message))
				}
			}

			return nextResult
		}

		return result
	}
}

export const r = {
	ok: Ok,
	err: Err,
	unwrap,
	expect,
	to,
	andThen,
	next,
	config,
}
