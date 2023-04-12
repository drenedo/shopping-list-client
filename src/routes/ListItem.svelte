<script lang="ts">
    import Modal from "sv-bootstrap-modal";
    import type { List } from "../types/list";
    import { createEventDispatcher } from "svelte";
    import { Fetcher } from "../util/fetch";
    import { Error } from "../util/error";

    let dispatch = createEventDispatcher();

    export let list:List;

    let confirmIsOpen:boolean = false;

    function select(id:String){
        window.location.href = "/list?id=" + id;
    }

    function tryToRemove(){
        confirmIsOpen = true;
    }

    async function remove(){
        await Fetcher.delete('/api/v1/lists/' + list.id)
            .then(() => dispatch("remove"))
            .catch(err => Error.go(err));
    }

    function markAsInactive(){
        submitStatus('INACTIVE');
    }

    function markAsActive(){
        submitStatus('ACTIVE');
    }

    function closeModal() {
        confirmIsOpen = false;
    }


    async function submitStatus(temporalStatus: string){
        await Fetcher.post('/api/v1/lists/' + list.id + '/status/' + temporalStatus)
        .then(response => {
            list.status = temporalStatus;
        })
        .catch(err => Error.go(err))
    }
</script>

<li class="list-group-item" on:click|stopPropagation={() => select(list.id)} on:keydown|stopPropagation={() => console.log("do nothing")}>
    <div class="container">
        <div class="row">
            <div class="col-md-10 col-sm-8 container">
            {#if list.status === 'ACTIVE'} 
                <div class="row justify-content-center">
                    <div class="display-4 col-md-9">{list.name}</div>
                    <div class="align-middle col-md-3">{list.date.toLocaleString()}</div>
                </div>
            {:else}
                <div class="row justify-content-center">
                    <div class="display-4 col-md-9"><del>{list.name}</del></div>
                    <div class="align-middle col-md-3">{list.date.toLocaleString()}</div>
                </div>
            {/if}
            </div>
            <div class="col-md-2 col-sm-4">
                <div class="d-flex justify-content-end">
                    {#if list.status === 'ACTIVE'} 
                        <button type="button" class="btn btn-info" on:click|stopPropagation={markAsInactive}><i class="bi-bag-check-fill fs-5"></i></button>
                    {:else}
                        <button type="button" class="btn btn-warning" on:click|stopPropagation={markAsActive}><i class="bi-bag-x-fill fs-5"></i></button>
                    {/if}
                    <button type="button" class="btn btn-danger" on:click|stopPropagation={tryToRemove}><i class="bi-trash-fill fs-5"></i></button>
                </div>
            </div>
        </div>
        <div>{list.description}</div>
    </div>
</li>

<Modal bind:open={confirmIsOpen}>
    <div class="modal-header">
        <h5 class="modal-title">Are you sure?</h5>
        <button type="button" class="btn-close" on:click={closeModal}>
        </button>
    </div>
    <div class="modal-body">
        <div class="p-3">You are going to delete the list called "{list.name}", are you sure?</div>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={closeModal}>No!</button>
        <button type="button" class="btn btn-primary" on:click={remove}>Yes, sure!</button>
    </div>
</Modal>


<style>
    .list-group-item {
        cursor: pointer;
    }
</style>