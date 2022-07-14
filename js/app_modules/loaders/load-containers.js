'use strict';
var consts = require('config/consts.js');
var utils = require('helpers/utils');

var get_containers = function () {

    var deferred = new $.Deferred();
    var path = utils.getContainersPath();
    var version = consts.FORMBUILDER_VERSION;

    //load container views for index.html (main entry point)
    $.when(
        //navbar
        $.get(path + 'navbar.html?v=' + version, function (data) {
            $('.navbar').html(data);
        }),
        //inputs tools list (source inputs to drag, draggable)
        $.get(path + 'inputs-tools.html?v=' + version, function (data) {
            $('.inputs-tools').html(data);
        }),
        //inputs collection (sortable), holding all the inputs for a form
        $.get(path + 'inputs-collection.html?v=' + version, function (data) {
            $('.inputs-collection').html(data);
        }),
        //inputs properties, showing properties for selected input
        $.get(path + 'inputs-properties.html?v=' + version, function (data) {
            $('.input-properties').html(data);
        })
    ).then(function () {
        deferred.resolve();
    });

    return deferred.promise();
};

module.exports = get_containers;
