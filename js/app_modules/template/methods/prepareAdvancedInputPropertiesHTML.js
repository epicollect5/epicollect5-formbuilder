'use strict';
var consts = require('config/consts');
var utils = require('helpers/utils');

var prepareAdvancedInputPropertiesHTML = function (view, input) {

    var html = view;
    var ref = input.ref;
    var type = input.type;
    var datetime_format = {
        is_checked_datetime_format_1: '',//set first format as default
        is_checked_datetime_format_2: '',
        is_checked_datetime_format_3: '',
        is_checked_datetime_format_4: '',
        is_checked_datetime_format_5: ''
    };

    var is_integer_checked;
    var is_decimal_checked;
    var is_search_single_checked;
    var is_search_multiple_checked;

    function _replaceDatetimeAdvancedProperties(type) {

        var i;
        var iLength = 6;

        //if it is a new input, set datatime format to default
        if (input.datetime_format === null) {
            if (input.type === consts.TIME_TYPE) {
                //for time questions, default to HH:mm to get best UI on device
                input.datetime_format = consts[type.toUpperCase() + '_FORMAT_3'];
            }
            else {
                input.datetime_format = consts[type.toUpperCase() + '_FORMAT_1'];
            }
        }

        //set datetime format to the one saved
        for (i = 1; i < iLength; i++) {
            datetime_format['is_checked_datetime_format_' + i] = input.datetime_format === consts[type.toUpperCase() + '_FORMAT_' + i] ? 'checked' : '';
            html = html.replace('{{is-checked-datetime-format-' + i + '}}', datetime_format['is_checked_datetime_format_' + i]);
        }
        html = html.replace('{{input-ref-default-to-current}}', ref + '-default-to-current');
        html = html.replace('{{set-to-current-datetime}}', set_to_current_datetime);
    }

    function _replaceNumericAdvancedProperties(type) {

        is_integer_checked = 'checked';
        is_decimal_checked = '';

        if (type === consts.DECIMAL_TYPE) {
            is_integer_checked = '';
            is_decimal_checked = 'checked';
        }

        html = html.replace('{{is-integer-checked}}', is_integer_checked);
        html = html.replace('{{is-decimal-checked}}', is_decimal_checked);
        html = html.replace('{{input-ref-min-value}}', input.min);
        html = html.replace('{{input-ref-max-value}}', input.max);
        html = html.replace(/{{input-ref-integer}}/g, ref + '-integer');
        html = html.replace(/{{input-ref-decimal}}/g, ref + '-decimal');
        html = html.replace(/{{input-ref-min}}/g, ref + '-min');
        html = html.replace(/{{input-ref-max}}/g, ref + '-max');

    }

    function _replaceSearchAdvancedProperties(type) {

        is_search_single_checked = 'checked';
        is_search_multiple_checked = '';

        if (type === consts.SEARCH_MULTIPLE_TYPE) {
            is_search_single_checked = '';
            is_search_multiple_checked = 'checked';
        }

        html = html.replace('{{is-searchsingle-checked}}', is_search_single_checked);
        html = html.replace('{{is-searchmultiple-checked}}', is_search_multiple_checked);


    }

    function _getInitialAnswerHTML(input, the_html) {

        var html = the_html;
        var answer_label = '';

        html = html.replace(/{{input-ref-default}}/g, input.ref + '-default');

        if (input.default === '' || input.default === null) {
            //no, set 'none'
            html = html.replace(/{{selected}}/g, 'selected');
            html = html.replace(/{{initial-answer}}/g, '');
        }
        else {

            //get possible answer label
            answer_label = utils.getPossibleAnswerLabel(input);

            html = html.replace(/{{selected}}/g, '');
            html = html.replace(/{{initial-answer}}/g, '<option value="' + input.default + '"  selected >' + answer_label + '</option>');
        }
        return html;
    }

    var set_to_current_datetime = (input.set_to_current_datetime) ? 'checked' : '';

    switch (type) {

        case consts.DROPDOWN_TYPE:
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.RADIO_TYPE:
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.CHECKBOX_TYPE:
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.INTEGER_TYPE:
            html = this.replaceCommonAdvancedProperties(html, input);
            _replaceNumericAdvancedProperties(type);
            break;
        case consts.DECIMAL_TYPE:
            html = this.replaceCommonAdvancedProperties(html, input);
            _replaceNumericAdvancedProperties(type);
            break;
        case consts.DATE_TYPE:
            _replaceDatetimeAdvancedProperties(consts.DATE_TYPE);
            break;
        case consts.TIME_TYPE:
            _replaceDatetimeAdvancedProperties(consts.TIME_TYPE);
            break;
        case consts.SEARCH_SINGLE_TYPE:
            _replaceSearchAdvancedProperties(consts.SEARCH_SINGLE_TYPE);
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.SEARCH_MULTIPLE_TYPE:
            _replaceSearchAdvancedProperties(consts.SEARCH_MULTIPLE_TYPE);
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        default:
            html = this.replaceCommonAdvancedProperties(html, input);

    }
    return html;
};

module.exports = prepareAdvancedInputPropertiesHTML;
