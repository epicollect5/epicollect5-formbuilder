/* global $, toastr*/
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');

//todo maybe this callback is not needed anymore
var callback = function () {

    //get hold of modal;
    var modal = $(this);

    //bind buttons
    modal.find('.table').off().on('click', '.btn', function () {

        var button = $(this);
        var current_input_regex_property;

        if (formbuilder.is_editing_group) {
            current_input_regex_property = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + formbuilder.group.current_input_ref + '"]')
                .find('.input-properties__form__advanced-properties__regex input');
        }
        else {

            if (formbuilder.is_editing_branch) {
                current_input_regex_property = formbuilder.dom.input_properties_forms_wrapper
                    .find('form[data-input-ref="' + formbuilder.branch.current_input_ref + '"]')
                    .find('.input-properties__form__advanced-properties__regex input');
            }
            else {

                current_input_regex_property = formbuilder.dom.input_properties_forms_wrapper
                    .find('form[data-input-ref="' + formbuilder.current_input_ref + '"]')
                    .find('.input-properties__form__advanced-properties__regex input');
            }
        }

        //apply the selected regex
        current_input_regex_property.val(consts.REGEX[button.attr('data-apply-regex')]);

        modal.modal('hide');
    });
};

module.exports = callback;
