'use strict';

/**
 * The legacy Mocha specs (js/test), executed by Vitest.
 *
 * The specs are required, not rewritten: they keep using their own Chai
 * assertions and the legacy modules through their browserify ids, so the two
 * suites cannot drift apart.
 */

import { legacy_require } from './setup.js';

const legacy_specs = [
    'hasValidFormStructure.test',
    'areJumpsValid.test',
    'hasSameProps.test',
    'areJumpsDestinationsValid.test',
    'sanitizeLegacyInvalidEndJumps.test',
    'getJumpAvailableDestinationsAsKeys.test',
    'arePossibleAnswersValid.test',
    'isValidInput.test',
    'isValidCopiedInput.test',
    'doCleaningBeforeSaving.test',
    'getInputPropertiesPanelHTML.test',
    'exportPossibleAnswersCSV.test',
    'deletePossibleAnswers.test',
    'importPossibleAnswers.test',
    'replaceWordChars.test',
    'wordCharsCleaning.test',
    'paginationPossibleAnswers.test',
    'projectWithSearchInputs.test',
    'projectWithInputs.test'
];

describe('legacy mocha suite', function () {
    legacy_specs.forEach(function (spec) {
        legacy_require(spec);
    });
});
