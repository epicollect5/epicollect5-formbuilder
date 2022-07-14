'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var utils = require('helpers/utils');

var load_project = function () {

    //get version first, we need it for busting cache in inner ajax requests
    console.log($('#formbuilder-version').data());
    try {
        consts.FORMBUILDER_VERSION = $('#formbuilder-version').data().version;
    }
    catch (error) {
        console.log(error);
        consts.FORMBUILDER_VERSION = Date.now();
    }

    var deferred = new $.Deferred();

    utils.setProjectURL();

    console.log(consts.PROJECT_URL + '?' + Date.now());

    //load container views for index.html (main entry point)
    $.when(
        $.ajax({
            url: consts.PROJECT_URL + '?' + Date.now(),
            type: 'GET',
            //contentType: 'application/vnd.api+json',
            success: function (data) {
                formbuilder.project_definition = data;
                // formbuilder.project_definition = data
            },
            error: function (error) {
                console.log(error);
                formbuilder.project_definition = JSON.parse(pako.ungzip(window.atob(error.responseText), { 'to': 'string' }));
            }
        })
    ).then(function () {
        deferred.resolve();
    }).fail(function () {
        deferred.resolve();
    });
    return deferred.promise();
};

module.exports = load_project;
