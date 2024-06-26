import { assertType, describe, expect, it } from 'vitest'
import { type Option, o } from './o'
import { type Result, isErr } from './result'

it('should be compatible with option type', () => {
	const option1 = o.Some(123)
	const option2 = o.None()

	assertType<Option<number>>(option1)
	assertType<Option<unknown>>(option2)
})

describe('isSome', () => {
	it('should return true when given a some option', () => {
		const option = o.Some(123)

		expect(o.isSome(option)).toBe(true)
	})
})

describe('isNone', () => {
	it('should return true when given a none option', () => {
		const option = o.None()

		expect(o.isNone(option)).toBe(true)
	})
})

describe('unwrap', () => {
	it('should throw an error', () => {
		const option = o.None()

		expect(() => o.unwrap(option)).toThrowError('Tried to unwrap a None option')
		expect(isErr((() => {
			try {
				o.unwrap(option)
			}
			catch (error) {
				return error
			}
		})() as Result<unknown, string>)).toBe(true)
	})

	it('should unwrap the value', () => {
		const option = o.Some('123')

		expect(o.unwrap(option)).toBe('123')
	})
})
