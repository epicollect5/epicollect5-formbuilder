/* global $*/
'use strict';

var formbuilder = {
    current_form_ref: '',
    current_form_index: '',
    current_input_ref: '',
    is_sorting: false,
    from_index: 0,
    to_index: 0,
    possible_answers: {
        enabled_sortable: [],
        from_index: 0,
        to_index: 0
    },
    state: [],
    dom: {
        input_properties: '',
        input_properties_forms_wrapper: '',
        input_properties_buttons: '',
        input_properties_no_input_selected: '',
        inputs_collection: '',
        inputs_collection_sortable: '',
        partials: {},
        input_properties_views: {}
    },
    branch: {},
    project_definition: {},//this gets loaded dynamically

    setup: function (ref, partials, views) {

        //set refs for current form (always top parent, on load)
        formbuilder.current_form_ref = ref;
        formbuilder.current_form_index = 0;
        formbuilder.possible_answers_pagination = {};

        /* cache static dom selectors to speed up dynamic queries
         and also for consistent and quick access throughout the code as
         we are abstracting the dom access away a little bit

         to get the dom element, we concatenate find() calls, as it is faster
         http://jsperf.com/find-chaining/2
         */
        formbuilder.dom = {
            overlay: $('.wait-overlay'),
            loader: $('.loader'),
            navbar: $('.navbar'),
            forms_tabs: $('.main .main__tabs'),
            forms_tabs_content: $('.main .main__tabs-content'),
            save_project_btn: $('.main__tabs-btns .btn-group .main__tabs__save-project-btn'),
            undo_btn: $('.main__tabs-btns .btn-group .main__tabs__undo-btn'),
            main_container: $('.container-fluid'),
            input_properties: $('#' + ref + '-input-properties.input-properties'),
            input_properties_forms_wrapper: $('#' + ref + '-input-properties.input-properties > .panel > .panel-body.input_properties__forms_wrapper'),
            input_properties_buttons: $('#' + ref + '-input-properties .input-properties__buttons'),
            input_properties_no_input_selected: $('.input-properties__no-input-selected'),
            inputs_collection: $('#' + ref + '-inputs-collection.inputs-collection'),
            inputs_collection_sortable: $('#' + ref + '-inputs-collection.inputs-collection .panel .panel-body'),
            inputs_tools_draggable: $('ul#inputs-tools-list li div.input')
        };

        if ($.isEmptyObject(formbuilder.dom.partials) && partials) {
            formbuilder.dom.partials = partials;
        }

        if ($.isEmptyObject(formbuilder.dom.input_properties_views) && views) {
            formbuilder.dom.input_properties_views = views;
        }

        formbuilder.isOpeningFileBrowser = false;

        console.log('formbuilder object ready');
    }
};


module.exports = formbuilder;
