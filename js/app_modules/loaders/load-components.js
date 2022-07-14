'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var load_partials = require('loaders/load-partials');
var load_containers = require('loaders/load-containers');
var load_input_properties_views = require('loaders/load-input-properties-views');
var ui = require('helpers/ui');

/********************************************
 Load html components
 *******************************************/
var load_components = function () {

    var deferred = new $.Deferred();

    //load main containers (inputs tools, inputs collection and inputs properties) ("containers will be undefined")
    //load partials for input properties tabs ("partials")
    //load views for input properties ("views")
    $.when(load_containers(), load_partials(), load_input_properties_views()).then(function (containers, partials, views) {

        //init with first form ref
        var form_ref = formbuilder.project_definition.data.project.forms[0].ref;

        //inject ref into first form in the dom
        ui.forms_tabs.injectRefIntoFormTab(form_ref);

        //setup formbuilder object
        formbuilder.setup(form_ref, partials, views);


        deferred.resolve();
    });
    return deferred.promise();
};

module.exports = load_components;
