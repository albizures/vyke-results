import { Err } from './result'

export abstract class OptionBase<TValue> {
	constructor(public value?: TValue) {}
}

class SomeImpl<TValue> extends OptionBase<TValue> {
	constructor(public value: TValue) {
		super(value)
	}
}

class NoneImpl extends OptionBase<never> {
	constructor() {
		super()
	}
}

export type Option<TValue> = SomeImpl<TValue> | NoneImpl

/**
 * Creates a new Some option.
 * @alias o.Some
 */
export function Some<T>(value: T): Option<T> {
	return new SomeImpl(value)
}

const none = new NoneImpl()

/**
 * Creates a new None option.
 */
export function None(): Option<never> {
	return none
}

/**
 * Checks if an option is a Some option.
 * @alias o.isSome
 * @example
 * ```ts
 * import { None, Some, isSome } from '@vyke/results/option'
 *
 * isSome(Some(123)) // true
 * isSome(None()) // false
 * const option = Some(123)
 * if (isSome(option)) {
 * 	console.log(option.value) // safe to access value
 * }
 * ```
 */
export function isSome<TValue>(option: Option<TValue>): option is SomeImpl<TValue> {
	return option instanceof SomeImpl
}

/**
 * Checks if an option is a None option.
 * @alias o.isNone
 * @example
 * ```ts
 * import { None, Some, isNone } from '@vyke/results/option'
 *
 * isNone(Some(123)) // false
 * isNone(None()) // true
 * ```
 */
export function isNone<TValue>(option: Option<TValue>): option is NoneImpl {
	return option instanceof NoneImpl
}

/**
 * Unwraps the value of an option or throws an error.
 * @alias o.unwrap
 * @param option - The option to unwrap.
 * @throws If the option is none
 * @example
 * ```ts
 * import { None, Some, unwrap } from '@vyke/results/option'
 *
 * const value = unwrap(Some(123))
 * //      ^? number 123
 * unwrap(None()) // throws an Error Result
 * ```
 */
export function unwrap<TValue>(option: Option<TValue>): TValue {
	if (isSome(option)) {
		return option.value
	}

	throw Err('Tried to unwrap a None option')
}

/**
 * Unwraps the value of a result or returns a default value.
 * @alias o.unwrapOr
 * @param option - The option to unwrap.
 * @param defaultValue - The default value to return if the result is not a successful result.
 * @returns The value of the result or the default value.
 * @example
 * ```ts
 * import { None, Some, unwrapOr } from '@vyke/results/option'
 *
 * const value = unwrapOr(Some(123), 10)
 * //      ^? number
 * unwrapOr(None(), 10) // returns 10 instead of throwing an error
 * ```
 */
export function unwrapOr<TValue>(option: Option<TValue>, defaultValue: TValue): TValue {
	if (isSome(option)) {
		return option.value
	}

	return defaultValue
}

export function expectSome<TValue>(option: Option<TValue>): TValue {
	if (isSome(option)) {
		return option.value
	}

	throw Err('Expected a Some option')
}
