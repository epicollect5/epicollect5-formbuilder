<template>
    <div class="builder__delete-question-message">
        <p class="ion-text-center">Are you sure you want to delete this question?</p>
        <BuilderNotice variant="warning" tag="p" class="ion-text-center">This action cannot be undone!</BuilderNotice>
        <BuilderNotice variant="danger" tag="p" class="ion-text-center"><strong>All data associated with this question will also be permanently deleted.</strong></BuilderNotice>
        <p class="ion-text-center">
            <a href="https://docs.epicollect.net/formbuilder/edit-inputs#delete-questions"
               target="_blank"
               rel="noopener noreferrer"><strong>Learn More</strong></a>
        </p>
    </div>
</template>

<script>
import BuilderNotice from '@/vue/components/BuilderNotice.vue';

/*
    The question-delete confirmation body: static warning markup, ported from
    the delete-question-modal-body.html view. The confirm button lives in the
    shared footer and runs the root store's captured delete action.
 */
export default {
    components: {
        BuilderNotice
    }
};
</script>

<style src="@/vue/theme/components/DeleteQuestionModalBody.scss" lang="scss"></style>
