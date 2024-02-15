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

	throw result.value
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

/**
 * Converts a promise to a result
 * @alias r.to
 * @example
 * ```ts
 * import { to } from '@vyke/results'
 *
 * const result = await to(Promise.resolve(123))
 * //     ^? Result<number, unknown>
 * ```
 * > [!CAUTION]
 * > Notice that Result error type is unknown
 */
export let to = async <TValue, TError = unknown>(promise: Promise<TValue>): Promise<Result<TValue, TError>> => {
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
 * @alias r.andThen
 * @example
 * ```ts
 * import { Ok, andThen } from '@vyke/results'
 *
 * const result = andThen(Ok(123), (value) => Ok(String(value)))
 * //      ^? Result<number, never>
 * ```
 */
export let andThen = <TValue, TError, TNewValue = TValue, TNewError = TError>(
	result: Result<TValue, TError>,
	fn: Mapper<TValue, Result<TNewValue, TNewError>>,
): Err<TError> | Result<TNewValue, TNewError> => {
	if (result.ok) {
		return fn(result.value)
	}

	return result
}

/**
 * Similar to andThen, but to create a function to be used in a _then_ function
 * @alias r.next
 * @example
 * ```ts
 * import { next, to } from '@vyke/results'
 *
 * const result = await Promise.resolve(Ok(123))
 * //     ^? Result<string, never>
 * 	.then(next((value) => Ok(String(value))))
 * ```
 */
export let next = <TValue, TNextValue, TNextError>(
	nextFn: (value: TValue) => Result<TNextValue, TNextError> | Promise<Result<TNextValue, TNextError>>,
	message?: string,
) => {
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

/**
 * Awaits for the promise and unwraps it then returns the value or throws the error
 * @alias r.toUnwrap
 * @example
 * ```ts
 * import { Ok, toUnwrap } from '@vyke/results'
 *
 * const value = await toUnwrap(Ok(123))
 * //      ^? number
 * await toUnwrap(Err(new Error('some error'))) // throws the error
 * ```
 */
export let toUnwrap = async <TValue>(promise: Promise<TValue>): Promise<TValue> => {
	const data = await to(promise)

	return unwrap(data)
}

/**
 * Awaits for the promise and unwraps it then returns the value or the default one
 * @alias r.toUnwrapOr
 * @example
 * ```ts
 * import { Ok, toUnwrapOr } from '@vyke/results'
 *
 * const value = await toUnwrapOr(Ok(123), 345)
 * //      ^? number
 * await toUnwrapOr(Err(new Error('some error')), 456) // returns 456 instead of throwing
 * ```
 */
export let toUnwrapOr = async <TValue>(
	promise: Promise<TValue>,
	defaultValue: TValue,
): Promise<TValue> => {
	const data = await to(promise)

	return unwrapOr(data, defaultValue)
}

/**
 * Similar to toUnwrap but with a custom error
 * @alias r.toExpect
 * @example
 * ```ts
 * import { Err, Ok, toExpect } from '@vyke/results'
 *
 * const value = await toExpect(Ok(123), 'some error')
 * //     ^? number
 * await toExpect(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
 * ```
 */
export let toExpect = async<TValue, TMessage>(promise: Promise<TValue>, message: TMessage): Promise<TValue> => {
	const result = await to(promise)

	return expect(result, message)
}
