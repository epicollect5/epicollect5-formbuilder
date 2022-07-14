/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var saveUniqueness = function (input) {

    /* get uniqueness flag */
    var uniqueness = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input:checked');
    //top parent form
    if (formbuilder.current_form_index === 0) {
        //this is the top level form, get single checkbox state
        input.uniqueness = (uniqueness.length > 0) ? consts.UNIQUESS_FORM : consts.UNIQUESS_NONE;
    }
    else {
        //do we have some checkboxes selected?
        if (uniqueness.length > 0) {
            //child form can have either hierarchy or form uniqueness
            input.uniqueness = uniqueness.hasClass('uniqueness-hierarchy') ? consts.UNIQUESS_HIERARCHY : consts.UNIQUESS_FORM;
        }
        else {
            input.uniqueness = consts.UNIQUESS_NONE;
        }
    }

};

module.exports = saveUniqueness;
