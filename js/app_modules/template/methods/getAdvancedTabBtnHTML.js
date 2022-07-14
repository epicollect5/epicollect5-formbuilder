'use strict';

var getAdvancedTabBtnHTML = function (ref, is_active) {

    var html = '';

    if (is_active) {
        html += '<li role="presentation" class="nav-tabs__tab-btn-item advanced-tab">';
        html += '<a href="#advanced-' + ref + '" role="tab" data-toggle="tab"> Advanced&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x invisible advanced-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    else {

        html += '<li role="presentation" class="disabled disabled-tab nav-tabs__tab-btn-item">';
        html += '<a href="#" role="tab" > Advanced&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x  invisible advanced-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    return html;
};

module.exports = getAdvancedTabBtnHTML;
