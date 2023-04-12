<script lang="ts">
    import { onMount } from "svelte";
    import { Fetcher } from "../../../util/fetch";
    import { Line, Receipt } from "../../../types/receipts";
    import { Error } from "../../../util/error";
	import Loading from "../../Loading.svelte";

    let id: string | null;
    let loading = true;
    let receipt: Receipt;
    let editMode : boolean = false;

    onMount(load);

    function load(){    
        const urlParams = new URLSearchParams(window.location.search);
        id = urlParams.get('id');
        fetchDetail();
    }

    function fetchDetail() {
        Fetcher.get('/api/v1/receipts/detail/' + id)
            .then(response => {
                return response.json();
            })
            .then(loadReceipt)
            .catch(err => Error.go(err));
    }

    function loadReceipt(data: any){
        loading = false;
        data.created = new Date(data.created);
        receipt = data as Receipt;
    }

    function edit() {
        editMode = true;
    }

    function save() {
        const newReceipt = new Receipt(receipt.id, receipt.text, receipt.site, receipt.total, 
        receipt.lines.map(l => new Line(l.id, l.name, l.amount, l.total)), receipt.created.toDateString(), receipt.cash, receipt.lineNumber);
        Fetcher.post('/api/v1/receipts/update', newReceipt.toBody())
            .catch(err => Error.go(err))
            .finally(() => editMode = false);
    }

    function recalculateTotal() {
        receipt.total = receipt.lines.reduce((sum, l) => sum + l.total, 0);
    }

</script>


<div>
    {#if loading}
        <Loading />
    {:else}
        <div class="d-flex flex-row-reverse bd-highlight gap-3 p-2">
            {#if editMode} 
                <button type="button" class="btn btn-warning" on:click={save}>Save receipt</button>
            {:else}
                <button type="button" class="btn btn-primary" on:click={edit}>Edit receipt</button>
            {/if}
        </div>
        <div>
            <div class="row">
                <div class="display-5 col-md-9" >
                    {#if editMode} <input id="site" bind:value={receipt.site}> {:else} {receipt.site} {/if}
                </div>
                <span class="display-4 fw-bold col-md-3">
                    <div class="d-flex justify-content-center">
                    {#if receipt.cash === true} 
                        <img src="/images/money.svg" alt="money" class="icon float-start" />
                    {:else if receipt.cash === false}
                        <img src="/images/credit_card.svg" alt="credit_card" class="icon" />
                    {/if}
                    {#if editMode && (!receipt.lines || receipt.lines.length == 0)} 
                        <input id="total" class="total-input" type="number" step=".01" bind:value={receipt.total}> 
                    {:else} 
                        {receipt.total} 
                    {/if}
                    </div>
                </span>
            </div>
            
        </div>
        <div class="col-md-10 col-sm-8">{receipt.created.toLocaleDateString()} {receipt.created.toLocaleTimeString()}</div>
        <ul class="list-group mw-100 w-100">
            {#each receipt.lines as line}
            <li class="list-group-item">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12 col-sm-8 container row">
                            <div class="display-6 col-md-9 row">
                                <div class="col-md-2">
                                    {#if editMode} <input class="input-width-adjust" type="number" bind:value={line.amount}> {:else} {line.amount || 1} {/if}
                                </div>
                                <div class="col-md-9">
                                    {#if editMode} <input class="input-width-adjust" bind:value={line.name}> {:else} {line.name} {/if}
                                </div>
                            </div>
                            <div class="display-4 col-md-3 d-flex justify-content-end">
                            {#if editMode} 
                                <input class="input-width-adjust" type="number" step=".01" on:change={recalculateTotal} bind:value={line.total}> 
                            {:else}
                                {line.total.toFixed(2)}
                            {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </li>
            {/each}
        </ul>
    {/if}
</div>


<style>
    .icon {
        max-width: 50px;
    }
    .total-margin {
        margin-right: 101px;
    }
    .total-input {
        max-width: 137px;
    }
    .input-width-adjust {
        max-width: 100%;
    }
</style>