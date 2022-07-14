'use strict';
var consts = require('config/consts.js');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var load_child_form_containers = function () {

    var deferred = new $.Deferred();
    var views = {};
    var path = utils.getContainersPath();
    var version = consts.FORMBUILDER_VERSION;

    $.when(
        //inputs collection (sortable), holding all the inputs for a child form
        $.get(path + 'inputs-collection.html?v=' + version, function (data) {
            views.inputs_collection = data;
        }),
        //inputs properties, showing properties for selected input
        $.get(path + 'inputs-properties.html?v=' + version, function (data) {
            views.inputs_properties = data;
        })
    ).then(function () {
        deferred.resolve(views);
    });
    return deferred.promise();
};

module.exports = load_child_form_containers;
