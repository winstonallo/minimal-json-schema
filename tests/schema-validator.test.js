import { describe, it } from 'node:test';
import * as json_schema from '../src/schema.js';
import * as json_object from '../src/object.js';

/**
 * @typedef {import('../src/schema.js').JSONInstance} JSONInstance
 * @typedef {import('../src/schema.js').JSONSchema} JSONSchema
 */

describe('Object Validation Tests', () => {
	it('Should pass a schema-compliant object', (test) => {
		/** @type {JSONSchema} */
		const schema = { type: 'object', required: ['code'], properties: { code: { type: 'number' } } };
		const data = { code: 1 };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should fail on unexpected keys', (test) => {
		/** @type {JSONSchema} */
		const schema = { type: 'object', required: ['code'], properties: { code: { type: 'number' } } };
		const data = { code: 1, foo: 'bar' };
		test.assert.equal(json_object.validate(data, schema).valid, false);
	});
	it('Should handle arrays', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['from', 'to', 'body'],
			properties: {
				from: { type: 'string' },
				to: { type: 'array', items: { type: 'string' }, minItems: 1 },
				body: { type: 'string' },
			},
		};
		const data = { from: 'alice@doe.com', to: ['john@doe.com'], body: 'foo' };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should handle minLength in string', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['to'],
			properties: {
				to: { type: 'string', minLength: 3 },
			},
		};
		const data = { to: 'a' };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, false);
	});
	it('Should handle maxLength in string', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['to'],
			properties: {
				to: { type: 'string', maxLength: 64 },
			},
		};
		const data = { to: '0123456789012345678901234567890123456789012345678901234567890123456789' };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, false);
	});
	it('Should handle valid numbers', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'number' },
			},
		};
		const data = { foo: 42 };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should handle invalid numbers', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'number' },
			},
		};
		const data = { foo: '' };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, false);
	});
	it('Should handle valid booleans', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'boolean' },
			},
		};
		const data = { foo: true };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should handle invalid booleans', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'boolean' },
			},
		};
		const data = { foo: '' };
		const result = json_object.validate(data, schema);
		test.assert.equal(result.valid, false);
	});
	it('Should handle minItems in arrays', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['from', 'to', 'body'],
			properties: {
				from: { type: 'string' },
				to: { type: 'array', items: { type: 'string' }, minItems: 1 },
				body: { type: 'string' },
			},
		};
		const data = { from: 'alice@doe.com', to: [], body: 'foo' };
		test.assert.equal(json_object.validate(data, schema).valid, false);
	});
	it('Should handle maxItems in arrays', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['from', 'to', 'body'],
			properties: {
				from: { type: 'string' },
				to: { type: 'array', items: { type: 'string' }, maxItems: 1 },
				body: { type: 'string' },
			},
		};
		const data = { from: 'alice@doe.com', to: ['john@doe.com', 'foo@bar.baz'], body: 'foo' };
		test.assert.equal(json_object.validate(data, schema).valid, false);
	});
	it('Should check the type of all elements of an array', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['from', 'to', 'body'],
			properties: {
				from: { type: 'string' },
				to: { type: 'array', items: { type: 'string' }, minItems: 1 },
				body: { type: 'string' },
			},
		};
		const data = { from: 'alice@doe.com', to: ['john@doe.com', 0xdeadbeef], body: 'foo' };
		test.assert.equal(json_object.validate(data, schema).valid, false);
	});
	it('Should fail when passed a non-array item as an array', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['from', 'to', 'body'],
			properties: {
				from: { type: 'string' },
				to: { type: 'array', items: { type: 'string' }, minItems: 1 },
				body: { type: 'string' },
			},
		};
		const data = { from: 'alice@doe.com', to: 'john@doe.com', body: 'foo' };
		test.assert.equal(json_object.validate(data, schema).valid, false);
	});
	it('Should handle nested objects', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'object', required: ['bar'], properties: { bar: { type: 'string' } } },
			},
		};
		const data = { foo: { bar: 'baz' } };
		const { valid, reason } = json_object.validate(data, schema);
		test.assert.equal(valid, true, reason);
	});
	it('Should find type errors in nested objects', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'object', required: ['bar'], properties: { bar: { type: 'string' } } },
			},
		};
		const data = { foo: { bar: 0x42 } };
		const { valid, reason } = json_object.validate(data, schema);
		test.assert.equal(valid, false, reason);
	});
	it('Should fail when a required field is not provided', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'string' },
				bar: { type: 'number' },
			},
		};
		const data = { bar: 0x42 };
		const { valid, reason } = json_object.validate(data, schema);
		test.assert.equal(valid, false, reason);
	});
});

describe('Schema Validation Tests', () => {
	it('Should fail when items is not set in array', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['from', 'to', 'body'],
			properties: {
				from: { type: 'string' },
				// @ts-ignore
				to: { type: 'array', minItems: 1 },
				body: { type: 'string' },
			},
		};
		test.assert.equal(json_schema.validate(schema).valid, false);
	});
	it('Should handle nested objects', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['level1'],
			properties: {
				level1: { type: 'object', required: ['level2'], properties: { level2: { type: 'string' } } },
			},
		};
		const result = json_schema.validate(schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should fail on invalid types in nested objects', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['level1'],
			properties: {
				level1: {
					type: 'object',
					required: ['level2'],
					properties: {
						// @ts-ignore
						level2: 'string',
					},
				},
			},
		};
		test.assert.equal(json_schema.validate(schema).valid, false);
	});
	it('Should fail on invalid JSON instances', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				// @ts-ignore
				foo: { type: 'bar' },
			},
		};
		test.assert.equal(json_schema.validate(schema).valid, false);
	});
	it('Should fail on invalid keys for boolean', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				// @ts-ignore
				foo: { type: 'boolean', minLength: 1 },
			},
		};
		test.assert.equal(json_schema.validate(schema).valid, false);
	});
	it('Should allow minLength on string', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'string', minLength: 1 },
			},
		};
		const result = json_schema.validate(schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should validate arrays of objects', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo'],
			properties: {
				foo: { type: 'array', items: { type: 'object', properties: { user: { type: 'string' } } } },
			},
		};
		const result = json_schema.validate(schema);
		test.assert.equal(result.valid, true, result.reason);
	});
	it('Should fail when not all required fields are in properties', (test) => {
		/** @type {JSONSchema} */
		const schema = {
			type: 'object',
			required: ['foo', 'bar'],
			properties: {
				foo: { type: 'string' },
			},
		};
		const result = json_schema.validate(schema);
		test.assert.equal(result.valid, false);
	});
});
