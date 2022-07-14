'use strict';
var utils = require('helpers/utils');
var consts = require('config/consts');
var messages = require('config/messages');

var createInputToolHTML = function (input) {

    var html = '';
    var icon = utils.getInputToolIcon(input.type);
    var is_input_branch = (input.type === consts.BRANCH_TYPE) ? 'input-branch' : '';
    var is_input_group = (input.type === consts.GROUP_TYPE) ? 'input-group' : '';
    var question = input.question === '' ? messages.error.NO_QUESTION_TEXT_YET : input.question;
    var invisible_class = input.jumps.length > 0 ? '' : 'invisible';

    //convert html entities to tags and strip html tags from readme type if any
    if (input.type === consts.README_TYPE) {
        question = utils.decodeHtml(input.question);
        question = question.replace(/(<([^>]+)>)/ig, ' ');
        //wrap in "" to avoid rendering of <br/>
        question = '"' + question + '"';
    }

    html += '<div class="input ' + is_input_branch + is_input_group + ' ui-draggable ui-draggable-handle" ';
    html += 'data-type="' + input.type + '" data-input-ref="' + input.ref + '">';
    html += '<div class="input-inner">';
    html += '<i class="fa fa-2x fa-fw ' + icon + '"></i>';
    html += '<span class="question-preview">' + question.trunc(consts.LIMITS.question_preview_length) + '</span>';
    html += '<i class="question-state fa fa-check fa-2x fa-fw pull-right"></i>';
    html += '<i class="jump-state fa fa-arrow-circle-o-down fa-2x fa-fw pull-right ' + invisible_class + '"></i>';

    if (input.type === consts.BRANCH_TYPE) {
        html += '{{branch-content}}';
    }
    if (input.type === consts.GROUP_TYPE) {
        html += '{{group-content}}';
    }
    html += '</div>';
    html += '</div>';

    return html;
};

module.exports = createInputToolHTML;
