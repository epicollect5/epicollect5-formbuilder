'use strict';

var replaceCommonAdvancedProperties = function (the_markup, the_input) {

    var html = the_markup;
    var input = the_input;

    var replacements = [
        {
            to_be_replaced: /{{input-ref-default}}/g,
            with_this: input.ref + '-default'
        },
        {
            to_be_replaced: /{{input-ref-regex}}/g,
            with_this: input.ref + '-regex'
        },
        {
            to_be_replaced: /{{input-ref-double-entry}}/g,
            with_this: input.ref + '-double-entry'
        },
        {
            to_be_replaced: '{{input-ref-default-value}}',
            with_this: (input.default === null) ? '' : input.default
        },
        {
            to_be_replaced: '{{input-ref-regex-value}}',
            with_this: (input.regex === null) ? '' : input.regex
        },
        {
            to_be_replaced: '{{input-ref-double-entry-checked}}',
            with_this: input.verify ? 'checked' : ''
        }
    ];

    //replace placeholder with values from input
    $(replacements).each(function (index, replacement) {
        html = html.replace(replacement.to_be_replaced, replacement.with_this);
    });

    return html;
};

module.exports = replaceCommonAdvancedProperties;

