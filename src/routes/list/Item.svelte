<script lang="ts">
    import type { FullItem } from '../../types/items';
    import { createEventDispatcher } from "svelte";
    import { Fetcher } from "../../util/fetch";
    import { Error } from "../../util/error";

    export let item: FullItem;
    
    let dispatch = createEventDispatcher();

    const CANCELED = 'CANCELED';
    const ACTIVE = 'ACTIVE';
    const INACTIVE = 'INACTIVE';

     function select(){
        if(item.status != CANCELED){
            const temporalStatus = item.status === ACTIVE ? INACTIVE : ACTIVE;
            submitStatus(temporalStatus);
        }
    }

    async function remove(){
        await Fetcher.delete('/api/v1/items/' + item.id)
            .then(() => dispatch("remove"))
            .catch(err => Error.go(err));
    }

    function cancel(){
        submitStatus(CANCELED);
    }

    function active(){
        submitStatus(ACTIVE);
    }

    async function submitStatus(temporalStatus: string){
        await Fetcher.post('/api/v1/items/' + item.id + '/status/' + temporalStatus).then(response => {
            const status = temporalStatus;
            item.status = status;
        })
        .catch(err => Error.go(err))
    }
</script>


<li class="list-group-item" on:click|stopPropagation={select} on:keydown|stopPropagation={select}>
    <div class="container">
        <div class="row">
            <div class="col-md-10 col-sm-8">
            {#if item.status === 'ACTIVE'}
                <span class="display-4 fw-bold">{item.amount}</span>
                <span class="display-5">{item.unit || ""}</span>
                <span class="display-6">of</span>
                <span class="display-6 fw-bold">{item.name}</span>
                <span class="display-5">{item.brand || ""}</span>
            {:else if item.status === 'CANCELED'}
                <span class="display-6 text-danger"><del>{item.amount} {item.unit || ""} of {item.name} {item.brand || ""}</del></span>
            {:else}
                <span class="display-6"><del>{item.amount} {item.unit || ""} of {item.name} {item.brand || ""}</del></span>
            {/if}
            </div>
            <div class="col-md-2 col-sm-4">
                <div class="d-flex justify-content-end">
                    {#if item.status !== CANCELED}
                        <button type="button" class="btn btn-warning" on:click|stopPropagation={cancel}><i class="bi-x fs-5"></i></button>
                    {:else}
                        <button type="button" class="btn btn-primary" on:click|stopPropagation={active}><i class="bi-arrow-clockwise fs-5"></i></button>
                    {/if}
                    <button type="button" class="btn btn-danger" on:click|stopPropagation={remove}><i class="bi-trash-fill fs-5"></i></button>
                </div>
            </div>
        </div>
    </div>
</li>


<style>
    .list-group-item {
        cursor: pointer;
    }
</style>