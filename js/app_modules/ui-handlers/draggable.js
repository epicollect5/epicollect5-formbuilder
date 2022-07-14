'use strict';
var formbuilder = require('../config/formbuilder');
var draggable = function () {

    $('ul#inputs-tools-list li div.input').draggable({
        connectToSortable: '.sortable',
        //clone element keeping same width when dragging
        //mind: `evt` is jquery generated, it cannot be called anything else!
        helper: function (evt) {

            var event = evt || window.event;

            /*
             clone always the input wrapper, checking which element the user is actually dragging
             */
            if ($(event.target).prop('tagName') === 'SPAN' || $(event.target).prop('tagName') === 'I') {
                //dragging elements inside inner div
                return $(event.target).parent().parent().clone().css({
                    width: $(event.target).parent().width()

                });

            } else {
                //dragging inner div
                if ($(event.target).hasClass('input-inner')) {
                    return $(event.target).parent().clone().css({
                        width: $(event.target).width()
                    });

                }
                else {
                    //dragging outer div (input wrapper)
                    return $(event.target).clone().css({
                        width: $(event.target).width()
                    });
                }
            }
        },
        snap: false,
        //cursorAt: {left: '50%', top: '50%'}, get mouse x and y dinamically
        //handle: 'i',
        // cancel: 'i', //this stop the dragging over the icon, not good
        //better stop propagation on mousedown like
        // cursor: 'move', this keep the cursor 'move' after dropping, not good
        revert: 'invalid',
        revertDuration: 100,
        zIndex: 9999,
        appendTo: 'body',//append outside sortable to avoid flickering
        stop: function () {
            formbuilder.collection_is_being_sorted = false;


        },
        start: function (e, ui) {


            if ($(e.target).prop('tagName') === 'SPAN' || $(e.target).prop('tagName') === 'I') {
                $(this).width($(e.target).parent().width());
            } else {
                $(this).width($(e.target).width());
            }
            //keep track we are dragging from sidebar a new input to the input list
            formbuilder.collection_is_being_sorted = false;
        },
        scroll: true
    }).disableSelection();
};

module.exports = draggable;
