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
 * Unwraps the result return the value or throwing the error
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
 * Similar to unwraps but with a custom error
 * @alias r.expect
 * @example
 * ```ts
 * import { Err, Ok, expect } from '@vyke/results'
 *
 * const value = expect(Ok(123), 'some error')
 * //     ^? number
 *
 * expect(Err(new Error('some error')), 'another error') // throws the error with the mssage `another error`
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
 * Unwraps the promise result return the value or throwing the error
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
export let toUnwrap = async <TValue, TError = unknown>(promise: Promise<Result<TValue, TError>>): Promise<TValue> => {
	const data = await promise

	return unwrap(data)
}

/**
 * Similar to toUnwrap but with a custom error
 * @alias r.toExpect
 * @example
 * ```ts
 * import { Err, Ok, toExpect } from '@vyke/results'
 *
 * const value = toExpect(Ok(123), 'some error')
 * //     ^? number
 * toExpect(Err(new Error('some error')), 'another error') // throws the error with the mssage `another error`
 * ```
 */
export let toExpect = async<TValue, TError, TMessage>(promise: Promise<Result<TValue, TError>>, message: TMessage): Promise<TValue> => {
	const result = await promise

	return expect(result, message)
}
