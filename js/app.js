'use strict';
//modules are required using absolute paths in browserify: https://goo.gl/UkccGz
var init = require('config/init');
var extend_natives = require('config/extend-natives');
var load_components = require('loaders/load-components');
var load_project = require('loaders/load-project');

//load project first
$.when(
    load_project()
).then(function () {
    //load partial views for index.html, extend natives, then init app
    $.when(
        load_components(),
        extend_natives())
       .then(init);
});

/*
 Set middle and right panel to the same height of the inputs-collection panel
 Maybe there is a pure css solution (flexbox), but middle column needs to be scrollable though when I add inputs
 For the time being this will do
 */
//var inputs_collection_height = $('.inputs-tools').height();
//$('.main .panel-body').height(inputs_collection_height);

