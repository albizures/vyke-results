import { describe, expect, it, vi } from 'vitest'
import { r } from './r'

r.config.verbose = false

it('should return an ok result', () => {
	expect(r.ok('123')).toEqual({ value: '123', ok: true })
})

it('should return an err result ', () => {
	expect(r.err('345')).toEqual({ value: '345', ok: false })
})

describe('unwrap', () => {
	it('should throw the error', () => {
		const result = r.err(new Error('some error'))

		expect(() => r.unwrap(result)).toThrowError('some error')
	})

	it('should unwrap the value', () => {
		const result = r.ok('123')

		expect(r.unwrap(result)).toBe('123')
	})
})

describe('unwrapOr', () => {
	it('should unwrap the value', () => {
		const result = r.ok('123')

		expect(r.unwrapOr(result, '345')).toBe('123')
	})
	it('should return default value', () => {
		const result = r.err('123')

		expect(r.unwrapOr(result, '345')).toBe('345')
	})
})

describe('expect', () => {
	it('should throw the error', () => {
		const result = r.err(new Error('some error'))

		expect(() => r.expect(result, 'another error')).toThrowError('another error')
	})

	it('should unwrap the value', () => {
		const result = r.ok('123')

		expect(r.expect(result, 'another error')).toBe('123')
	})
})

describe('andThen', () => {
	it('should call only when the result is ok', () => {
		const okResult = r.ok('123')

		const toInt = vi.fn((value) => {
			return r.ok(Number(value))
		})

		const nextOkResult = r.andThen(okResult, toInt)

		expect(toInt).toHaveBeenCalledOnce()
		expect(toInt).toHaveBeenCalledWith('123')
		expect(nextOkResult.value).toBe(123)

		const errResult = r.err(new Error('invalid'))

		toInt.mockReset()

		const nextErrorResult = r.andThen(errResult, toInt)

		expect(toInt).not.toHaveBeenCalledOnce()
		expect(nextErrorResult.value).toMatchObject({ message: 'invalid' })
	})
})

describe('to', () => {
	it('should convert to a result', async () => {
		const result = await r.to(Promise.resolve(1))

		expect(result.value).toBe(1)
	})
})

describe('next', () => {
	it('should run the next function only if it is ok', async () => {
		const addOne = vi.fn((value: number) => {
			return r.ok(value + 1)
		})

		const toString = vi.fn((value: number) => {
			return r.ok(String(value))
		})

		const result = await Promise.resolve(r.ok(1))
			.then(r.next(addOne))
			.then(r.next(toString))

		expect(result.value).toBe('2')
	})

	it('should not run any next function if it is an error', async () => {
		const addOne = vi.fn((value: number) => {
			return r.ok(value + 1)
		})

		const toString = vi.fn((value: number) => {
			return r.ok(String(value))
		})

		const result = await Promise.resolve(r.err(new Error('some error')))
			.then(r.next(addOne))
			.then(r.next(toString))

		expect(result.value).toMatchObject({
			message: 'some error',
		})
		expect(addOne).not.toHaveBeenCalled()
		expect(toString).not.toHaveBeenCalled()
	})

	describe('when one of the next functions returns an error', () => {
		it('should not run any other  next function', async () => {
			class MyError extends Error {
				constructor(message: string) {
					super(message)
				}
			}
			const addOne = vi.fn((_value: number) => {
				return r.err(new MyError('unable to add one'))
			})

			const toString = vi.fn((value: number) => {
				return Promise.resolve(r.ok(String(value)))
			})

			const result = await Promise.resolve(r.ok(1))
				.then(r.next(addOne, 'custom error'))
				.then(r.next(toString))

			expect(result.value).toMatchObject({
				message: 'custom error',
			})
			expect(addOne).toHaveBeenCalled()
			expect(toString).not.toHaveBeenCalled()
		})
	})
})

describe('toUnwrap', () => {
	it('should throw the error', () => {
		const promise = Promise.reject(new Error('some error'))

		expect(async () => {
			await r.toUnwrap(promise)
		}).rejects.toThrow('some error')
	})

	it('should unwrap the value', async () => {
		const promise = Promise.resolve('123')

		const value = await r.toUnwrap(promise)

		expect(value).toMatchObject('123')
	})
})

describe('toUnwrapOr', () => {
	it('should return the default value', async () => {
		const promise = Promise.reject(new Error('some error'))

		const value = await r.toUnwrapOr(promise, 'default')
		expect(value).toBe('default')
	})

	it('should unwrap the value', async () => {
		const promise = Promise.resolve('123')

		const value = await r.toUnwrapOr(promise, 'default')

		expect(value).toBe('123')
	})
})

describe('toExpect', () => {
	it('should throw the error', () => {
		const promise = Promise.reject(new Error('some error'))

		expect(async () => {
			await r.toExpect(promise, 'another error')
		}).rejects.toThrow('another error')
	})

	it('should unwrap the value', async () => {
		const promise = Promise.resolve('123')

		const value = await r.toExpect(promise, 'default')

		expect(value).toMatchObject('123')
	})
})
