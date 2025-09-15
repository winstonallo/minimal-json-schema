/**
 * @typedef {{[key: string]: any}} JSONObject
 * @typedef {'null' | 'boolean' | 'string' | 'number' | 'object' | 'array'} JSONInstance
 * @typedef {{type: 'string', default?: string, minLength?: number, maxLength?: number}} JSONStringInstance
 * @typedef {{type: 'boolean', default?: boolean}} JSONBooleanInstance
 * @typedef {{type: 'number', default?: number}} JSONNumberInstance
 * @typedef {{type: 'array', default?: [], minItems?: number, maxItems?: number, items: JSONSchema}} JSONArrayInstance
 * @typedef {{type: 'object', required?: string[], properties: {[key: string]: JSONSchema}}} JSONObjectInstance
 * @typedef {JSONStringInstance | JSONNumberInstance | JSONBooleanInstance | JSONArrayInstance | JSONObjectInstance} JSONSchema
 * @typedef {{valid: boolean, reason?: string}} JSONSchemaValidationResult
 */

/** @type {{[key: string]: Set<string>}} */
export const ALLOWED_TYPES = Object.freeze({
	string: new Set(['type', 'default', 'minLength', 'maxLength']),
	boolean: new Set(['type', 'default']),
	number: new Set(['type', 'default']),
});

/**
 * @param {JSONArrayInstance} schema
 * @returns {JSONSchemaValidationResult}
 */
function validateArray(schema) {
	if (!schema.type) {
		return { valid: false, reason: "The 'type' field is missing" };
	}
	if (!schema.items) {
		return {
			valid: false,
			reason: "Expected 'items' field in array object schema",
		};
	}
	if (schema.minItems && typeof schema.minItems !== 'number') {
		return {
			valid: false,
			reason: 'Invalid type for minItems: Expected a number',
		};
	}
	if (schema.maxItems && typeof schema.maxItems !== 'number') {
		return {
			valid: false,
			reason: 'Invalid type for maxItems: Expected a number',
		};
	}

	return { valid: true };
}

/**
 * @param {JSONObjectInstance} schema
 * @param {number} depth
 * @returns {JSONSchemaValidationResult}
 */
function validateObject(schema, depth) {
	if (!schema.properties) {
		return { valid: false, reason: 'At least one property must be set' };
	}
	const required = new Set(schema.required);
	if (required.size > Object.keys(schema.properties).length) {
		return {
			valid: false,
			reason: `Insatisfiable requirement: more required fields than properties (${required.size} > ${Object.keys(schema.properties).length})`,
		};
	}
	for (const key of Object.keys(schema.properties)) {
		required.delete(key);
		if (!schema.properties[key].type) {
			return {
				valid: false,
				reason: `The 'type' field is missing in key ${key}`,
			};
		}
		const { valid, reason } = validate(schema.properties[key], depth + 1);
		if (!valid) {
			return {
				valid: false,
				reason: `Ill-formatted type at key '${key}': ${reason}`,
			};
		}
	}
	if (required.size !== 0) {
		return {
			valid: false,
			reason: `Some required fields were not provided: ${required.entries()}`,
		};
	}
	return { valid: true };
}

/**
 * Validates `object` against `schema`.
 * @param {JSONSchema} schema
 * @returns {JSONSchemaValidationResult}
 */
function validate(schema, depth = 0) {
	if (depth > 20) {
		return { valid: false, reason: 'Maximum schema depth (20) exceeded' };
	}
	if (!schema.type) {
		return {
			valid: false,
			reason: "The 'type' field is missing in object",
		};
	}
	if (schema.type === 'object') {
		const { valid, reason } = validateObject(schema, depth);
		if (!valid) {
			return { valid: false, reason: `Invalid object: ${reason}` };
		}
	} else if (schema.type === 'array') {
		const { valid: arrayValid, reason: arrayInvalidReason } = validateArray(schema);
		if (!arrayValid) {
			return {
				valid: false,
				reason: `Invalid array: ${arrayInvalidReason}`,
			};
		}
		const { valid, reason } = validate(schema.items, depth + 1);
		if (!valid) {
			return { valid: false, reason: `Invalid array: ${reason}` };
		}
	} else if (schema.type in ALLOWED_TYPES) {
		const allowedForType = ALLOWED_TYPES[schema.type];
		for (const valueKey of Object.keys(schema)) {
			if (!allowedForType.has(valueKey)) {
				return {
					valid: false,
					reason: `Unexpected schema key '${valueKey}' for ${schema.type} instance, expected one of ${allowedForType.entries()}`,
				};
			}
			if (schema.type === 'string' && (valueKey === 'minLength' || valueKey === 'maxLength') && typeof schema[valueKey] !== 'number') {
				return {
					valid: false,
					reason: `Invalid string: ${valueKey} must be a number (got ${schema[valueKey]})`,
				};
			}
		}
	} else {
		return {
			valid: false,
			reason: `Invalid type: ${schema.type} is not a valid JSON schema instance`,
		};
	}
	return { valid: true };
}

export { validate };
