import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARAMETERS } from '../src/models/parameters.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function schemaLimit(schema, path_parts) {
    return path_parts.reduce(function (value, part) {
        return value && value[part];
    }, schema);
}

function conditionalForType(schema, type) {
    return schema.$defs.input.allOf.find(function (condition) {
        return condition.if &&
            condition.if.properties &&
            condition.if.properties.type &&
            condition.if.properties.type.const === type;
    });
}

export async function checkSchemaParameters() {
    const schema = JSON.parse(await fs.readFile(path.join(root, 'schemas/project.schema.json'), 'utf8'));
    const checks = [
        ['MAX_FORMS', ['$defs', 'project', 'properties', 'forms', 'maxItems']],
        ['FORM_NAME_MAX_LENGTH', ['$defs', 'form', 'properties', 'name', 'maxLength']],
        ['INPUTS_MAX_ALLOWED', ['$defs', 'form', 'properties', 'inputs', 'maxItems']],
        ['MAX_ANSWER_LENGTH', ['$defs', 'possibleAnswer', 'properties', 'answer', 'maxLength']],
        ['REGEX_MAX_LENGTH', ['$defs', 'input', 'properties', 'regex', 'oneOf', '1', 'maxLength']]
    ];
    const mismatches = [];

    checks.forEach(function ([parameter, schema_path]) {
        const actual = schemaLimit(schema, schema_path);

        if (actual !== PARAMETERS[parameter]) {
            mismatches.push(parameter + ' is ' + PARAMETERS[parameter] + ' in PARAMETERS but ' + actual + ' in schema at ' + schema_path.join('.'));
        }
    });

    [
        ['dropdown', PARAMETERS.MAX_ANSWERS],
        ['radio', PARAMETERS.MAX_ANSWERS],
        ['checkbox', PARAMETERS.MAX_ANSWERS],
        ['searchsingle', PARAMETERS.MAX_SEARCH_ANSWERS],
        ['searchmultiple', PARAMETERS.MAX_SEARCH_ANSWERS]
    ].forEach(function ([type, expected]) {
        const condition = conditionalForType(schema, type);
        const actual = condition && condition.then && condition.then.properties &&
            condition.then.properties.possible_answers && condition.then.properties.possible_answers.maxItems;

        if (actual !== expected) {
            mismatches.push(type + ' possible_answers maxItems is ' + actual + ' in schema; expected ' + expected + ' from PARAMETERS');
        }
    });

    if (mismatches.length) {
        throw new Error('Schema/PARAMETERS limits are out of alignment:\n- ' + mismatches.join('\n- '));
    }
}
