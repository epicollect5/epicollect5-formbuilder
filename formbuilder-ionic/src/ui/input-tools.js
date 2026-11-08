'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {FORM_MESSAGES} from '@/config/strings.js';
import {isSearchType} from '@/models/possible-answers.js';
import {addInput, canAddInput, getSession, insertInput} from '@/services/session.js';
import {countProjectSearchInputs} from '@/models/project-limits.js';
import {notifyWarning} from '@/services/notifications.js';
import {parseView} from '@/ui/dom.js';
import tools_view from '@/views/tools.html?raw';
import {installToolDrag} from '@/ui/sortable.js';
import {recordChange} from '@/ui/state.js';
import {renderProperties, renderQuestions} from '@/ui/shell.js';

/* The tool catalogue is static markup; only the click and drag wiring changes. */
export const renderTools = () => {
    const container = document.getElementById('tools');

    if (!container) {
        return;
    }

    container.replaceChildren(parseView(tools_view));

    container.querySelectorAll('.builder__tool').forEach((tool) => {
        const type = tool.getAttribute('data-type');
        const allowed = canAddInput(type);

        // The legacy palette hides the tools a container cannot hold.
        tool.hidden = !allowed;
        tool.disabled = !allowed;

        tool.onclick = () => {
            addQuestion(type);
        };
    });

    installToolDrag('#tools .builder__tool', '#questions .builder__question-list', (type, index) => {
        if (!insertInput(type, index)) {
            return;
        }

        recordChange();
        renderQuestions();
        renderProperties();
    });
};

export const addQuestion = (type) => {
    if (!addInput(type)) {
        return;
    }

    recordChange();
    renderQuestions();
    renderProperties();

    // Legacy warns when the new question reaches the search cap.
    if (isSearchType(type) && countProjectSearchInputs(getSession().project_definition) >= PARAMETERS.SEARCH_INPUTS_MAX) {
        notifyWarning(FORM_MESSAGES.SEARCH_INPUTS_LIMIT_REACHED);
    }
};
