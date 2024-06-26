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
### Ok
Creates a new successful result with the given value.
> [!TIP]
> alias of `r.ok`
```ts
import { Ok } from '@vyke/results/result'

const result = Ok(123)
//      ^? Result<number, never>
```

### Err
Creates a new error result with the given error.
> [!TIP]
> alias of `r.err`
```ts
import { Err } from '@vyke/results/result'

const result = Err(new Error('some error'))
//      ^? Result<never, Error>
```
> [!NOTE]
> Error values don't need to be an error, they can be anything.

### isOk
Checks if the result is a successful result.
> [!TIP]
> alias of `r.isOk`

### isErr
Checks if the result is an error result.
> [!TIP]
> alias of `r.isErr`

### expectOk
Unwraps the value of a result or throws a custom error.
> [!TIP]
> alias of `r.expectOk`
```ts
import { Err, Ok, expect } from '@vyke/results/result'

const value = expect(Ok(123), 'some error')
//     ^? number

expect(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
```

### unwrap
Unwraps the value of a result or throws an error.
> [!TIP]
> alias of `r.unwrap`
```ts
import { Ok, unwrap } from '@vyke/results/result'

const value = unwrap(Ok(123))
//      ^? number
unwrap(Err(new Error('some error'))) // throws the error
```

### unwrapOr
Unwraps the value of a result or returns a default value.
> [!TIP]
> alias of `r.unwrapOr`
```ts
import { Ok, unwrapOr } from '@vyke/results/result'

const value = unwrapOr(Ok(123), 10)
//      ^? number
unwrapOr(Err(new Error('some error')), 10) // returns 10 instead of the error
```

### mapInto
Maps the value of a result to a new result using the provided mapping function.
> [!TIP]
> alias of `r.mapInto`
```ts
import { Err, Ok, mapInto } from '@vyke/results/result'
mapInto(Ok(1), (value) => Ok(value + 1)) // Ok(2)
mapInto(Err(new Error('some error')), (value) => Ok(value + 1)) // Err(new Error('some error'))
```

### MapHelper
A helper class for chaining map operations on a result.

### map
A helper class for chaining map operations on a result.
> [!TIP]
> alias of `r.map`
```ts
import { Err, Ok, map } from '@vyke/results/result'

map(Ok(1))
	.into((value) => Ok(value + 1))
	.into((value) => Ok(value + 1))
	.done()
```

### capture
Runs a function and captures any errors, converting them to a result.
> [!TIP]
> alias of `r.capture`
```ts
import { Err, Ok, capture, unwrap } from '@vyke/results/result'

const result1 = capture(() => 123) // only returns value in a return
//     ^? Result<number, unknown>

const result2 = capture(() => {
	unwrap(Err(new Error('some error')))
})
```

### flatten
Flattens a nested result.
> [!TIP]
> alias of `r.flatten`
```ts
import { Ok, flatten } from '@vyke/results/result'

const result = flatten(Ok(Ok(123)))
//      ^? Result<number, unknown>
```

### to
Converts a promise to a result
> [!TIP]
> alias of `r.to`
```ts
import { to } from '@vyke/results/result'

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
import { Ok, andThen } from '@vyke/results/result'

const result = andThen(Ok(123), (value) => Ok(String(value)))
//      ^? Result<number, never>
```

### next
Creates a function to be used as a _then_ callback in a promise chain
> [!TIP]
> alias of `r.next`
```ts
import { next, to } from '@vyke/results/result'

const result = await Promise.resolve(Ok(123))
//     ^? Result<string, never>
	.then(next((value) => Ok(String(value))))
```

### toExpectOk
Converts a promise to a result and throws an error with a custom message if the result is an error
> [!TIP]
> alias of `r.toExpect`
```ts
import { Err, Ok, toExpectOk } from '@vyke/results/result'

const value = await toExpectOk(Ok(123), 'some error')
//     ^? number
await toExpectOk(Err(new Error('some error')), 'another error') // throws the error with the message `another error`
```

### toUnwrap
Awaits for the promise and unwraps it then returns the value or throws the error
> [!TIP]
> alias of `r.toUnwrap`
```ts
import { Ok, toUnwrap } from '@vyke/results/result'

const value = await toUnwrap(Ok(123))
//      ^? number
await toUnwrap(Err(new Error('some error'))) // throws the error
```

### toUnwrapOr
Awaits for the promise, unwraps it, and then returns the value or the default one
> [!TIP]
> alias of `r.toUnwrapOr`
```ts
import { Ok, toUnwrapOr } from '@vyke/results/result'

const value = await toUnwrapOr(Ok(123), 345)
//      ^? number
await toUnwrapOr(Err(new Error('some error')), 456) // returns 456 instead of throwing
```

### r
Shorthand for all functions in the `result` module for easy access

### Some
Creates a new Some option.
> [!TIP]
> alias of `o.Some`

### None
Creates a new None option.

### isSome
Checks if an option is a Some option.
> [!TIP]
> alias of `o.isSome`
```ts
import { None, Some, isSome } from '@vyke/results/option'

isSome(Some(123)) // true
isSome(None()) // false
const option = Some(123)
if (isSome(option)) {
	console.log(option.value) // safe to access value
}
```

### isNone
Checks if an option is a None option.
> [!TIP]
> alias of `o.isNone`
```ts
import { None, Some, isNone } from '@vyke/results/option'

isNone(Some(123)) // false
isNone(None()) // true
```

### unwrap
Unwraps the value of an option or throws an error.
> [!TIP]
> alias of `o.unwrap`
```ts
import { None, Some, unwrap } from '@vyke/results/option'

const value = unwrap(Some(123))
//      ^? number 123
unwrap(None()) // throws an Error Result
```

### unwrapOr
Unwraps the value of a result or returns a default value.
> [!TIP]
> alias of `o.unwrapOr`
```ts
import { None, Some, unwrapOr } from '@vyke/results/option'

const value = unwrapOr(Some(123), 10)
//      ^? number
unwrapOr(None(), 10) // returns 10 instead of throwing an error
```

### o
Shorthand for all functions in the `result` module for easy access

## Others vyke projects
- [Flowmodoro app by vyke](https://github.com/albizures/vyke-flowmodoro)
- [@vyke/tsdocs](https://github.com/albizures/vyke-tsdocs)
- [@vyke/val](https://github.com/albizures/vyke-val)
- [@vyke/dom](https://github.com/albizures/vyke-dom)
