import { assertType, describe, expect, it, vi } from 'vitest'
import { type Result, r } from './r'

it('should be compatible with option type', () => {
	const result1 = r.Ok(123)
	const result2 = r.Err('error')

	assertType<Result<number, unknown>>(result1)
	assertType<Result<unknown, string>>(result2)
})

it('should return an ok result', () => {
	const result = r.Ok('123')
	expect(r.isOk(result) && result.value).toEqual('123')
})

it('should return an err result ', () => {
	const result = r.Err('345')
	expect(r.isErr(result) && result.error).toEqual('345')
})

describe('isOk', () => {
	it('should return true when given a some option', () => {
		const option = r.Ok(123)

		expect(r.isOk(option)).toBe(true)
	})
})

describe('isErr', () => {
	it('should return true when given a none option', () => {
		const option = r.Err('error')

		expect(r.isErr(option)).toBe(true)
	})
})

describe('unwrap', () => {
	it('should throw the error', () => {
		const result = r.Err(new Error('some error'))

		expect(() => r.unwrap(result)).toThrowError('some error')
	})

	it('should unwrap the value', () => {
		const result = r.Ok('123')

		expect(r.unwrap(result)).toBe('123')
	})
})

describe('unwrapOr', () => {
	it('should unwrap the value', () => {
		const result = r.Ok('123')

		expect(r.unwrapOr(result, '345')).toBe('123')
	})
	it('should return default value', () => {
		const result: Result<Array<string>, Error> = r.Err(new Error('error'))
		const defaultValue = r.unwrapOr(result, [])

		assertType<Array<string>>(defaultValue)
		expect(defaultValue).toEqual([])

		const result2: Result<number, Error> = r.Err(new Error('error'))
		const defaultValue2 = r.unwrapOr(result2, 0)

		assertType<number>(defaultValue2)
		expect(defaultValue2).toBe(0)
	})

	describe('when the result is an error', () => {
		it('should return the default value', () => {
			const result = r.Err(new Error('some error'))

			expect(r.unwrapOr(result, '345')).toBe('345')
		})

		describe('when an onError function is provided', () => {
			it('should call the onError function', () => {
				const error = new Error('some error')
				const result = r.Err(error)

				const onError = vi.fn()

				const value = r.unwrapOr(result, 'default', onError)

				expect(value).toBe('default')
				expect(onError).toHaveBeenCalledOnce()
				expect(onError).toHaveBeenCalledWith(error)
			})
		})
	})
})

describe('expect', () => {
	it('should throw the error', () => {
		const result = r.Err(new Error('some error'))

		expect(() => r.expectOk(result, 'another error')).toThrowError('another error')
	})

	it('should unwrap the value', () => {
		const result = r.Ok('123')

		expect(r.expectOk(result, 'another error')).toBe('123')
	})
})

describe('andThen', () => {
	it('should call only when the result is ok', () => {
		const okResult = r.Ok('123')

		const toInt = vi.fn((value) => {
			return r.Ok(Number(value))
		})

		const nextOkResult = r.andThen(okResult, toInt)

		expect(toInt).toHaveBeenCalledOnce()
		expect(toInt).toHaveBeenCalledWith('123')
		expect(r.isOk(nextOkResult) && nextOkResult.value).toBe(123)

		const errResult = r.Err(new Error('invalid'))

		toInt.mockReset()

		const nextErrorResult = r.andThen(errResult, toInt)

		expect(toInt).not.toHaveBeenCalledOnce()
		expect(r.isErr(nextErrorResult) && nextErrorResult.error).toMatchObject({ message: 'invalid' })
	})
})

describe('to', () => {
	it('should convert to a result', async () => {
		const result = await r.to(Promise.resolve(1))

		expect(r.isOk(result) && result.value).toBe(1)
	})
})

describe('next', () => {
	it('should run the next function only if it is ok', async () => {
		const addOne = vi.fn((value: number) => {
			return r.Ok(value + 1)
		})

		const toString = vi.fn((value: number) => {
			return r.Ok(String(value))
		})

		const result = await Promise.resolve(r.Ok(1))
			.then(r.next(addOne))
			.then(r.next(toString))

		expect(r.isOk(result) && result.value).toBe('2')
	})

	it('should not run any next function if it is an error', async () => {
		const addOne = vi.fn((value: number) => {
			return r.Ok(value + 1)
		})

		const toString = vi.fn((value: number) => {
			return r.Ok(String(value))
		})

		const result = await Promise.resolve(r.Err(new Error('some error')))
			.then(r.next(addOne))
			.then(r.next(toString))

		expect(r.isErr(result) && result.error).toMatchObject({
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
				return r.Err(new MyError('unable to add one'))
			})

			const toString = vi.fn((value: number) => {
				return Promise.resolve(r.Ok(String(value)))
			})

			const result = await Promise.resolve(r.Ok(1))
				.then(r.next(addOne, 'custom error'))
				// .then(r.next(toString))

			expect(r.isErr(result) && result.error).toMatchObject({
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
		const promise = Promise.resolve(r.Ok('123'))

		const value = await r.toUnwrap(promise)

		expect(value).toMatchObject('123')
	})
})

describe('toUnwrapOr', () => {
	it('should return the default value', async () => {
		const promise1: Promise<Result<string, Error>> = Promise.reject(new Error('some error'))
		const value1 = await r.toUnwrapOr(promise1, 'default')

		assertType<string>(value1)
		expect(value1).toBe('default')

		const promise2: Promise<Result<Array<number>, Error>> = Promise.reject(new Error('some error'))
		const value2 = await r.toUnwrapOr(promise2, [])

		assertType<Array<number>>(value2)
		expect(value2).toEqual(value2)
	})

	it('should unwrap the value', async () => {
		const promise = Promise.resolve(r.Ok('123'))

		const value = await r.toUnwrapOr(promise, 'default')

		expect(value).toBe('123')
	})

	describe('when the promise is rejected with an error', () => {
		it('should return the default value', async () => {
			const promise = Promise.reject(new Error('some error'))

			const value = await r.toUnwrapOr(promise, 'default')

			expect(value).toBe('default')
		})

		describe('when an onError function is provided', () => {
			it('should call the onError function', async () => {
				const error = new Error('some error')
				const promise = Promise.reject(error)

				const onError = vi.fn()

				const value = await r.toUnwrapOr(promise, 'default', onError)

				expect(value).toBe('default')
				expect(onError).toHaveBeenCalledOnce()
				expect(onError).toHaveBeenCalledWith(error)
			})
		})
	})
})

describe('toExpect', () => {
	it('should throw the error', () => {
		const promise = Promise.reject(new Error('some error'))

		expect(async () => {
			await r.toExpectOk(promise, 'another error')
		}).rejects.toThrow('another error')
	})

	it('should unwrap the value', async () => {
		const promise = Promise.resolve(r.Ok('123'))

		const value = await r.toExpectOk(promise, 'default')

		expect(value).toMatchObject('123')
	})
})

describe('capture', () => {
	it('should convert the into a result', () => {
		function fn() {
			return '123'
		}

		const result = r.capture(fn)

		expect(result).toEqual({ value: '123' })
	})
	it('should capture/catch the error', () => {
		function fnWithError() {
			throw new Error('some error')
		}

		const result = r.capture(fnWithError)

		expect(r.isErr(result) && result.error).toMatchObject({ message: 'some error' })
	})
})

describe('mapInto', () => {
	it('should map the value', () => {
		const result = r.Ok('123')

		const mappedResult = r.mapInto(result, (value) => r.Ok(Number(value)))

		expect(r.isOk(mappedResult) && mappedResult.value).toBe(123)
	})

	it('should not map the error', () => {
		const result = r.Err(new Error('some error'))

		const mappedResult = r.mapInto(result, (value) => r.Ok(Number(value)))

		expect(r.isErr(mappedResult) && mappedResult.error).toMatchObject({
			message: 'some error',
		})
	})
})

describe('map', () => {
	it('should map the value', () => {
		const result = r.map(r.Ok(1))
			.into((value) => r.Ok(value + 1))
			.into((value) => r.Ok(value + 1))
			.get()

		expect(r.isOk(result) && result.value).toBe(3)
	})

	describe('when one of the into functions doesn\'t return a successful result', () => {
		it('should not map the error', () => {
			const errorResult = r.map(r.Err(new Error('some error')))
				.into((value) => r.Ok(Number(value)))
				.into((value) => r.Ok(value + 1))
				.get()

			expect(r.isErr(errorResult) && errorResult.error).toMatchObject({
				message: 'some error',
			})
		})
	})
})
