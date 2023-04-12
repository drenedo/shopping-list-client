<script lang="ts">
    import Modal from "sv-bootstrap-modal";
    import type { Receipt } from "../../types/receipts";
    import { createEventDispatcher } from "svelte";
    import { Error } from "../../util/error";
    import { Fetcher } from "../../util/fetch";

    export let receipt: Receipt;

    let dispatch = createEventDispatcher();
    let confirmIsOpen: boolean = false;

    function select(id:String){
        window.location.href = "/receipts/detail?id=" + receipt.id;
    }

    async function remove(){
        closeModal();
        await Fetcher.delete('/api/v1/receipts/' + receipt.id)
            .then(() => dispatch("remove"))
            .catch(err => Error.go(err));
    }

    function openModal(){
        confirmIsOpen = true;
    }

    function closeModal(){
        confirmIsOpen = false;
    }

</script>


<li class="list-group-item" on:click|stopPropagation={select} on:keydown|stopPropagation={select}>
    <div class="container">
        <div class="row">
            <div class="col-md-12 col-sm-12">
                <span class="h1">{receipt.site}</span>
                <span class="display-4 fw-bold float-end">{receipt.total.toFixed(2)}</span>
            </div>
        </div>
        <div class="row">
            <div class="col-md-10 col-sm-8">{receipt.created.toLocaleDateString()} {receipt.created.toLocaleTimeString()}</div>
            <div class="col-md-2 col-sm-4">
                <div class="d-flex justify-content-end">
                    {#if receipt.cash === true} 
                        <img src="/images/money.svg" alt="money" class="icon" />
                    {:else if receipt.cash === false}
                        <img src="/images/credit_card.svg" alt="credit_card" class="icon" />
                    {/if}
                    {#if receipt.lineNumber}
                        <img src="/images/lines.svg" alt="money" class="icon" />
                        <span class="line">{ receipt.lineNumber } </span>
                    {/if}
                    <button type="button" class="btn btn-danger" on:click|stopPropagation={openModal}><i class="bi-trash-fill fs-5"></i></button>
                </div>
            </div>
        </div>
    </div>
</li>

<Modal bind:open={confirmIsOpen}>
    <div class="modal-header">
        <h5 class="modal-title">Are you sure?</h5>
        <button type="button" class="btn-close" on:click={closeModal}>
        </button>
    </div>
    <div class="modal-body">
        <div class="p-3">You are going to delete the receipt from "{receipt.site}" with date {receipt.created.toLocaleDateString()}?</div>
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
    .icon {
        max-width: 40px;
    }
    .line {
        margin-left: -14px;
        margin-right: 9px;
    }
</style>