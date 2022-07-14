'use strict';

//input base properties
var inputs_properties = {

    //top level, to be exported when saving project
   // index: null,
    ref: null,
    type: '',
    question: '',
    is_title: false,
    is_required: false,
    uniqueness: 'none',
    regex: null,
    default: null,
    verify: false,
    max: null,
    min: null,
    datetime_format: null,
    set_to_current_datetime: false,
    possible_answers: [],
    jumps: [],
    branch: [],
    group: []

    /**************************************************************************************************************/
    //this property is not declared here anymore as with jquery the dom is cached and stays the same per each object,
    //so I will add them later after the object is instantiated
    ///* DOM properties*/
    //dom: {
    //    is_valid: false, //false by default as we sdo not have a question text after drag and drop
    //    advanced_properties_wrapper: null,
    //    add_jump_button: null,
    //    properties_panel:null
    //}
    /**************************************************************************************************************/
};

module.exports = inputs_properties;
