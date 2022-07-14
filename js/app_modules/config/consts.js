/*
 set of constants and values to use across the application
 we use `consts` as const is a reserved word and `constant` is a window global object
 */
'use strict';

console.log(window.location.href);

var consts = {

    PROJECT_URL: '',
    PROJECT_LOGO_URL: '',
    BACK_URL: '',
    API_DEVELOPMENT_GET_PATH: '../project/',
    API_DEVELOPMENT_POST_PATH: '../postdump/',
    API_DEVELOPMENT_PROJECT: 'project.json',

    API_PRODUCTION_PATH: 'api/internal/formbuilder/',
    API_MEDIA_PATH: 'api/internal/media/',
    API_PROJECT_LOGO_QUERY_STRING: '?type=photo&name=logo.jpg&format=project_mobile_logo',
    API_DEVELOPMENT_SERVER: 'http://localhost/dev/epicollect5-vps-ant-new/',//to be changed accordingly

    PROJECT_NAME_MAX_LENGHT: 100,
    FORM_NAME_MAX_LENGHT: 50,
    INPUTS_MAX_ALLOWED: 300,
    TAB_FORM_NAME_MAX_DISPLAY_LENGHT: 22,
    INPUTS_COLLECTION_FORM_NAME_MAX_DISPLAY_LENGHT: 22,
    INPUTS_COLLECTION_BRANCH_NAME_MAX_DISPLAY_LENGHT: 25,
    INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT: 25,
    MAX_NUMBER_OF_NESTED_CHILD_FORMS: 5,
    ANIMATION_FAST: 100,//milliseconds
    ANIMATION_NORMAL: 150,
    ANIMATION_SLOW: 500,
    ANIMATION_SUPER_SLOW: 1000,

    FORM_NAME_REGEX: /^[\w\-\s]+$/, //allow only alphanumeric chars and '-', '_'
    FORM_HIERARCHY_TYPE: 'hierarchy',
    FORM_TYPE: 'form',

    UNIQUESS_NONE: 'none',
    UNIQUESS_FORM: 'form',
    UNIQUESS_HIERARCHY: 'hierarchy',

    //app ids namespace
    NAMESPACE_PREFIX: 'ec5_',

    //input types icons
    TEXT_TYPE_ICON: 'fa-text-width', //
    TEXTAREA_TYPE_ICON: 'fa-sticky-note-o',
    NUMERIC_TYPE_ICON: 'fa-hashtag',
    INTEGER_TYPE_ICON: 'fa-hashtag',
    DECIMAL_TYPE_ICON: 'fa-hashtag',
    DATE_TYPE_ICON: 'fa-calendar',
    TIME_TYPE_ICON: 'fa-clock-o',
    RADIO_TYPE_ICON: 'fa-dot-circle-o',
    README_TYPE_ICON: 'fa-file-text-o',
    CHECKBOX_TYPE_ICON: 'fa-check-square-o',
    DROPDOWN_TYPE_ICON: 'fa-caret-square-o-down',
    BARCODE_TYPE_ICON: 'fa-barcode',
    LOCATION_TYPE_ICON: 'fa-map-marker',
    AUDIO_TYPE_ICON: 'fa-microphone',
    VIDEO_TYPE_ICON: 'fa-video-camera',
    PHOTO_TYPE_ICON: 'fa-camera-retro',
    PHONE_TYPE_ICON: 'fa-phone',
    BRANCH_TYPE_ICON: 'fa-clone',
    GROUP_TYPE_ICON: 'fa-align-justify',
    SEARCH_SINGLE_TYPE_ICON: 'fa-search',
    SEARCH_MULTIPLE_TYPE_ICON: 'fa-search',

    //input types
    TEXT_TYPE: 'text', //
    TEXTAREA_TYPE: 'textarea',
    INTEGER_TYPE: 'integer',
    DECIMAL_TYPE: 'decimal',
    DATE_TYPE: 'date',
    TIME_TYPE: 'time',
    RADIO_TYPE: 'radio',
    CHECKBOX_TYPE: 'checkbox',
    DROPDOWN_TYPE: 'dropdown',
    BARCODE_TYPE: 'barcode',
    LOCATION_TYPE: 'location',
    AUDIO_TYPE: 'audio',
    VIDEO_TYPE: 'video',
    PHOTO_TYPE: 'photo',
    BRANCH_TYPE: 'branch',
    GROUP_TYPE: 'group',
    README_TYPE: 'readme',
    PHONE_TYPE: 'phone',
    SEARCH_SINGLE_TYPE: 'searchsingle',
    SEARCH_MULTIPLE_TYPE: 'searchmultiple',

    //date formats
    DATE_FORMAT_1: 'dd/MM/YYYY',
    DATE_FORMAT_2: 'MM/dd/YYYY',
    DATE_FORMAT_3: 'YYYY/MM/dd',
    DATE_FORMAT_4: 'MM/YYYY',
    DATE_FORMAT_5: 'dd/MM',

    //time formats
    TIME_FORMAT_1: 'HH:mm:ss',
    TIME_FORMAT_2: 'hh:mm:ss',
    TIME_FORMAT_3: 'HH:mm',
    TIME_FORMAT_4: 'hh:mm',
    TIME_FORMAT_5: 'mm:ss',

    //reserverd words/chars
    //RESERVED_WORD_SKIPP3D: '_skipp3d_',
    //PATH_SEPARATOR_MOBILE_CLIENT: '|',

    //input properties names
    DEFAULT_PROPERTY: 'default',
    QUESTION_PROPERTY: 'question',
    MIN_VALUE_PROPERTY: 'min',
    MAX_VALUE_PROPERTY: 'max',

    //button labels
    SHOW_JUMPS: 'Show jumps',
    HIDE_JUMPS: 'Hide jumps',
    JUMP_TO_END_OF_FORM_REF: 'END',
    JUMP_TO_END_OF_FORM_LABEL: 'End of form',

    //possible answers
    POSSIBILE_ANSWERS_CUSTOM_ID: 'pa_custom_id',
    POSSIBILE_ANSWER_PLACEHOLDER: 'I am a placeholder answer',
    USE_ANSWER_AS_TITLE: 'Use answer as title',
    MAX_TITLE_LIMIT_REACHED: 'Limit of 3 titles reached',

    //paths
    VIEWS_PATH: 'views/',

    //buttons status
    BTN_ENABLED: 'btn-enabled',
    BTN_DISABLED: 'btn-disabled',

    ENABLED_STATE: 'enabled',
    DISABLED_STATE: 'disabled',

    //action
    RENDER_ACTION_UNDO: 'undo',
    RENDER_ACTION_DO: 'do',
    RENDER_ACTION_VALIDATE: 'validate',

    //form export/import
    FORM_FILE_ACCEPTED_TYPE: 'application/json',
    FORM_FILE_EXTENSION: 'json',

    //possible answers csv import/export
    CSV_FILE_ACCEPTED_TYPES: ['text/csv', 'application/vnd.ms-excel'], //MIME types
    CSV_FILE_EXTENSION: 'csv'
};

//multiple answers types
consts.MULTIPLE_ANSWER_TYPES = [
    consts.RADIO_TYPE,
    consts.CHECKBOX_TYPE,
    consts.DROPDOWN_TYPE,
    consts.SEARCH_MULTIPLE_TYPE,
    consts.SEARCH_SINGLE_TYPE
];


consts.SINGLE_ANSWER_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.DATE_TYPE,
    consts.TIME_TYPE,
    consts.INTEGER_TYPE,
    consts.DECIMAL_TYPE,
    consts.BARCODE_TYPE,
    consts.README_TYPE,
    consts.PHONE_TYPE
];

//these types do not have the required/uniqueness option
consts.MEDIA_ANSWER_TYPES = [
    consts.AUDIO_TYPE,
    consts.PHOTO_TYPE,
    consts.VIDEO_TYPE,
    consts.LOCATION_TYPE
];

//types that have the verify option
consts.VERIFY_ALLOWED_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.INTEGER_TYPE,
    consts.DECIMAL_TYPE,
    consts.BARCODE_TYPE,
    consts.PHONE_TYPE
];

//types that have the uniquess option
consts.UNIQUENESS_ALLOWED_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.DATE_TYPE,
    consts.TIME_TYPE,
    consts.INTEGER_TYPE,//numeric
    consts.DECIMAL_TYPE,//numeric
    consts.BARCODE_TYPE,
    consts.PHONE_TYPE
];

//these types DO have the required option
consts.REQUIRED_ALLOWED_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.DATE_TYPE,
    consts.TIME_TYPE,
    consts.INTEGER_TYPE,
    consts.DECIMAL_TYPE,
    consts.BARCODE_TYPE,
    consts.PHONE_TYPE,
    consts.RADIO_TYPE,
    consts.CHECKBOX_TYPE,
    consts.DROPDOWN_TYPE,
    consts.SEARCH_MULTIPLE_TYPE,
    consts.SEARCH_SINGLE_TYPE
];


//jump conditions
consts.JUMP_CONDITIONS = [
    { key: 'NO_ANSWER_GIVEN', text: 'no answer given' },
    { key: 'IS', text: 'answer is' },
    { key: 'IS_NOT', text: 'answer is NOT' },
    { key: 'ALL', text: 'always' }
];

consts.LIMITS = {
    question_length: 255,
    readme_length: 1000,
    default_answer_length: 255,
    regex_length: 50,
    min_value_length: 50,
    max_value_length: 50,
    possible_answers_max: 300,
    possible_answers_max_search: 1000,
    titles_max: 3,
    max_states: 10,
    possible_answer_ref_length: 13,
    possible_answer_max_length: 150,
    possible_answers_per_page: 100,
    search_inputs_max: 5,
    question_preview_length: 80
};

consts.SUMMERNOTE_OPTIONS = {
    placeholder: 'Type here...',
    toolbar: [
        // [groupName, [list of button]]
        ['style', ['bold', 'italic', 'underline']]
    ]
};

consts.REGEX = {
    only_letters: '^[a-zA-Z]*$',
    only_digits: '^[0-9]+$',
    limit_length_20: '^.{1,20}$',
    possible_answer_ref: '^[a-zA-Z0-9]{13}$',
    input_ref: '^[a-zA-Z0-9-_]{60}$'
};

consts.README_ALLOWED_TAGS = [
    '<br>',
    '<p>',
    '<b>',
    '<strong>',
    '<i>',
    '<em>',
    '<u>'
];

consts.POSSIBLE_ANSWERS_ORDER = {
    AZ: 'az',
    ZA: 'za',
    SHUFFLE: 'shuffle'
};

module.exports = consts;
