<script lang="ts">
    import Modal from "sv-bootstrap-modal";
    import { onMount } from "svelte";
    import { ListRequest, type List } from "../types/list";
    import Loading  from "./Loading.svelte";
	import ListItem from './ListItem.svelte';
    import { Fetcher } from "../util/fetch";
    import { Error } from "../util/error";

    const PAGE_SIZE = 15;
    
    let listIsOpen:boolean = false;
	let loading:boolean = true;
    let blockPartialLoad: boolean = false;
	let partialLoading:boolean = false;
    let lists:Array<List>;
    let name:string | null;
    let description:string | null;
    let error:string;

    let modalMessage: string | undefined;
    let shake: boolean = false;
    
    
    onMount(fetchInitial);

    async function fetchInitial() {
        Fetcher.get('/api/v1/lists/size/' + PAGE_SIZE)
            .then(response => {
                return response.json();
            })
            .then(loadData)
            .catch(err => {
                Error.go(err);});
    }

    function handleScroll(event: Event){
        let percent = (document.documentElement.scrollTop || document.body.scrollTop) / 
        ((document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight) * 100;
        if(percent > 80 && !partialLoading && !blockPartialLoad){
            partialLoading = true;
            fetchList(lists.at(-1)?.date.toISOString())
        }
    }

    function fetchList(date: string | undefined) {
        return Fetcher.get('/api/v1/lists/size/' + PAGE_SIZE + (date ? '?date-time='+date : ""))
            .then(response => {
                return response.json();
            }).then(addData)
            .catch(err => Error.go(err));
    }

    function addData(data:Array<any>){
        data.forEach(x => x.date = new Date(x.date));
        if(data && data.length > 0){
            lists = lists.concat(data as Array<List>);
        } else {
            blockPartialLoad = true;
        }
        partialLoading = false;
    }

    function loadData(data:Array<any>){
        loading = false;
        data.forEach(x => x.date = new Date(x.date));
        lists = data as Array<List>;
    }

    function closeModal() {
        listIsOpen = false;
    }

    function openModal() {
        name = null;
        description = null;
        listIsOpen = true;
    }

    function closeModalAndFetchLists() {
        closeModal();
        fetchInitial();
    }

    async function createList() {
        const request = getRequest();
        await Fetcher.put('/api/v1/lists/' + request.id, request.toBody())
            .then(response => console.log("Go to list!"))
            .catch(err => Error.go(err))
            .finally(closeModalAndFetchLists);
    }

    function getRequest(){
        if(!name){
            shakeModal("Name is mandatory");
            throw new Error(modalMessage);
        }
        if(!description){
            shakeModal("Description is mandatory");
            throw new Error(modalMessage);
        }
        return new ListRequest(name, description);
    }

    async function shakeModal(message: string){
        modalMessage = message;
        shake = true;
        setTimeout(function () { shake = false  }, 1200);
    }

</script>

<div class="lists mw-100 w-100">
    {#if loading}
        <Loading />
    {:else if error}
	    <div>{error}</div>
    {:else}
        <div class="d-flex flex-row-reverse bd-highlight gap-3 p-2">
            <button type="button" class="btn btn-primary" on:click={openModal}>Add new list</button>
        </div>
        <div class="d-flex justify-content-center">
            {#if lists.length <= 0}
                <div>There are no lists</div>
            {:else}
                <ul class="list-group mw-100 w-100">
                    {#each lists as list}
                        <ListItem list={list} on:remove={fetchInitial}/>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<!-- Modal window to create list-->

{#if !loading}
    <Modal bind:open={listIsOpen}>
        <div class="modal-header">
            <h5 class="modal-title">Create new list</h5>
            <button type="button" class="btn-close" on:click={closeModal}>
            </button>
        </div>
        <div class="modal-body {shake ? 'shake' : ''}">
            {#if !modalMessage}
                <div class="p-3">Woohoo, you're creating a new list!</div>
            {:else}
                <div class="p-3 alert alert-danger">{modalMessage}</div>
            {/if}
            <form on:submit|preventDefault={createList}>
                <div class="form-group">
                    <div class="p-1">
                        <label for="name">Name:</label>
                        <input class="form-control" id="name" bind:value={name}>
                    </div>
                    <div class="p-1">
                        <label for="description">Description:</label>
                        <input class="form-control" id="description" bind:value={description}>
                    </div>
                </div>
                <button class="d-none">GO</button>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" on:click={closeModal}>Close</button>
            <button type="button" class="btn btn-primary" on:click={createList}>Save changes</button>
        </div>
    </Modal>
{/if}


<style>
    .shake {
        animation: shake 1s; 
    }

    @keyframes shake{
        25%{transform:translateX(12px)}
        50%{transform:translateX(-12px)}
        75%{transform:translateX(12px)}
    }
</style>

<svelte:window on:scroll={handleScroll} />