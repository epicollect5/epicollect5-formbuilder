'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var utils = {

    //from MDN
    JSONPolyfill: {
        parse: function (sJSON) {
            return eval('(' + sJSON + ')');
        },
        stringify: (function () {
            var toString = Object.prototype.toString;
            var isArray = Array.isArray || function (a) {
                return toString.call(a) === '[object Array]';
            };
            var escMap = {
                '"': '\\"',
                '\\': '\\\\',
                '\b': '\\b',
                '\f': '\\f',
                '\n': '\\n',
                '\r': '\\r',
                '\t': '\\t'
            };
            var escFunc = function (m) {
                return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);
            };
            var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
            return function stringify(value) {
                if (value == null) {
                    return 'null';
                } else if (typeof value === 'number') {
                    return isFinite(value) ? value.toString() : 'null';
                } else if (typeof value === 'boolean') {
                    return value.toString();
                } else if (typeof value === 'object') {
                    if (typeof value.toJSON === 'function') {
                        return stringify(value.toJSON());
                    } else if (isArray(value)) {
                        var res = '[';
                        for (var i = 0; i < value.length; i++)
                            res += (i ? ', ' : '') + stringify(value[i]);
                        return res + ']';
                    } else if (toString.call(value) === '[object Object]') {
                        var tmp = [];
                        for (var k in value) {
                            if (value.hasOwnProperty(k))
                                tmp.push(stringify(k) + ': ' + stringify(value[k]));
                        }
                        return '{' + tmp.join(', ') + '}';
                    }
                }
                return '"' + value.toString().replace(escRE, escFunc) + '"';
            };
        })()
    },
    //https://goo.gl/x4jcS
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) {
        return p.toString() === '[object SafariRemoteNotification]';
    })(!window.safari || safari.pushNotification),

    getContainersPath: function () {
        return consts.VIEWS_PATH + 'containers/';
    },

    getPropertiesPath: function () {
        return consts.VIEWS_PATH + 'properties/';
    },

    getPartialsPath: function () {
        return consts.VIEWS_PATH + 'partials/';
    },

    //go back to project details page (when inside Epicollect5 Laravel)
    goBack: function () {

        var href = window.location.href;
        //both http and https
        var protocol = window.location.protocol;
        var parts = href.replace(protocol + '//', '').split('/');
        var last = parts.pop();
        var back_href = parts.join('/');

        //standalone mode for testing from localhost?
        if (last.indexOf('formbuilder') !== -1) {
            window.location.replace(protocol + '//' + back_href);
        }
        else {
            return false;
        }
    },

    //project_ref is defined on the server, and it is unique server wise
    setProjectURL: function () {

        var domain;
        var path;
        var slug;
        var href = window.location.href;
        var protocol = window.location.protocol;
        var parts = href.replace(protocol + '//', '').split('/');
        var subpath;

        console.log('parts[0]', parts[0]);

        //standalone mode for testing from localhost?
        if (parts[0].indexOf('localhost') !== -1 || parts[0].indexOf('ngrok')) {

            //is standalone formbuilder?
            if (parts.indexOf('epicollect5-formbuilder') !== -1) {
                buildLocalPath();//testing locally, copying the json into project.json
            }
            else {
                //it is a local installation of Laravel
                buildLaravelPath();
            }
        }
        else {
            //laravel server
            buildLaravelPath();
            console.log(consts.PROJECT_URL);
        }

        function buildLaravelPath() {

            slug = parts[parts.length - 2];
            parts.splice(parts.length - 3, 3);
            domain = protocol + '//' + parts.join('/') + '/';

            path = consts.API_PRODUCTION_PATH;
            consts.PROJECT_URL = domain + path + slug;

            //do this for Laravel integration
            //remove domain (first element)
            parts.shift();
            if (parts.length > 0) {
                subpath = parts.join('/');
                consts.VIEWS_PATH = '/' + subpath + '/' + consts.VIEWS_PATH;
            }
            else {
                consts.VIEWS_PATH = '/' + consts.VIEWS_PATH;
            }
        }

        function buildLocalPath() {
            consts.PROJECT_URL = consts.API_DEVELOPMENT_GET_PATH + consts.API_DEVELOPMENT_PROJECT;
        }
    },

    setProjectLogoUrl: function () {
        console.log('href =>' + window.location.href);
        var domain;
        var path;
        var slug;
        var href = window.location.href;
        var protocol = window.location.protocol;
        var parts = href.replace(protocol + '//', '').split('/');

        slug = parts[parts.length - 2];
        parts.splice(parts.length - 3, 3);
        domain = window.location.protocol + '//' + parts.join('/') + '/';

        path = consts.API_MEDIA_PATH;
        consts.PROJECT_LOGO_URL = domain + path + slug + consts.API_PROJECT_LOGO_QUERY_STRING;


        console.log(consts.PROJECT_LOGO_URL);
    },

    //we generate the refs appending a uniqid per each level
    //form - input - branch_input - group_input
    generateFormRef: function () {
        return formbuilder.project_definition.data.project.ref + '_' + this.generateUniqID();
    },

    //input ref consists of form_ref + input_ref
    generateInputRef: function (form_ref) {
        return form_ref + '_' + this.generateUniqID();
    },

    generateInputCopyRef: function () {

        var ref;
        //top level input?
        if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
            ref = utils.generateInputRef(formbuilder.current_form_ref);
        }
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //generate nested group input ref (passing active branch input ref)
            ref = utils.generateBranchGroupInputRef(formbuilder.branch.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //generated branch input ref
                ref = utils.generateBranchGroupInputRef(formbuilder.branch.active_branch_ref);
            }
            if (formbuilder.is_editing_group) {
                //generate group ref
                ref = utils.generateBranchGroupInputRef(formbuilder.group.active_group_ref);
            }
        }
        return ref;
    },

    //for branch and groups, we append the unique ID to the input (nesting a level more)
    //a nested group will be 2 levels nested
    generateBranchGroupInputRef: function (input_ref) {
        return input_ref + '_' + this.generateUniqID();
    },
    //generate PHP type uniqid to be appended to form, inputs, branch and groups
    generateUniqID: function (prefix, more_entropy) {
        if (typeof prefix === 'undefined') {
            prefix = '';
        }

        var retId;
        var formatSeed = function (seed, reqWidth) {
            seed = parseInt(seed, 10)
                .toString(16); // to hex str
            if (reqWidth < seed.length) {
                // so long we split
                return seed.slice(seed.length - reqWidth);
            }
            if (reqWidth > seed.length) {
                // so short we pad
                return Array(1 + (reqWidth - seed.length))
                    .join('0') + seed;
            }
            return seed;
        };

        // BEGIN REDUNDANT
        if (!this.php_js) {
            this.php_js = {};
        }
        // END REDUNDANT
        if (!this.php_js.uniqidSeed) {
            // init seed with big random int
            this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
        }
        this.php_js.uniqidSeed++;

        // start with prefix, add current milliseconds hex string
        retId = prefix;
        retId += formatSeed(parseInt(new Date()
            .getTime() / 1000, 10), 8);
        // add seed hex string
        retId += formatSeed(this.php_js.uniqidSeed, 5);
        if (more_entropy) {
            // for more entropy we add a float lower to 10
            retId += (Math.random() * 10)
                .toFixed(8)
                .toString();
        }

        return retId;
    },

    //find duplicates in array
    hasDuplicates: function (array) {
        var valuesSoFar = [];
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (valuesSoFar.indexOf(value) !== -1) {
                return true;
            }
            valuesSoFar.push(value);
        }
        return false;
    },

    getInputCurrentIndexByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var i;
        var iLength = inputs.length;

        for (i = 0; i < iLength; i++) {
            if (inputs[i].ref === the_ref) {
                return i;
            }
        }
    },

    getBranchInputCurrentIndexByRef: function (the_owner_input_index, the_branch_input_ref) {

        var branch_inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[the_owner_input_index].branch;
        var found = -1;

        $(branch_inputs).each(function (index, branch_input) {
            if (branch_input.ref === the_branch_input_ref) {
                found = index;
                return false;
            }
        });
        return found;
    },

    getGroupInputCurrentIndexByRef: function (the_owner_input_index, the_group_input_ref) {

        var group_inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[the_owner_input_index].group;
        var found = -1;

        $(group_inputs).each(function (index, branch_input) {
            if (branch_input.ref === the_group_input_ref) {
                found = index;
                return false;
            }
        });
        return found;
    },

    getInputObjectByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var i;
        var iLength = inputs.length;

        if (the_ref === undefined) {
            return false;
        }

        for (i = 0; i < iLength; i++) {
            if (inputs[i].ref === the_ref) {
                return inputs[i];
            }
        }

    },

    getBranchInputObjectByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var branch_inputs = inputs[owner_input_index].branch;
        var found;

        if (the_ref !== undefined) {

            $(branch_inputs).each(function (index, input) {
                if (input.ref === the_ref) {
                    found = input;
                    return false;
                }
            });
        }

        return found;
    },

    getNestedGroupInputObjectByRef: function (the_owner_branch, the_current_nested_group_input_ref) {

        var ref = the_current_nested_group_input_ref;
        var owner_branch = the_owner_branch;
        var owner_group_ref = formbuilder.group.active_group_ref;

        var found;

        $(owner_branch.branch).each(function (index, branch_input) {

            //get the nested group
            if (branch_input.ref === owner_group_ref) {

                //for each nested group inputs, look for the one we are looking for
                $(branch_input.group).each(function (index, nested_group_input) {

                    if (nested_group_input.ref === ref) {
                        found = nested_group_input;
                        return false;
                    }
                });

                if (found) {
                    return false;
                }
            }
        });
        return found;
    },

    getNestedGroupInputCurrentIndexByRef: function (the_owner_branch, the_current_nested_group_input_ref) {

        var ref = the_current_nested_group_input_ref;
        var owner_branch = the_owner_branch;
        var owner_group_ref = formbuilder.group.active_group_ref;

        var found;

        $(owner_branch.branch).each(function (index, branch_input) {

            //get the nested group
            if (branch_input.ref === owner_group_ref) {

                //for each nested group inputs, look for the one we are looking for
                $(branch_input.group).each(function (group_index, nested_group_input) {

                    if (nested_group_input.ref === ref) {
                        found = group_index;
                        return false;
                    }
                });

                if (found) {
                    return false;
                }
            }
        });
        return found;
    },

    getGroupInputObjectByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var group_inputs = inputs[owner_input_index].group;
        var found;

        if (the_ref !== undefined) {

            $(group_inputs).each(function (index, input) {
                if (input.ref === the_ref) {
                    found = input;
                    return false;
                }
            });
        }

        return found;
    },

    getNestedGroupObjectByRef: function (owner_branch, nested_group_ref) {

        var found;

        $(owner_branch.branch).each(function (index, branch_input) {

            //get the nested group
            if (branch_input.ref === nested_group_ref) {
                found = branch_input;
                return false;
            }
        });

        return found;
    },

    //passing in a branch input ref, removing the last `_uniqid` we have the input ref that branch belong to
    getBranchOwnerInputRef: function (the_branch_input_ref) {

        var parts = the_branch_input_ref.split('_');

        parts.pop();

        return parts.join('_');
    },

    //passing in a group input ref, removing the last `_uniqid` we have the input ref that group belong to
    getGroupOwnerInputRef: function (the_group_input_ref) {

        var parts = the_group_input_ref.split('_');

        parts.pop();

        return parts.join('_');
    },

    getInputToolIcon: function (the_type) {

        var icon;

        switch (the_type) {
            case consts.AUDIO_TYPE:
                icon = consts.AUDIO_TYPE_ICON;
                break;
            case consts.BARCODE_TYPE:
                icon = consts.BARCODE_TYPE_ICON;
                break;
            case consts.BRANCH_TYPE:
                icon = consts.BRANCH_TYPE_ICON;
                break;
            case consts.CHECKBOX_TYPE:
                icon = consts.CHECKBOX_TYPE_ICON;
                break;
            case consts.DATE_TYPE:
                icon = consts.DATE_TYPE_ICON;
                break;
            case consts.DROPDOWN_TYPE:
                icon = consts.DROPDOWN_TYPE_ICON;
                break;
            case consts.GROUP_TYPE:
                icon = consts.GROUP_TYPE_ICON;
                break;
            case consts.LOCATION_TYPE:
                icon = consts.LOCATION_TYPE_ICON;
                break;
            case consts.INTEGER_TYPE:
                icon = consts.NUMERIC_TYPE_ICON;
                break;
            case consts.DECIMAL_TYPE:
                icon = consts.NUMERIC_TYPE_ICON;
                break;
            case consts.PHONE_TYPE:
                icon = consts.PHONE_TYPE_ICON;
                break;
            case consts.PHOTO_TYPE:
                icon = consts.PHOTO_TYPE_ICON;
                break;
            case consts.RADIO_TYPE:
                icon = consts.RADIO_TYPE_ICON;
                break;
            case consts.README_TYPE:
                icon = consts.README_TYPE_ICON;
                break;
            case consts.TEXT_TYPE:
                icon = consts.TEXT_TYPE_ICON;
                break;
            case consts.TEXTAREA_TYPE:
                icon = consts.TEXTAREA_TYPE_ICON;
                break;
            case consts.TIME_TYPE:
                icon = consts.TIME_TYPE_ICON;
                break;
            case consts.VIDEO_TYPE:
                icon = consts.VIDEO_TYPE_ICON;
                break;
            case consts.SEARCH_SINGLE_TYPE:
                icon = consts.SEARCH_SINGLE_TYPE_ICON;
                break;
            case consts.SEARCH_MULTIPLE_TYPE:
                icon = consts.SEARCH_MULTIPLE_TYPE_ICON;
                break;
        }
        return icon;
    },

    slugify: function (text) {

        var trimmed = $.trim(text);
        var $slug = trimmed.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return $slug.toLowerCase();
    },

    //get total inputs downo to al levels: counting also nested branch inputs and group inputs
    getInputsTotal: function (inputs) {

        var total = 0;

        total += inputs.length;

        $(inputs).each(function (index, input) {
            if (input.type === consts.GROUP_TYPE) {
                total += input.group.length;
            }
            if (input.type === consts.BRANCH_TYPE) {
                total += input.branch.length;

                //todo count nested group inputs!
                //todo
            }
        });
        return total;
    },
    //get total inputs down to all levels: counting also nested branch inputs and group inputs
    getSearchInputsTotal: function () {

        var total = 0;
        var forms = formbuilder.project_definition.data.project.forms;

        $(forms).each(function (formIndex, form) {

            $(form.inputs).each(function (inputIndex, input) {
                //count all search input types
                if (input.type === consts.SEARCH_MULTIPLE_TYPE || input.type === consts.SEARCH_SINGLE_TYPE) {
                    total++;
                }

                if (input.type === consts.GROUP_TYPE) {
                    //count all search input types of a group
                    $(input.group).each(function (groupIndex, groupInput) {
                        if (groupInput.type === consts.SEARCH_MULTIPLE_TYPE || groupInput.type === consts.SEARCH_SINGLE_TYPE) {
                            total++;
                        }
                    });
                }

                if (input.type === consts.BRANCH_TYPE) {
                    //count all search input types of a branch
                    $(input.branch).each(function (branchIndex, branchInput) {
                        if (branchInput.type === consts.SEARCH_MULTIPLE_TYPE || branchInput.type === consts.SEARCH_SINGLE_TYPE) {
                            total++;
                        }
                        //nested group?
                        if (branchInput.type === consts.GROUP_TYPE) {
                            $(branchInput.group).each(function (groupIndex, groupInput) {
                                if (groupInput.type === consts.SEARCH_MULTIPLE_TYPE || groupInput.type === consts.SEARCH_SINGLE_TYPE) {
                                    total++;
                                }
                            });
                        }
                    });
                }
            });
        });

        return total;
    },
    //jump destinations: cannot jump on the next one, but always next + 1
    getJumpAvailableDestinations: function (input, inputs) {

        var current_input_index;
        var owner_input_index;
        var destinations = [];
        var available_inputs;

        if (formbuilder.is_editing_branch) {
            owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.branch.active_branch_ref);
            current_input_index = utils.getBranchInputCurrentIndexByRef(owner_input_index, input.ref);
        }
        else {
            current_input_index = utils.getInputCurrentIndexByRef(input.ref);
        }

        available_inputs = inputs.slice(current_input_index + 2);

        $(available_inputs).each(function (index, input) {
            destinations.push({
                ref: input.ref,
                question: input.question,
                type: input.type
            });
        });

        //add "End of form" as an available destination
        destinations.push({
            ref: consts.JUMP_TO_END_OF_FORM_REF,
            question: consts.JUMP_TO_END_OF_FORM_LABEL,
            type: null
        });


        return destinations;
    },

    //jump destinations object: for quicker look ups, this is for extra validation on "save"
    getJumpAvailableDestinationsAsKeys: function (current_input_index, input, inputs) {

        var destinations = {};
        var available_inputs;

        available_inputs = inputs.slice(current_input_index + 2);

        //fill with available inputs refs as keys
        $(available_inputs).each(function (index, input) {
            destinations[input.ref] = 1;
        });
        //add "End of form" as an available destination
        destinations[consts.JUMP_TO_END_OF_FORM_REF] = 1;

        return destinations;
    },

    //return true when the value is less or equal to max title
    isMaxTitleLimitReached: function (inputs) {
        return this.getTitleCount(inputs) >= consts.LIMITS.titles_max;
    },
    //return true when the value exceeds max title
    isMaxTitleLimitExceeded: function (inputs) {
        return this.getTitleCount(inputs) > consts.LIMITS.titles_max;
    },

    getTitleCount: function (inputs) {

        var count = 0;

        $(inputs).each(function (index, input) {
            if (input.is_title) {
                count++;
            }
            //loop all group inputs as they count towards the limit
            if (input.type === consts.GROUP_TYPE) {
                $(input.group).each(function (index, group_input) {
                    if (group_input.is_title) {
                        count++;
                    }
                });
            }
        });
        return count;
    },
    //from http://goo.gl/D7FxG0
    //  //convert html tags to html entities
    encodeHtml: function (str) {
        return str.replace(/[&<>"']/g, function ($0) {
            /* jshint ignore:start */
            // jscs:disable
            return "&" + {
                "&": "amp",
                "<": "lt",
                ">": "gt",
                '"': "quot",
                "'": "#39"
            }[$0] + ";";
            /* jshint ignore:end */
            // jscs:enable
        });
    },

    //from http://goo.gl/htCroU
    decodeHtml: function (html) {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    },

    getPossibleAnswerLabel: function (input) {
        var label = '';
        $(input.possible_answers).each(function (answer_index, answer) {
            if (answer.answer_ref === input.default) {
                label = answer.answer;
            }
        });
        return label;
    },
    /**
     * @param validSource: the valid obj structure
     * @param wannaBe: the obj structure to validate
     * @param strict: whether the type must be the same
     * @returns {boolean}
     * Compare properties of objects (only keys: wannaBe must have the same keys, in any order. Values don't matter, they are check separately)
     * we do check for the same nested properties when an object {} but arrays must be arrays []
     */
    hasSameProps: function (validSource, wannaBe, strict) {

        var self = this;

        //false when wannabe property is an array but validSource is not
        if (typeof validSource === 'object' && Array.isArray(wannaBe)) {
            return false;
        }

        //check for wannaBe overlapping props
        if (!Object.keys(wannaBe).every(function (key) {
            return validSource.hasOwnProperty(key);
        })) {
            // console.log('wannaBe has extra keys')
            return false;
        }

        //check every key for being same
        return Object.keys(validSource).every(function (key) {
            //if object
            if (typeof validSource[key] === 'object' && typeof wannaBe[key] === 'object' && validSource[key] !== null && wannaBe[key] !== null) {

                //check array is array
                if (Array.isArray(validSource[key])) {
                    //console.log('must be array key: ' + key);
                    return Array.isArray(wannaBe[key]);
                } else {
                    //recursively check nested object
                    return self.hasSameProps(validSource[key], wannaBe[key]);
                }

            } else {
                //check every key is present in the wanna be object
                if (wannaBe[key] === undefined) {
                    // console.log('wannaBe does not have key:' + key)
                    return false;
                }

                //check the type of value is the same (not the actual value, which can be different)
                if (strict) {
                    if (typeof validSource[key] !== typeof wannaBe[key]) {
                        //console.log('wannaBe type is wrong for key: ' + key)
                        return false;
                    }
                }

                return true;
            }
        });
    },
    //from MDN https://goo.gl/vOhzta
    isInteger: function (value) {
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
    },

    getActiveInput: function () {

        var self = this;
        var input;
        var current_branch;
        var current_input_ref = formbuilder.current_input_ref;

        //get current input object based on editing state:

        //nested group?
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get nested group input
            current_branch = self.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = self.getNestedGroupInputObjectByRef(current_branch, formbuilder.group.current_input_ref);
        }

        //branch input
        if (formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
            //get branch input
            input = self.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        }

        //group input?
        if (!formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get group input
            input = self.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }

        //top level input?
        if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
            //get input
            input = self.getInputObjectByRef(current_input_ref);
        }

        return input;
    },
    /// Replaces commonly-used Windows 1252 encoded chars that do not exist in ASCII or ISO-8859-1 with ISO-8859-1 cognates.
    replaceWordChars: function (text) {
        var s = text;
        // smart single quotes and apostrophe
        s = s.replace(/[\u2018\u2019\u201A]/g, "\'");
        // smart double quotes
        s = s.replace(/[\u201C\u201D\u201E]/g, '\"');
        // ellipsis
        s = s.replace(/\u2026/g, '...');
        // dashes
        s = s.replace(/[\u2013\u2014]/g, '-');
        // circumflex
        s = s.replace(/\u02C6/g, '^');
        // open angle bracket
        s = s.replace(/\u2039/g, ' ');
        // close angle bracket
        s = s.replace(/\u203A/g, ' ');
        // spaces
        s = s.replace(/[\u02DC\u00A0]/g, ' ');

        //remove invalid chars
        s = s.replace(/\uFFFD/g, ' ');

        return s;
    },

    getCurrentlySelectedInput: function () {

        var self = this;
        var input = self.getInputObjectByRef(formbuilder.current_input_ref);
        var owner_branch;

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get nested group input
            owner_branch = self.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = self.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //get selected branch input
                input = self.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
            }

            if (formbuilder.is_editing_group) {
                //get selected group input
                input = self.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
            }
        }

        return input;
    },
    //http://locutus.io/php/strings/strip_tags/
    stripTags: function (input, allowed) {
        allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
        })
    },
    //replace all occurences of 'needle' in string
    replaceAllOccurrences: function (string, needle, replacement) {
        return string.replace(new RegExp(needle, 'g'), replacement);
    },

    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    shuffleArray: function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
};

module.exports = utils;
