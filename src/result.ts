/**
 * This module contains different variants of the result type and functions to work with results
 * @module
 */

type ResultBase<TValue, TError> = {
	value?: TValue
	error?: TError
}

class OkImpl<TValue> implements ResultBase<TValue, never> {
	constructor(public value: TValue) {}
}

class ErrImpl<TError> extends Error implements ResultBase<never, TError> {
	public origin?: Error

	constructor(public error: TError, message?: string) {
		if (error instanceof Error) {
			super(message ?? error.message)
			this.origin = error
		}
		else {
			super(message ?? String(error))
		}
	}
}

/**
 * Represents a result that can be either a successful result or an error result
 */
export type Result<TValue, TError> = OkImpl<TValue> | ErrImpl<TError>

/**
 * Creates a new successful result with the given value.
 * @alias r.ok
 * @returns A new successful result.
 * @example
 * ```ts
 * import { Ok } from '@vyke/results'
 *
 * const result = Ok(123)
 * //      ^? Result<number, never>
 * ```
 */
export function Ok<TValue>(value: TValue): Result<TValue, never> {
	return new OkImpl(value)
}

/**
 * Creates a new error result with the given error.
 * @alias r.err
 * @returns A new error result.
 * @example
 * ```ts
 * import { Err } from '@vyke/results'
 *
 * const result = Err(new Error('some error'))
 * //      ^? Result<never, Error>
 * ```
 * > [!NOTE]
 * > Error values don't need to be an error, they can be anything.
 */
export function Err<TError>(error: TError, message?: string): Result<never, TError> {
	return new ErrImpl(error, message)
}

/**
 * Checks if the result is a successful result.
 * @alias r.isOk
 * @param result - The result to check.
 * @returns `true` if the result is a successful result, `false` otherwise.
 */
export function isOk<TValue, TError>(result: Result<TValue, TError>): result is OkImpl<TValue> {
	return result instanceof OkImpl
}

/**
 * Checks if the result is an error result.
 * @alias r.isErr
 * @param result - The result to check.
 * @returns `true` if the result is an error result, `false` otherwise.
 */
export function isErr<TValue, TError>(result: Result<TValue, TError>): result is ErrImpl<TError> {
	return result instanceof ErrImpl
}

/**
 * Unwraps the value of a result or throws a custom error.
 * @alias r.expectOk
 * @param result - The result to unwrap.
 * @param message - The custom error message or error object to throw.
 * @returns The value of the result.
 * @throws If the result is an error result or.
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
export function expectOk<TValue, TError>(result: Result<TValue, TError>, message: string): TValue {
	if (isOk(result)) {
		return result.value
	}

	throw Err(result.error, message)
}

/**
 * Unwraps the value of a result or throws an error.
 * @alias r.unwrap
 * @throws If the result is an error result
 * @example
 * ```ts
 * import { Ok, unwrap } from '@vyke/results'
 *
 * const value = unwrap(Ok(123))
 * //      ^? number
 * unwrap(Err(new Error('some error'))) // throws the error
 * ```
 */
export function unwrap<TValue, TError>(result: Result<TValue, TError>): TValue {
	if (isErr(result)) {
		throw result
	}

	return result.value
}

/**
 * Unwraps the value of a result or returns a default value.
 * @alias r.unwrapOr
 * @param result - The result to unwrap.
 * @param defaultValue - The default value to return if the result is not a successful result.
 * @returns The value of the result or the default value.
 * @example
 * ```ts
 * import { Ok, unwrapOr } from '@vyke/results'
 *
 * const value = unwrapOr(Ok(123), 10)
 * //      ^? number
 * unwrapOr(Err(new Error('some error')), 10) // returns 10 instead of the error
 * ```
 */
export function unwrapOr<TValue, TError>(result: Result<TValue, TError>, defaultValue: TValue): TValue {
	if (isOk(result)) {
		return result.value
	}

	return defaultValue
}

/**
 * Maps the value of a result to a new result using the provided mapping function.
 * @alias r.mapInto
 * @example
 * ```ts
 * import { Err, Ok, mapInto } from '@vyke/results'
 * mapInto(Ok(1), (value) => Ok(value + 1)) // Ok(2)
 * mapInto(Err(new Error('some error')), (value) => Ok(value + 1)) // Err(new Error('some error'))
 * ```
 */
export function mapInto<TValue, TError, TNewValue, TNewError>(result: Result<TValue, TError>,
	fn: Mapper<TValue, Result<TNewValue, TNewError>>): Result<TNewValue, TError | TNewError> {
	if (isOk(result)) {
		return fn(result.value)
	}

	return result
}

/**
 * A helper class for chaining map operations on a result.
 */
export class MapHelper<TValue, TError> {
	private result: Result<TValue, TError>

	constructor(result: Result<TValue, TError>) {
		this.result = result
	}

	/**
	 * Maps the value of the result to a new result using the provided mapping function.
	 * @param fn - The mapping function.
	 * @returns A new `MapHelper` instance with the mapped result.
	 */
	into<TNewValue, TNewError>(
		fn: Mapper<TValue, Result<TNewValue, TNewError>>,
	): MapHelper<TNewValue, TError | TNewError> {
		const mappedResult = mapInto(this.result, fn)
		return this.applyTo(mappedResult)
	}

	/**
	 * Apply the mapped result to the current instance.
	 */
	private applyTo<TNewValue, TNewError>(result: Result<TNewValue, TNewError>): MapHelper<TNewValue, TError | TNewError> {
		let mapHelper = this as unknown as MapHelper<TNewValue, TError | TNewError>
		mapHelper.result = result
		return mapHelper
	}

	get(): Result<TValue, TError> {
		return this.result
	}
}

/**
 * A function that maps a value to a result
 */
export type Mapper<TValue, TResult extends Result<any, any>> = (value: TValue) => TResult

/**
 * A helper class for chaining map operations on a result.
 * @alias r.map
 * @example
 * ```ts
 * import { Err, Ok, map } from '@vyke/results'
 *
 * map(Ok(1))
 * 	.into((value) => Ok(value + 1))
 * 	.into((value) => Ok(value + 1))
 * 	.done()
 * ```
 */
export function map<TValue, TError>(result: Result<TValue, TError>): MapHelper<TValue, TError> {
	return new MapHelper(result)
}

type Fn<TValue> = () => TValue

/**
 * Runs a function and captures any errors, converting them to a result.
 * @alias r.capture
 * @returns A result representing the outcome of the function.
 * @example
 * ```ts
 * import { Err, Ok, capture, unwrap } from '@vyke/results'
 *
 * const result1 = capture(() => 123) // only returns value in a return
 * //     ^? Result<number, unknown>
 *
 * const result2 = capture(() => {
 * 	unwrap(Err(new Error('some error')))
 * })
 * ```
 */
export function capture<TValue, TError = unknown>(fn: Fn<TValue>): Result<TValue, TError | unknown> {
	try {
		return Ok(fn())
	}
	catch (error) {
		if (error instanceof ErrImpl) {
			return error
		}
		return Err(error) as Result<TValue, TError | unknown>
	}
}

/**
 * Flattens a nested result.
 * @alias r.flatten
 * @param result - The result to flatten.
 * @returns The flattened result.
 * @example
 * ```ts
 * import { Ok, flatten } from '@vyke/results'
 *
 * const result = flatten(Ok(Ok(123)))
 * //      ^? Result<number, unknown>
 * ```
 */
export function flatten<TValue>(result: Result<Result<TValue, any>, Result<TValue, any>>): Result<TValue, unknown> {
	if (result instanceof OkImpl) {
		return result.value
	}

	return result.error
}

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
export async function to<TValue>(promise: Promise<TValue>): Promise<Result<TValue, unknown>> {
	try {
		const data = await promise

		return Ok(data)
	}
	catch (error) {
		if (error instanceof ErrImpl) {
			return error
		}

		return Err(error)
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
export function andThen<TValue, TError, TNewValue = TValue, TNewError = TError>(result: Result<TValue, TError>,
	fn: Mapper<TValue, Result<TNewValue, TNewError>>): ErrImpl<TError> | Result<TNewValue, TNewError> {
	if (isOk(result)) {
		return fn(result.value)
	}

	return result
}

type NextHandle<TValue, TNextValue, TNextError> = <TError>(result: Result<TValue, TError>) => Promise<Result<TNextValue, TError | TNextError | Error>>
type NextFn<TValue, TNextValue, TNextError> = (value: TValue) => Result<TNextValue, TNextError> | Promise<Result<TNextValue, TNextError>>
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
export function next<TValue, TNextValue, TNextError>(
	nextFn: NextFn<TValue, TNextValue, TNextError>,
	message?: string,
): NextHandle<TValue, TNextValue, TNextError> {
	return async <TError>(result: Result<TValue, TError>) => {
		if (isOk(result)) {
			const nextResult = await nextFn(result.value)

			if (isErr(nextResult)) {
				if (message) {
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
 * import { Err, Ok, toExpectOk } from '@vyke/results'
 *
 * const value = await toExpectOk(Ok(123), 'some error')
 * //     ^? number
 * await toExpectOk(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
 * ```
 */
export async function toExpectOk<TValue>(promise: Promise<Result<TValue, any>>, message: string): Promise<TValue> {
	try {
		const result = await promise
		return expectOk(result, message)
	}
	catch (error) {
		if (error instanceof ErrImpl) {
			throw Err(error.error, message)
		}
		throw Err(error, message)
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
export async function toUnwrap<TValue, TError>(promise: Promise<Result<TValue, TError>>): Promise<TValue> {
	try {
		const data = await promise

		return unwrap(data)
	}
	catch (error) {
		if (error instanceof ErrImpl) {
			throw error
		}

		throw Err(error)
	}
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
export async function toUnwrapOr<TValue, TError>(promise: Promise<Result<TValue, TError>>, defaultValue: TValue): Promise<TValue> {
	try {
		const data = await promise

		return unwrapOr(data, defaultValue)
	}
	catch (error) {
		return defaultValue
	}
}
