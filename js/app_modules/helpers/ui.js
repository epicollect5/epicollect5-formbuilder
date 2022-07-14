'use strict';

var formbuilder = require('config/formbuilder');
var messages = require('config/messages');
var consts = require('config/consts');
var jumps = require('actions/jumps');
var utils = require('helpers/utils');
var load_child_form_containers = require('loaders/load-child-form-containers');

var ui = {

    navbar: {

        toggleUndoBtn: function (status) {

            if (status === consts.BTN_DISABLED) {
                //toggle button
                formbuilder.dom.undo_btn
                    .attr('disabled', true);
            }

            if (status === consts.BTN_ENABLED) {
                //toggle button
                formbuilder.dom.undo_btn
                    .attr('disabled', false);
            }
        },

        toggleSaveProjectBtn: function (status) {

            if (status === consts.BTN_DISABLED) {
                //toggle button
                formbuilder.dom.save_project_btn
                    .attr('disabled', true);

            }

            if (status === consts.BTN_ENABLED) {
                //toggle button
                formbuilder.dom.save_project_btn
                    .attr('disabled', false);
            }

            //toggle icon
            if (status === consts.BTN_ENABLED) {
                formbuilder
                    .dom.save_project_btn
                    .find('.project-state')
                    .removeClass('fa-warning')
                    .addClass('fa-check');
            }
            else {
                formbuilder
                    .dom.save_project_btn
                    .find('.project-state')
                    .addClass('fa-warning')
                    .removeClass('fa-check');
            }
        }
    },
    forms_tabs: {

        injectRefIntoFormTab: function (ref) {

            var tab_button = $('.main .main__tabs li').first();
            var tab_panel = $('.main .main__tabs-content .main__tabs-content-tabpanel').first();

            //inject ref of the first form to the fist tab/tab content, as it is shown by default
            tab_button.find('a').attr('href', '#' + ref + '-tabpanel');
            tab_panel.first().attr('id', ref + '-tabpanel');
            tab_panel.find('.inputs-collection').attr('id', ref + '-inputs-collection');
            tab_panel.find('.input-properties').attr('id', ref + '-input-properties');

        },

        toggleFormTabsButtons: function (option) {

            if (option.enable) {
                //enable form tab buttons
                formbuilder.dom.forms_tabs.find('li')
                    .not('.main__tabs-btns')
                    .each(function (index, item) {
                        $(item).removeClass('disabled disabled-tab');
                    });
            }
            else {
                //disable form tab buttons
                formbuilder.dom.forms_tabs.find('li')
                    .not('.main__tabs-btns')
                    .each(function (index, item) {
                        $(item).addClass('disabled disabled-tab');
                    });
            }
        },

        setFirstFormTabName: function (the_form_name) {

            var forms = formbuilder.project_definition.data.project.forms;

            formbuilder.dom.forms_tabs
                .find('.active a[data-form-index="0"]')
                .text(the_form_name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)))
                .append('&nbsp;<i class="form-state fa fa-exclamation-triangle"></i>');
        },


        //if the form is valid show a green check on its tab button
        showFormValidIcon: function (the_form_index) {
            formbuilder.dom.forms_tabs
                .find('li a[data-form-index=' + the_form_index + '] i.form-state')
                .removeClass('fa-exclamation-triangle').addClass('fa-check');
        },

        //if the form is NOT valid show a warning icon on its tab button
        showFormInvalidIcon: function (the_form_index) {
            formbuilder.dom.forms_tabs
                .find('li a[data-form-index=' + the_form_index + '] i.form-state')
                .removeClass('fa-check').addClass('fa-exclamation-triangle');
        },

        //return the markup for a form tab button, showing form name
        getFormTabButtonHTML: function (form) {

            var html = '';
            var form_index = formbuilder.current_form_index;
            var forms = formbuilder.project_definition.data.project.forms;

            html += '<li role="presentation" class="main__tabs__form-btn">';
            html += '<a href="#' + form.ref + '-tabpanel" role="tab" data-toggle="tab" data-form-index="' + form_index + '">';
            html += form.name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2));
            html += '&nbsp;<i class="form-state fa fa-exclamation-triangle"></i>';
            html += '</a>';
            html += '</li>';

            return html;
        },

        //get markup for a form tab content (input collection + input properties)
        getFormTabContentHTML: function (form) {

            var html = '';

            var deferred = new $.Deferred();

            $.when(load_child_form_containers()).then(function (views) {

                html += '<div role="tabpanel" class="main__tabs-content-tabpanel tab-pane fade in active" id="' + form.ref + '-tabpanel">';
                html += '<div id="' + form.ref + '-inputs-collection" class="inputs-collection col-md-6">';
                html += views.inputs_collection;
                html += '</div>';
                html += '<div id="' + form.ref + '-input-properties" class="input-properties col-md-6">';
                html += views.inputs_properties;
                html += '</div>';
                html += '</div>';

                deferred.resolve(html);
            });

            return deferred.promise();
        },

        resizeFormTabs: function () {

            var forms = formbuilder.project_definition.data.project.forms;


            formbuilder.dom.forms_tabs
                .find('li:lt(' + forms.length + ')').each(function (index, form_btn) {

                    var state = $(form_btn).find('a i').hasClass('fa-check');
                    var btn = $(form_btn).find('a');
                    var valid_icon_html = '&nbsp;<i class="form-state fa fa-check"></i>';
                    var invalid_icon_html = '&nbsp;<i class="form-state fa fa-exclamation-triangle"></i>';

                    btn.text(forms[index].name
                        .trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)));
                    btn.append(state ? valid_icon_html : invalid_icon_html);
                });
        }
    },
    inputs_collection: {

        //show/hide the title not set warning message
        toggleTitleWarning: function (count, is_branch) {

            //find warning for either the active form or the active branch
            var element_to_find = is_branch ? '.active-branch .no-branch-title-set' : '.no-form-title-set';

            if (count === 0) {
                //show
                formbuilder.dom.inputs_collection_sortable.find(element_to_find).removeClass('hidden').animate({
                    opacity: 1,
                    height: 37
                }, consts.ANIMATION_FAST);
            }
            else {
                //hide
                formbuilder.dom.inputs_collection_sortable.find(element_to_find).animate({
                    opacity: 0,
                    height: 0
                }, consts.ANIMATION_FAST, function () {
                    $(this).addClass('hidden');
                });
            }
        },

        getInputStateIconsHTML: function () {

            var html = '';
            html += '<i class="question-state fa fa-exclamation-triangle fa-2x fa-fw pull-right"></i>';
            html += '<i class="jump-state fa fa-arrow-circle-o-down fa-2x fa-fw pull-right invisible"></i>';

            return html;
        },

        showInputValidIcon: function (the_ref) {
            formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + the_ref + '"] i.question-state')
                .first()
                .removeClass('fa-exclamation-triangle').addClass('fa-check');
        },

        showInputInvalidIcon: function (the_ref) {
            formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + the_ref + '"] i.question-state')
                .first()
                .removeClass('fa-check').addClass('fa-exclamation-triangle');
        },

        showInputQuestionPreview: function (the_ref, the_question) {
            formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + the_ref + '"] > .input-inner > .question-preview')
                .text(the_question.trunc(50));
        },
        toggleFormActionButtons: function (the_state) {
            var buttons = formbuilder.dom.inputs_collection
                .find('.inputs-collection__buttons')
                .find('.btn');

            if (the_state) {
                buttons.attr('disabled', false).show();
            }
            else {
                buttons.attr('disabled', true).hide();
            }
        },
        getEmptyCollectionSortableHTML: function (type) {

            var html = '';

            html += '<div class="' + type + '-sortable hidden">';
            //no title set warning (only for branch type)
            if (type === consts.BRANCH_TYPE) {
                html += '<div class="warning-well no-branch-title-set hidden">No title set for this branch yet ';
                html += '<i class="fa fa-question-circle fa-2x fa-fw" data-toggle="modal" data-target="#info-title">';
                html += '</i>';
                html += '</div>';
            }
            //no inputs yet message
            html += '<span class="input-properties__no-' + type + '-questions-message" style="display: none;">';
            html += type === consts.BRANCH_TYPE ? messages.labels.ADD_BRANCH_INPUTS_HERE : messages.labels.ADD_GROUP_INPUTS_HERE;
            html += '</span>';
            html += '{{' + type + '-inputs}}';
            html += '</div>';

            return html;
        }
    },
    input_tools: {

        enable: function () {
            $('ul#inputs-tools-list li div.input')
                .draggable('enable')
                .removeClass('dragging-disabled');
        },
        disable: function () {
            //disable draggable
            $('ul#inputs-tools-list li div.input')
                .draggable('disable')
                .addClass('dragging-disabled');

            //show toast max number of input hit
            //todo
        },
        hideSearchInput: function () {
            formbuilder.dom.inputs_tools_draggable.filter('.input-search').hide();
        },
        showSearchInput: function () {
            formbuilder.dom.inputs_tools_draggable.filter('.input-search').show();
        }
    },
    input_properties_panel: {

        toggleAddAnswerBtn: function (is_disabled) {

            var input = utils.getActiveInput();
            var properties_panel = formbuilder.dom
                .input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]');

            properties_panel
                .find('.input-properties__form__possible-answers__add-answer')
                .attr('disabled', is_disabled);

        },

        setUniquenessProperty: function (the_form_index, the_input) {

            var form_index = the_form_index;
            var input = the_input;

            if (form_index === 0) {
                input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input')
                    .prop('checked', input.uniquess !== consts.UNIQUESS_NONE);
            }
            else {
                switch (input.uniqueness) {

                    case consts.UNIQUESS_FORM:
                        input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input.uniqueness-form')
                            .prop('checked', true);
                        break;
                    case consts.UNIQUESS_HIERARCHY:
                        input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input.uniqueness-hierarchy')
                            .prop('checked', true);
                        break;
                }
            }
        },

        showInputQuestionPreview: function (question) {

            formbuilder.dom.input_properties
                .find('.panel .panel-heading .input-properties__header .question-preview')
                .text(question);
        },

        toggleJumpTab: function (the_ref, the_state) {

            var jump_tab = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + the_ref + '"]')
                .find('.input-properties__tabs')
                .find('.nav-tabs')
                .children()
                .eq(2);

            //true enable, false disable
            if (the_state) {
                jump_tab.removeClass('disabled disabled-tab');
            }
            else {
                jump_tab.addClass('disabled disabled-tab');
            }
        },

        showJumpTabError: function (jump_dom_object) {

            //show '!' on affected tab, in this case the jump properties tab (third)
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .removeClass('invisible')
                .hide()
                .fadeIn(300);

            //set jump properties tab text to red
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .parent()
                .addClass('validation-error');

        },

        hideJumpTabError: function (jump_dom_object) {

            //show '!' on affected tab, in this case the jump properties tab (third)
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .addClass('invisible');


            //set jump properties tab text to red
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .parent()
                .removeClass('validation-error');

        },

        toggleTitleCheckbox: function (state, ref) {

            var title_control = formbuilder.dom
                .input_properties_forms_wrapper
                .find('form[data-input-ref="' + ref + '"]')
                .find('.input-properties__form__title-flag');

            switch (state) {
                case consts.DISABLED_STATE:
                    title_control.find('label').addClass('disabled-checkbox');
                    title_control.find('input').attr('disabled', true).addClass('disabled-checkbox');
                    title_control.find('span.title-label').text(consts.MAX_TITLE_LIMIT_REACHED);
                    break;
                case consts.ENABLED_STATE:
                    title_control.find('label').removeClass('disabled-checkbox');
                    title_control.find('input').attr('disabled', false).removeClass('disabled-checkbox');
                    title_control.find('span.title-label').text(consts.USE_ANSWER_AS_TITLE);
                    break;
            }
        },
        toggleCopyInputButton: function (ref, state) {

            var copy_btn = formbuilder.dom
                .input_properties
                .find('.input-properties__buttons--copy-input');

            switch (state) {
                case consts.BTN_DISABLED:
                    copy_btn.attr('disabled', true);
                    break;
                case consts.BTN_ENABLED:
                    copy_btn.attr('disabled', false);
                    break;
            }
        }
    },
    group: {

        toggleEditGroupButton: function (the_ref, the_state) {
            formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + the_ref + '"]')
                .find('.input-properties__form__basic-properties')
                .find('.input-properties__form__edit-group').attr('disabled', !the_state);
        },

        hideGroupInputsErrors: function (the_properties_panel) {
            //show error message
            the_properties_panel.find('.input-properties__form__error--group-error')
                .addClass('hidden')
                .text('&nbsp;');
        }

    },
    branch: {

        toggleEditBranchButton: function (the_ref, the_state) {
            formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + the_ref + '"]')
                .find('.input-properties__form__basic-properties')
                .find('.input-properties__form__edit-branch').attr('disabled', !the_state);
        },

        hideBranchInputsErrors: function (the_properties_panel) {
            //show error message
            the_properties_panel.find('.input-properties__form__error--branch-error')
                .addClass('hidden')
                .text('&nbsp;');
        },
        showBranchInputPropertiesDom: function (the_branch_input_index) {

            var form_index = formbuilder.current_form_index;
            var owner_input_ref = formbuilder.current_input_ref;
            var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
            var branch_input_index = the_branch_input_index;
            var branch_input = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].branch[branch_input_index];
            var input_properties_forms_wrapper = formbuilder.dom.input_properties_forms_wrapper;
            var view = formbuilder.dom.input_properties_views[branch_input.type];


            //todo update view template with ref and stuff
            //init properties panel
            // helpers.initInputPropertiesPanel(input_properties_forms_wrapper, branch_input, formbuilder.dom.partials);


            input_properties_forms_wrapper.append(view).hide().fadeIn(consts.ANIMATION_FAST);


            ////todo move this in mousedown?
            ////for group nested in a branch, enable keyup to check for validation of header text
            //if (branch_input.type === consts.GROUP_TYPE) {
            //    formbuilder.dom.input_properties.off('keyup').on('keyup', 'input', input_properties_keyup_callback);
            //}
            //else {
            //    formbuilder.dom.input_properties.off('keyup');
            //}
        }
    }
};

module.exports = ui;
