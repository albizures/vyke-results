/**
 * This module contains different variants of the result type and functions to work with results
 * @module
 */

/**
 * Represents the status of a result.
 */
export type ResultStatus = Result<unknown, unknown>['status']

/**
 * Represents a successful result with a value.
 */
export type OkResult<TValue> = {
	status: 'success'
	value: TValue
}

/**
 * Represents an error result with an error value.
 */
export type ErrResult<TError> = {
	status: 'error'
	value: TError
}

/**
 * Represents a pending result.
 */
export type PendingResult = {
	status: 'pending'
}

/**
 * Represents an empty result.
 */
export type EmptyResult = {
	status: 'empty'
}

/**
 * Represents a result that can be either a successful result, an error result, a pending result, or an empty result.
 */
export type Result<TValue, TError> = OkResult<TValue> | ErrResult<TError> | PendingResult | EmptyResult

/**
 * Checks if the given value is a result.
 * @alias r.isResult
 * @returns `true` if the value is a result, `false` otherwise.
 */
export let IsResult = (result: unknown): result is Result<unknown, unknown> => {
	return Boolean(result && typeof result === 'object' && 'status' in result && 'value' in result)
}

/**
 * Checks if the result is a successful result.
 * @alias r.isOk
 * @param result - The result to check.
 * @returns `true` if the result is a successful result, `false` otherwise.
 */
export let IsOk = <TValue, TError>(result: Result<TValue, TError>): result is OkResult<TValue> => {
	return result.status === 'success'
}

/**
 * Checks if the result is an error result.
 * @alias r.isErr
 * @param result - The result to check.
 * @returns `true` if the result is an error result, `false` otherwise.
 */
export let IsErr = <TValue, TError>(result: Result<TValue, TError>): result is ErrResult<TError> => {
	return result.status === 'error'
}

/**
 * Checks if the result is an empty result.
 * @alias r.isEmpty
 * @returns `true` if the result is an empty result, `false` otherwise.
 */
export let IsEmpty = <TValue, TError>(result: Result<TValue, TError>): result is EmptyResult => {
	return result.status === 'empty'
}

/**
 * Checks if the result is a pending result.
 * @alias r.isPending
 * @returns `true` if the result is a pending result, `false` otherwise.
 */
export let IsPending = <TValue, TError>(result: Result<TValue, TError>): result is PendingResult => {
	return result.status === 'pending'
}

/**
 * Configuration options for the result module.
 */
export let config = {
	verbose: false,
}

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
export let Ok = <TValue>(value: TValue): Result<TValue, never> => {
	return {
		value,
		status: 'success',
	}
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
export let Err = <TError>(error: TError): Result<never, TError> => {
	return {
		value: error,
		status: 'error',
	}
}

/**
 * Creates a new empty result.
 * @alias r.empty
 * @returns A new empty result.
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
 * Creates a new pending result.
 * @alias r.pending
 * @returns A new pending result.
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

/**
 * Represents an error result with an error value.
 */
export class ResultError<TError = unknown> extends Error implements ErrResult<TError> {
	status: 'error' = 'error' as const
	value: TError
	constructor(message: string, value: TError) {
		super(message)
		this.value = value
	}
}

/**
 * Unwraps the value of a result or throws an error.
 * @alias r.unwrap
 * @throws If the result is an error result or a pending or empty result.
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
 * Unwraps the value of a result or throws a custom error.
 * @alias r.expect
 * @param result - The result to unwrap.
 * @param message - The custom error message or error object to throw.
 * @returns The value of the result.
 * @throws If the result is an error result or a pending or empty result.
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

type Fn<TValue> = () => TValue

/**
 * Runs a function and captures any errors, converting them to a result if needed.
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
export let capture = <TValue, TError = unknown>(fn: Fn<TValue>): Result<TValue, TError | unknown> => {
	try {
		return Ok(fn())
	}
	catch (error) {
		if (error instanceof ResultError) {
			return error
		}
		return Err(error)
	}
}

/**
 * Converts a pending result, or empty result to an error result with the specified error value.
 * @alias r.intoErr
 * @returns An error result with the specified error value.
 * @example
 * ```ts
 * import { Empty, Err, Pending, intoErr } from '@vyke/results'
 * intoErr(Err('my error'), 'another error') // ErrResult<'my error'>
 * intoErr(Pending(), 'error cus empty') // ErrResult<'error cus empty'>
 * intoErr(Empty, 'another cus pending') // ErrResult<'another cus pending'>
 * ```
 * > [!NOTE]
 * > This function does nothing if the result is already an error result.
 * > And it's not meant to convert a successful result to an error result.
 */
export let intoErr = <TError>(result: ErrResult<TError> | PendingResult | EmptyResult, error: TError): Result<never, TError> => {
	if (IsErr(result)) {
		return result
	}

	return Err(error)
}
