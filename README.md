<div align="center">
	<h1>
		@vyke/results
	</h1>
</div>
Functional and small implementation of Rust _*Result*_ type with some goodies to work with TypeScript inspired by ts-results with its own take. It simplifies error handling and enhances the management of asynchronous functions, offering a clean and efficient approach.

## Installation
```sh
npm i @vyke/results
```

## Examples
```ts
import * as fs from 'node:fs'
import { r } from '@vyke/results/r'

function readFile(filename: string) {
	try {
		return r.ok(fs.readFileSync(filename))
	}
	catch (error) {
		return r.err(new Error('error reading file'))
	}
}

const result = readFile('test.txt')
if (r.isOk(result)) {
	console.log(result.value) // the files content
}
else {
	console.error(result.value) // value is the error here
}
```
Using promises

```ts
import * as fs from 'node:fs/promises'
import { r } from '@vyke/results/r'

async function readFile(filename: string) {
	const result = await r.to(fs.readFile(filename))

	if (r.isErr(result)) {
		return r.err(new Error('error reading file'))
	}

	return result
}

const result = await readFile('test.txt')
if (r.isOk(result)) {
	console.log(result.value) // the files content
}
else if (r.isErr(result)) {
	console.error(result.value) // value is the error here
}
```

## API
### IsResult
Checks if the given value is a result.
> [!TIP]
> alias of `r.isResult`

### IsOk
Checks if the result is a successful result.
> [!TIP]
> alias of `r.isOk`

### IsErr
Checks if the result is an error result.
> [!TIP]
> alias of `r.isErr`

### IsEmpty
Checks if the result is an empty result.
> [!TIP]
> alias of `r.isEmpty`

### IsPending
Checks if the result is a pending result.
> [!TIP]
> alias of `r.isPending`

### config
Configuration options for the result module.

### Ok
Creates a new successful result with the given value.
> [!TIP]
> alias of `r.ok`
```ts
import { Ok } from '@vyke/results'

const result = Ok(123)
//      ^? Result<number, never>
```

### Err
Creates a new error result with the given error.
> [!TIP]
> alias of `r.err`
```ts
import { Err } from '@vyke/results'

const result = Err(new Error('some error'))
//      ^? Result<never, Error>
```
> [!NOTE]
> Error values don't need to be an error, they can be anything.

### Empty
Creates a new empty result.
> [!TIP]
> alias of `r.empty`
```ts
import { Empty, IsEmpty } from '@vyke/results'

const result = Empty()

if (IsEmpty(result)) {
	console.log('The result is empty')
}

result.value // not available
```

### Pending
Creates a new pending result.
> [!TIP]
> alias of `r.pending`
```ts
import { IsPending, Pending } from '@vyke/results'

const result = Pending()

if (Pending(result)) {
	console.log('The result is pending')
}

result.value // not available
```

### ResultError
Represents an error result with an error value.

### unwrap
Unwraps the value of a result or throws an error.
> [!TIP]
> alias of `r.unwrap`
```ts
import { Ok, unwrap } from '@vyke/results'

const value = unwrap(Ok(123))
//      ^? number
unwrap(Err(new Error('some error'))) // throws the error
```

### unwrapOr
Unwraps the value of a result or returns a default value.
> [!TIP]
> alias of `r.unwrapOr`
```ts
import { Ok, unwrapOr } from '@vyke/results'

const value = unwrapOr(Ok(123), 10)
//      ^? number
unwrapOr(Err(new Error('some error')), 10) // returns 10 instead of the error
```

### expect
Unwraps the value of a result or throws a custom error.
> [!TIP]
> alias of `r.expect`
```ts
import { Err, Ok, expect } from '@vyke/results'

const value = expect(Ok(123), 'some error')
//     ^? number

expect(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
```

### capture
Runs a function and captures any errors, converting them to a result if needed.
> [!TIP]
> alias of `r.capture`
```ts
import { Err, Ok, capture, unwrap } from '@vyke/results'

const result1 = capture(() => 123) // only returns value in a return
//     ^? Result<number, unknown>

const result2 = capture(() => {
	unwrap(Err(new Error('some error')))
})
```

### intoErr
Converts a pending result, or empty result to an error result with the specified error value.
> [!TIP]
> alias of `r.intoErr`
```ts
import { Empty, Err, Pending, intoErr } from '@vyke/results'
intoErr(Err('my error'), 'another error') // ErrResult<'my error'>
intoErr(Pending(), 'error cus empty') // ErrResult<'error cus empty'>
intoErr(Empty, 'another cus pending') // ErrResult<'another cus pending'>
```
> [!NOTE]
> This function does nothing if the result is already an error result.
> And it's not meant to convert a successful result to an error result.

### to
Converts a promise to a result
> [!TIP]
> alias of `r.to`
```ts
import { to } from '@vyke/results'

const result = await to(Promise.resolve(123))
//     ^? Result<number, unknown>
```
> [!CAUTION]
> Notice that Result error type is unknown

### andThen
Converts a promise to a result and applies a mapping function
> [!TIP]
> alias of `r.andThen`
```ts
import { Ok, andThen } from '@vyke/results'

const result = andThen(Ok(123), (value) => Ok(String(value)))
//      ^? Result<number, never>
```

### next
Creates a function to be used as a _then_ callback in a promise chain
> [!TIP]
> alias of `r.next`
```ts
import { next, to } from '@vyke/results'

const result = await Promise.resolve(Ok(123))
//     ^? Result<string, never>
	.then(next((value) => Ok(String(value))))
```

### toExpect
Converts a promise to a result and throws an error with a custom message if the result is an error
> [!TIP]
> alias of `r.toExpect`
```ts
import { Err, Ok, toExpect } from '@vyke/results'

const value = await toExpect(Ok(123), 'some error')
//     ^? number
await toExpect(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
```

### toCapture
Converts a promise to a result and captures any errors thrown during the process
> [!TIP]
> alias of `r.toCapture`
```ts
import { Ok, toCapture, unwrap } from '@vyke/results'

const result1 = await toCapture(Promise.resolve(Ok(123))) // only returns the result
//     ^? Result<number, unknown>
const result2 = await toCapture(async () => {
//     ^? Result<unknown, unknown>
	unwrap(Err(new Error('some error')))
}) // will return the error thrown by unwrap
```

### toUnwrap
Awaits for the promise and unwraps it then returns the value or throws the error
> [!TIP]
> alias of `r.toUnwrap`
```ts
import { Ok, toUnwrap } from '@vyke/results'

const value = await toUnwrap(Ok(123))
//      ^? number
await toUnwrap(Err(new Error('some error'))) // throws the error
```

### toUnwrapOr
Awaits for the promise, unwraps it, and then returns the value or the default one
> [!TIP]
> alias of `r.toUnwrapOr`
```ts
import { Ok, toUnwrapOr } from '@vyke/results'

const value = await toUnwrapOr(Ok(123), 345)
//      ^? number
await toUnwrapOr(Err(new Error('some error')), 456) // returns 456 instead of throwing
```

## Others vyke projects
- [Flowmodoro app by vyke](https://github.com/albizures/vyke-flowmodoro)
- [@vyke/tsdocs](https://github.com/albizures/vyke-tsdocs)
- [@vyke/val](https://github.com/albizures/vyke-val)
- [@vyke/dom](https://github.com/albizures/vyke-dom)
