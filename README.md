<div align="center">
	<h1>
		@vyke/results
	</h1>
</div>

Collection of helpers to work with the _*Result*_ type in TypeScript, inspired by the Rust Result pattern and ts-results. It simplifies error handling and enhances the management of asynchronous functions, offering a clean and efficient approach.

## Installation
```sh
npm i @vyke/results 
```

## Examples
```ts
import * as fs from 'node:fs'
import { r } from '@vyke/results'

function readFile(filename: string) {
	try {
		return r.ok(fs.readFileSync(filename))
	}
	catch (error) {
		return r.err(new Error('error reading file'))
	}
}

const result = readFile('test.txt')
if (result.ok) {
	console.log(result.value) // the files content
}
else {
	console.error(result.value) // value is the error here
}
```
Using promises

```ts
import * as fs from 'node:fs/promises'
import { r } from '@vyke/results'

async function readFile(filename: string) {
	const result = await r.to(fs.readFile(filename))

	if (!result.ok) {
		return r.err(new Error('error reading file'))
	}

	return result
}

const result = await readFile('test.txt')
if (result.ok) {
	console.log(result.value) // the files content
}
else {
	console.error(result.value) // value is the error here
}
```

## API

### Ok
Creates a new _ok_ result with the given value
> alias to `r.ok`
```ts
import { Ok } from '@vyke/results'

const result = Ok(123)
//      ^? Result<number, never>
```

### Err
Creates a new _err_ result with the given error
> [!TIP]
> alias to `r.err`
```ts
import { Err } from '@vyke/results'

const result = Err(new Error('some error'))
//      ^? Result<never, Error>
```
> [!NOTE]
> Error values don't need to be an error, they can be anything


### unwrap
Unwraps the result return the value or throwing the error
> [!TIP]
> alias to `r.unwrap`
```ts
import { Ok, unwrap } from '@vyke/results'

const value = unwrap(Ok(123))
//      ^? number
unwrap(Err(new Error('some error'))) // throws the error
```

### expect
Similar to unwraps but with a custom error
> [!TIP]
> alias to `r.expect`
```ts
import { Err, Ok, expect } from '@vyke/results'

const value = expect(Ok(123), 'some error')
//     ^? number

expect(Err(new Error('some error')), 'another error') // throws the error with the mssage `another error`
```

### to
Converts a promise to a result
> [!TIP]
> alias to `r.to`
```ts
import { to } from '@vyke/results'

const result = await to(Promise.resolve(123))
//     ^? Result<number, unknown>
```
> [!CAUTION]
> Notice that Result error type is unknown


## andThen
Converts a promise to a result
> [!TIP]
> alias to `r.andThen`
```ts
import { Ok, andThen } from '@vyke/results'

const result = andThen(Ok(123), (value) => Ok(String(value)))
//      ^? Result<number, never>
```


## next
Similar to andThen, but to create a function to be used in a _then_ function
> [!TIP]
> alias to `r.next`
```ts
import { next, to } from '@vyke/results'

const result = await Promise.resolve(Ok(123))
//     ^? Result<string, never>
	.then(next((value) => Ok(String(value))))
```