'use strict';

var getJumpTabBtnHTML = function (ref, is_active) {

    var html = '';

    if (is_active) {
        html += '<li role="presentation" class="jump-tab nav-tabs__tab-btn-item">';
        html += '<a href="#jumps-' + ref + '" role="tab" data-toggle="tab" > Jumps (IF - ELSE)&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x invisible jumps-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    else {
        html += '<li role="presentation" class="jump-tab disabled disabled-tab nav-tabs__tab-btn-item">';
        html += '<a href="#" class="nav-tabs__jump" role="tab" > Jumps (IF - ELSE)&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x invisible jumps-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    return html;
};

module.exports = getJumpTabBtnHTML;
