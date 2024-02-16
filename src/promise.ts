import { Err, Ok, type Result, ResultError, config, expect, unwrap, unwrapOr } from './result'

export type Mapper<TValue, TResult extends Result<any, any>> = (value: TValue) => TResult

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
 * Similar to andThen, but to create a function to be used as a _then_ callback
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
export let toUnwrap = async <TValue>(promise: Promise<TValue>) => {
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
export let toUnwrapOr = async <TValue, TDefault>(
	promise: Promise<TValue>,
	defaultValue: NonNullable<TDefault>,
) => {
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
export let toExpect = async<TValue, TMessage>(promise: Promise<TValue>, message: TMessage) => {
	const result = await to(promise)

	return expect(result, message)
}

/**
 * Similar to capture but for promises
 * @alias r.toCapture
 * @example
 * ```ts
 * import { Ok, toCapture, unwrap } from '@vyke/results'
 *
 * const result1 = await toCapture(Promise.resolve(Ok(123))) // only returns the result
 * //     ^? Result<number, unknown>
 * const result2 = await toCapture(async () => {
 * //     ^? Result<unknown, unknown>
 * 	unwrap(Err(new Error('some error')))
 * }) // will return the error thrown by unwrap
 * ```
 */
export let toCapture = async <TValue, TError = unknown>(promise: Promise<Result<TValue, TError>>): Promise<Result<TValue, TError | Error>> => {
	try {
		const result = await promise

		return result
	}
	catch (error) {
		if (error instanceof ResultError) {
			return error
		}

		return Err(error) as Result<TValue, TError | Error>
	}
}
