/**
 * This module contains functions to work with promises and results
 * @module promise
 */

import { Err, type ErrResult, IsErr, IsOk, Ok, type Result, ResultError, config, expect, unwrap, unwrapOr } from './result'

/**
 * A function that maps a value to a result
 */
export type Mapper<TValue, TResult extends Result<any, any>> = (value: TValue) => TResult

/**
 * Converts a promise to a result
 * @alias r.to
 * @returns A promise that resolves to a Result
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
 * Converts a promise to a result and applies a mapping function
 * @alias r.andThen
 * @param result - The result to apply the mapping function to
 * @param fn - The mapping function
 * @returns The result of applying the mapping function to the input result
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
): ErrResult<TError> | Result<TNewValue, TNewError> => {
	if (IsOk(result)) {
		return fn(result.value)
	}

	return result
}

type NextHandle<TValue, TNextValue, TNextError> = <TError>(result: Result<TValue, TError>) => Promise<Result<TNextValue, TError | TNextError | Error>>

/**
 * Creates a function to be used as a _then_ callback in a promise chain
 * @alias r.next
 * @param nextFn - The function to be executed in the next step of the promise chain
 * @param message - An optional error message to be thrown if the next step returns an error
 * @returns A function that can be used as a _then_ callback
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
): NextHandle<TValue, TNextValue, TNextError> => {
	return async <TError>(result: Result<TValue, TError>) => {
		if (IsOk(result)) {
			const nextResult = await nextFn(result.value)

			if (IsErr(nextResult)) {
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
 * Converts a promise to a result and throws an error with a custom message if the result is an error
 * @alias r.toExpect
 * @param promise - The promise to convert
 * @param message - The error message to throw if the result is an error
 * @returns A promise that resolves to the value of the promise
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

/**
 * Converts a promise to a result and captures any errors thrown during the process
 * @alias r.toCapture
 * @param promise - The promise to convert
 * @returns A promise that resolves to a Result
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
 * @deprecated will be removed in the next major version
 */
export let toCapture = async <TValue, TError = unknown>(promise: Promise<Result<TValue, TError>>): Promise<Result<TValue, TError>> => {
	try {
		const result = await promise

		return result
	}
	catch (error) {
		if (error instanceof ResultError) {
			return error
		}

		return Err(error) as Result<TValue, TError>
	}
}

/**
 * Awaits for the promise and unwraps it then returns the value or throws the error
 * @alias r.toUnwrap
 * @param promise - The promise to unwrap
 * @returns A promise that resolves to the value of the promise
 * @example
 * ```ts
 * import { Ok, toUnwrap } from '@vyke/results'
 *
 * const value = await toUnwrap(Ok(123))
 * //      ^? number
 * await toUnwrap(Err(new Error('some error'))) // throws the error
 * ```
 */
export let toUnwrap = async <TValue, TError>(promise: Promise<Result<TValue, TError>>): Promise<TValue> => {
	const data = await toCapture(promise)

	return unwrap(data)
}

/**
 * Awaits for the promise, unwraps it, and then returns the value or the default one
 * @alias r.toUnwrapOr
 * @param promise - The promise to unwrap
 * @param defaultValue - The default value to return if the promise is an error
 * @returns A promise that resolves to the value of the promise or the default value
 * @example
 * ```ts
 * import { Ok, toUnwrapOr } from '@vyke/results'
 *
 * const value = await toUnwrapOr(Ok(123), 345)
 * //      ^? number
 * await toUnwrapOr(Err(new Error('some error')), 456) // returns 456 instead of throwing
 * ```
 */
export let toUnwrapOr = async <TValue, TError>(
	promise: Promise<Result<TValue, TError>>,
	defaultValue: TValue,
): Promise<TValue> => {
	const data = await toCapture(promise)

	return unwrapOr(data, defaultValue)
}
