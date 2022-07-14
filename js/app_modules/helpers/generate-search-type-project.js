'use strict';
var consts = require('config/consts');
var utils = require('helpers/utils');


var generate_search_type_project = {

    doIt: function () {

        var project = {
            data: {
                type: 'project',
                project: {
                    name: 'Test search type',
                    small_description: 'blah blah blah',
                    access: 'public',
                    slug: 'test-search-type',
                    ref: '0b3c3c34200243e3b5b68a3b87345c95',
                    status: 'active',
                    visibility: 'hidden',
                    logo_url: 'ec5.jpg',
                    forms: []
                }
            }
        };

        for (var i = 0; i < 5; i++) {
            project.data.project.forms[i] = {};
            project.data.project.forms[i].ref = project.data.project.ref + '_' + utils.generateUniqID();
            project.data.project.forms[i].inputs = [];

            for (var j = 0; j < 1; j++) {
                project.data.project.forms[i].inputs[j] = {};
                project.data.project.forms[i].inputs[j].possible_answers = [];

                for (var x = 0; x < 1000; x++) {
                    project.data.project.forms[i].inputs[j].possible_answers[x] = {};
                    project.data.project.forms[i].inputs[j].possible_answers[x].answer = new Array(150 + 1).join('x');
                    project.data.project.forms[i].inputs[j].possible_answers[x].answer_ref = utils.generateUniqID();
                }
            }
        }

        var file = new File([JSON.stringify(project)], 'search-test.json', { type: 'text/plain:charset=utf-8' });
        saveAs(file);

        //console.log(JSON.stringify(project));
    }
};


module.exports = generate_search_type_project;
