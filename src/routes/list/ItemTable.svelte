<script lang="ts">
    import { FullItem, ItemRequest } from '../../types/items';
    import Modal from "sv-bootstrap-modal";
    import AutoComplete from "simple-svelte-autocomplete";
	import Item from './Item.svelte';
    import { Fetcher } from "../../util/fetch";
    import { Error } from "../../util/error";

    export let items: Array<FullItem>;
    export let list: string;

    let name:string | null;
    let unit:string | null;
    let amount:number = 1;
    let brand:string | null;
    let loading:boolean = true;
    let modalIsOpen:boolean = false;

    let modalMessage: string | undefined;
    let shake: boolean = false;

    let textName: string | undefined;
    let textUnit: string | undefined;
    let textBrand: string | undefined;

    function openModal() {
        name = null;
        unit = null;
        amount = 1;
        brand = null;
        modalIsOpen = true;
        modalMessage = undefined;
        textName = undefined;
        textUnit = undefined;
        textBrand = undefined;
    }

    function closeModal() {
        modalIsOpen = false;
    }

    async function createItem() {
        const request = createAndValidateRequest();
        await Fetcher.put('/api/v1/items/' + request.id, request.toBody())
            .then(response => addItem(request))
            .catch(err => Error.go(err))
            .finally(closeModal);
    }

    async function searchTerm(text: string, selectedType: string) {
        const type = selectedType || 'P';
        return Fetcher.get('/api/v1/terms/search/' + text + '/type/' + type)
            .then((response) => response.json());
    }

    function createAndValidateRequest() {
        if(!name?.name && !textName){
            shakeModal("Name is mandatory");
            throw new Error(modalMessage);
        }
        return new ItemRequest(name?.name || textName, unit?.name || textUnit, amount, brand?.name || textBrand, list);
    }

    async function shakeModal(message: string){
        modalMessage = message;
        shake = true;
        setTimeout(function () { shake = false  }, 1200);
    }

    function addItem(request: ItemRequest) {
        modalIsOpen = false;
        items.push(new FullItem(request.id, request.name, request.amount, request.unit, request.brand, 'ACTIVE'));
        items = items;
    }

    function sumAmount(){
        amount = (!amount ? 0 : amount) + 1;
    }

    function restAmount(){
        const currentValue = (!amount ? 0 : amount);
        if(currentValue > 1){
            amount = currentValue - 1;
        }
    }

    function remove(item: FullItem){
        const itemRemove = items.find(i => i.id === item.id);
        const position = items.indexOf(itemRemove, 0);
        if (position > -1) {
            items.splice(position, 1);
        }
        items = items;
    }

    loading = false;
</script>

<div class="lists mw-100 w-100">
    <div class="d-flex flex-row-reverse bd-highlight">
        <button type="button" class="btn btn-primary" on:click={openModal}>Add new item</button>
    </div>
    <div class="d-flex justify-content-center">
    {#if items.length <= 0}
        <div>There are no items</div>
    {:else}
        <ul class="list-group mw-100 w-100">
            {#each items as item}
                <Item item={item} on:remove={() => remove(item)} />
            {/each}
        </ul>
    {/if}
    </div>
</div>

{#if !loading}
    <Modal bind:open={modalIsOpen}>
        <div class="modal-header">
            <h5 class="modal-title">Create new item</h5>
            <button type="button" class="btn-close" on:click={closeModal}>
            </button>
        </div>
        <div class="modal-body {shake ? 'shake' : ''}">
            {#if !modalMessage}
                <div class="p-3">Woohoo, you're creating a new item!</div>
            {:else}
                <div class="p-3 alert alert-danger">{modalMessage}</div>
            {/if}
            <div class="form-group">
                <form on:submit|preventDefault={createItem}>
                    <div class="p-1">
                        <label for="name">Name:</label>
                        <!-- input class="form-control" id="name" bind:value={name} -->
                        <div class="custom-autocomplete">
                            <AutoComplete className="custom-autocomplete" class="form-control" searchFunction={searchTerm} labelFieldName="name" bind:selectedItem={name} bind:text={textName} />
                        </div>
                    </div>
                    <div class="p-1">
                        <label for="unit-t">Unit:</label>
                        <!-- input class="form-control" id="unit" bind:value={unit} -->
                        <div class="custom-autocomplete">
                            <AutoComplete className="custom-autocomplete" class="form-control" searchFunction={t => searchTerm(t, 'U')} labelFieldName="name" bind:selectedItem={unit} bind:text={textUnit} />
                        </div>
                    </div>
                    <div class="p-1">
                        <label for="brand">Brand:</label>
                        <!-- input class="form-control" id="brand" bind:value={brand} -->
                        <div class="custom-autocomplete">
                            <AutoComplete className="custom-autocomplete" class="form-control" searchFunction={t => searchTerm(t, 'B')} labelFieldName="name" bind:selectedItem={brand} bind:text={textBrand} />
                        </div>
                    </div>
                    <div class="p-1">
                        <label for="amount">Amount:</label>
                        <div class="container">
                            <div class="row d-flex justify-content-center">
                                <div class="col-2"><button type="button" class="btn btn-secondary" on:click={restAmount}><i class="bi-dash-lg"></i></button></div>
                                <div class="col-5"><input type="tel" class="form-control" id="amount" bind:value={amount}></div>
                                <div class="col-2"><button type="button" class="btn btn-secondary" on:click={sumAmount}><i class="bi-plus-lg"></i></button></div>
                            </div>
                        </div>
                    </div>
                    <button class="d-none">GO</button>
                </form>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" on:click={closeModal}>Close</button>
            <button type="button" class="btn btn-primary" on:click={createItem}>Save changes</button>
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

    .custom-autocomplete > :global(.custom-autocomplete) {
        width: 100%;
    }
</style>