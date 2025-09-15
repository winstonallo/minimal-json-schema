/**
 * @typedef {import('./schema.js').JSONObject} JSONObject
 * @typedef {import('./schema.js').JSONArrayInstance} JSONArrayInstance
 * @typedef {import('./schema.js').JSONObjectInstance} JSONObjectInstance
 * @typedef {import('./schema.js').JSONSchemaValidationResult} JSONSchemaValidationResult
 * @typedef {import('./schema.js').JSONSchema} JSONSchema
 */

/**
 * @param {JSONObject} object
 * @param {JSONArrayInstance} schema
 * @returns {JSONSchemaValidationResult}
 */
function validateArray(object, schema) {
	if (!schema.items) {
		throw new Error("'validateObject' called with unvalidated schema: This should never happen, go fix your code!");
	}
	if (!Array.isArray(object)) {
		return { valid: false, reason: 'Not an array' };
	}
	if (schema.minItems && object.length < schema.minItems) {
		return { valid: false, reason: `Object length is smaller than 'minItems' (${object.length} < ${schema.minItems})` };
	}
	if (schema.maxItems && object.length > schema.maxItems) {
		return { valid: false, reason: `Object length is smaller than 'minItems' (${object.length} > ${schema.maxItems})` };
	}

	for (let i = 0; i < object.length; i++) {
		const item = object[i];
		const result = validate(item, schema.items, 0);
		if (!result.valid) {
			return { valid: false, reason: `Invalid item at index ${i}: ${result.reason}` };
		}
	}
	return { valid: true };
}

/**
 * @param {JSONObject} object
 * @param {JSONObjectInstance} schema
 * @param {number} depth
 * @returns {JSONSchemaValidationResult}
 */
function validateObject(object, schema, depth) {
	if (!schema.properties || !schema.required) {
		throw new Error("'validateObject' called with an unvalidated schema: This should never happen, go fix your code!");
	}

	const required = new Set(schema.required);
	for (const key of Object.keys(object)) {
		if (!(key in schema.properties)) {
			return { valid: false, reason: `Unexpected key ${key}` };
		}
		const result = validate(object[key], schema.properties[key], depth + 1);
		if (!result.valid) {
			return { valid: false, reason: `Ill-formatted type at key '${key}': ${result.reason}` };
		}
		const value_type = Array.isArray(object[key]) ? 'array' : typeof object[key];
		if (value_type !== schema.properties[key].type) {
			return { valid: false, reason: `Invalid type '${value_type}' for key ${key} (expected ${schema.properties[key].type})` };
		}

		required.delete(key);
	}
	if (required.size !== 0) {
		return { valid: false, reason: `Some required fields were not provided: ${required.entries()}` };
	}
	return { valid: true };
}

/**
 * Validates `object` against a **valid** JSON schema.
 * In order to validate the schema itself, call `validateSchema`.
 * @param {any} object
 * @param {JSONSchema} schema
 * @returns {JSONSchemaValidationResult}
 */
function validate(object, schema, depth = 0) {
	if (depth > 20) {
		return { valid: false, reason: 'Maximum object depth (20) exceeded' };
	}
	if (schema.type === 'object') {
		const { valid, reason } = validateObject(object, schema, depth + 1);
		if (!valid) {
			return { valid: false, reason: `Invalid object: ${reason}` };
		}
	} else if (schema.type === 'array') {
		const { valid: arrayValid, reason: arrayInvalidReason } = validateArray(object, schema);
		if (!arrayValid) {
			return { valid: false, reason: `Invalid array: ${arrayInvalidReason}` };
		}
	} else if (schema.type === 'string') {
		if (typeof object !== 'string') {
			return { valid: false, reason: `Invalid type: expected string, got ${typeof object}` };
		}
		if (schema.minLength && object.length < schema.minLength) {
			return { valid: false, reason: `Got string shorter than minLength (${object.length} < ${schema.minLength})` };
		}
		if (schema.maxLength && object.length > schema.maxLength) {
			return { valid: false, reason: `Got string longer than maxLength (${object.length} > ${schema.maxLength})` };
		}
	} else if (schema.type === 'number') {
		if (typeof object !== 'number') {
			return { valid: false, reason: `Invalid type: Expected number, got ${typeof object}` };
		}
	} else if (schema.type === 'boolean') {
		if (typeof object !== 'boolean') {
			return { valid: false, reason: `Invalid type: Expected boolean, got ${typeof object}` };
		}
	}
	return { valid: true };
}

export { validate };
