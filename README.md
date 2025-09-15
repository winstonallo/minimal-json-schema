# minimal-json-schema

A lightweight JSON Schema validator for a minimal subset of the spec. Feel free to fork and extend to your use case.

## Supported Types & Keywords

* **object**: `required`, `properties`
* **array**: `items`, `minItems`, `maxItems`
* **string**: `minLength`, `maxLength`
* **number**
* **boolean**

## Usage
```js
import { validate } from './src/object.js';

const schema = {
  type: 'object',
  required: ['from', 'to', 'body'],
  properties: {
    from: { type: 'string' },
    to: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 1
    },
    body: { type: 'string' }
  }
};

const data = {
  from: 'alice@doe.com',
  to: ['john@doe.com', 'foo@bar.baz'],
  body: 'foo'
};

const result = validate(data, schema);
```
