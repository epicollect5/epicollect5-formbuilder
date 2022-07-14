'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var getInputPropertiesPanelHTML = function (the_input) {

    //todo use the function here http://jsfiddle.net/jfriend00/DyCwk/
    var self = this;
    var input = the_input;
    var is_media_type = consts.MEDIA_ANSWER_TYPES.indexOf(input.type) !== -1;
    var html = formbuilder.dom.input_properties_views[input.type];

    //get dynamic html for input properties panel
    html = self.createInputPropertiesHTML(input, html);

    //prepare advanced properties (NOT for branch or groups or media types)
    if (input.type !== consts.BRANCH_TYPE || input.type !== consts.GROUP_TYPE || !is_media_type) {
        //manipulate dom for advanced options, which are unique (most of the time) to the input type
        html = self.prepareAdvancedInputPropertiesHTML(html, input);
    }

    return html;

};

module.exports = getInputPropertiesPanelHTML;
