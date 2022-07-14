'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var utils = require('helpers/utils');

var createInputPropertiesHTML = function (the_input, the_view) {

    var self = this;
    var html = the_view;
    var input = the_input;
    var partials = formbuilder.dom.partials;
    var is_media_type = consts.MEDIA_ANSWER_TYPES.indexOf(input.type) !== -1;
    var nav_tabs = partials.navtabs;
    var advanced_tab_btn;
    var jump_tab_button;
    var properties;
    var jumps_html;
    var jump_list_html;

    html = html.replace('{{input-ref}}', input.ref);
    html = html.replace('{{advanced-input-ref}}', 'advanced-' + input.ref);

    //get navtabs html
    nav_tabs = nav_tabs.replace('{{#basic-input-ref}}', '#basic-' + input.ref);

    //for media inputs, branch and groups, readme, get disabled 'Advanced tab' button
    if (is_media_type || input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE || input.type === consts.README_TYPE) {
        advanced_tab_btn = self.getAdvancedTabBtnHTML(input.ref, false);
    }
    else {
        //get enable advanced tab button
        advanced_tab_btn = self.getAdvancedTabBtnHTML(input.ref, true);
    }

    nav_tabs = nav_tabs.replace('{{advanced-tab-btn}}', advanced_tab_btn);

    //for inputs NESTED within a group, disable jumps tab, as we cannot have jumps in groups
    if (formbuilder.is_editing_group) {
        jump_tab_button = self.getJumpTabBtnHTML(input.ref, false);
    }
    else {
        jump_tab_button = self.getJumpTabBtnHTML(input.ref, true);
    }

    nav_tabs = nav_tabs.replace('{{jumps-tab-btn}}', jump_tab_button);

    html = html.replace('{{nav-tabs}}', nav_tabs);

    //get properties html
    properties = self.createBasicPropertiesHTML(input);
    html = html.replace('{{properties}}', properties);

    //get jumps html
    jumps_html = partials.jumps_wrapper;
    jumps_html = jumps_html.replace('{{jumps-input-ref}}', 'jumps-' + input.ref);

    //build jump list html
    if (input.jumps.length > 0) {
        //get list of jumps markup
        jump_list_html = self.getJumpsListHTML(input);
        jumps_html = jumps_html.replace('{{no-jumps_message-hidden}}', 'hidden');

        jumps_html = jumps_html.replace('{{jumps-list}}', jump_list_html);

        //if we reached the max number of jumps or this input does not allow multiple jumps, disable button
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) > -1) {
            //multiple answer input, disable add jump if the maximum number of jumps for the input is reached
            // or exceeded, the latter because we had a bug.
            if (input.jumps.length >= input.possible_answers.length) {
                jumps_html = jumps_html.replace('{{add-jump-btn-state}}', 'disabled');
            }
            else {
                jumps_html = jumps_html.replace('{{add-jump-btn-state}}', '');
            }
        }
        else {
            //single answer input
            jumps_html = jumps_html.replace('{{add-jump-btn-state}}', 'disabled');
        }
    }
    else {
        //no jumps list to render
        jumps_html = jumps_html.replace('{{jumps-list}}', '');
        jumps_html = jumps_html.replace('{{add-jump-btn-state}}', '');
        jumps_html = jumps_html.replace('{{no-jumps_message-hidden}}', '');
    }

    html = html.replace('{{jumps}}', jumps_html);

    //disable "Add Jump" button if the max number of jumps is reached
    if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {
        //multiple jumps allowed, check if limit met (number of jumps must be less or equal to possible answers)
        if (input.jumps.length >= input.possible_answers.length) {
            html = html.replace('{{add-jump-btn-state}}', 'disabled="disabled"');
        }
        else {
            html = html.replace('{{add-jump-btn-state}}', '');
        }
    }
    else {
        //single jump allowed, enable add jump button
        html = html.replace('{{add-jump-btn-state}}', '');
    }

    //if multiple choice input type, append possible answer wrapper
    if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {

        html = html.replace('{{possible-answers}}', self.getPossibleAnswersHTML(input));
    }
    else {
        html = html.replace('{{possible-answers}}', '');
    }

    //check if input allows uniqueness
    if (consts.UNIQUENESS_ALLOWED_TYPES.indexOf(input.type) !== -1) {
        html = html.replace('{{uniqueness}}', self.getUniquenessHTML(input));
    }
    return html;
};

module.exports = createInputPropertiesHTML;


