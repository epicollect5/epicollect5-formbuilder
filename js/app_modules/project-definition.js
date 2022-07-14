'use strict';
var project_definition = {
    meta: {
        api: {
            name: 'epicollect5',
            version: 1.0
        }
    },
    data: {
        id: 'your.domain.com/test',
        type: 'public',
        project: {
            id: 'test',
            type: 'epicollect5',
            desc: 'Testing the form builder',
            small_desc: 'Testing the form builder',
            name: 'Test',
            links: {
                upload: 'your.domain.com/upload',
                download: 'your.domain.com/download'
            },
            forms: [
                {
                    id: 'form1',
                    type: 'hierarchy',
                    name: 'Form1',
                    key: 'ec5_form1_0', //reference the input to be used as primary key for a single form entry
                    inputs: []
                }
            ]
        }
    }
};

module.exports = project_definition;
