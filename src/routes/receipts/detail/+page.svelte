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
        receipt.lines.map(l => new Line(l.id, l.name, l.amount, l.total)), receipt.created.toDateString(), receipt.cash, receipt.lineNumber, receipt.category);
        Fetcher.post('/api/v1/receipts/update', newReceipt.toBody())
            .catch(err => Error.go(err))
            .finally(() => editMode = false);
    }

    function recalculateTotal() {
        receipt.total = receipt.lines.reduce((sum, l) => sum + l.total, 0);
    }

    function deleteLine(line: Line) {
        const index = receipt.lines.indexOf(line, 0);
        if (index > -1) {
            receipt.lines.splice(index, 1);
        }
        receipt.lines = receipt.lines;
        recalculateTotal();
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
        <div class="container">
            <div class="row">
                <div class="display-5 col-sm-9 col-12" >
                    {#if editMode} <input class="input-width-adjust" id="site" bind:value={receipt.site}> {:else} {receipt.site} {/if}
                </div>
                <div class="display-4 fw-bold col-sm-3 col-12">
                    <div class="d-flex align-items-end">
                        {#if !editMode}
                            <img src="/images/{receipt.category?.toLowerCase() || 'other'}.png" alt="{receipt.category?.toLowerCase() || 'other'}" class="icon float-start" />
                            {#if receipt.cash === true} 
                                <img src="/images/money.svg" alt="money" class="icon float-start" />
                            {:else if receipt.cash === false}
                                <img src="/images/credit_card.svg" alt="credit_card" class="icon" />
                            {/if}
                            {/if}
                        {#if editMode && (!receipt.lines || receipt.lines.length == 0)} 
                            <input id="total" class="total-input" type="number" step=".01" bind:value={receipt.total}> 
                        {:else} 
                            <span>{receipt.total.toFixed(2)}</span>
                        {/if}
                    </div>
                </div>
                {#if editMode}
                    <div class="col-5">
                        <img src="/images/money.svg" alt="money" class="icon {receipt.cash ? 'selected' : ''}" on:click={() => receipt.cash = true} on:keydown={() => receipt.cash = true} />
                        <img src="/images/credit_card.svg" alt="credit_card" class="icon {receipt.cash === false ? 'selected' : ''}" on:click={() => receipt.cash = false} on:keydown={() => receipt.cash = false} />
                    </div>
                    <div class="col-7">
                        <img src="/images/food.png" alt="food" class="icon {receipt.category === 'FOOD' ? 'selected' : ''}" on:click={() => receipt.category = 'FOOD'} on:keydown={() => receipt.category = 'FOOD'} />
                        <img src="/images/transport.png" alt="transport" class="icon {receipt.category === 'TRANSPORT' ? 'selected' : ''}" on:click={() => receipt.category = 'TRANSPORT'} on:keydown={() => receipt.category = 'TRANSPORT'} />
                        <img src="/images/clothes.png" alt="clothes" class="icon {receipt.category === 'CLOTHES' ? 'selected' : ''}" on:click={() => receipt.category = 'CLOTHES'} on:keydown={() => receipt.category = 'CLOTHES'} />
                        <img src="/images/house.png" alt="house" class="icon {receipt.category === 'HOUSE' ? 'selected' : ''}" on:click={() => receipt.category = 'HOUSE'} on:keydown={() => receipt.category = 'HOUSE'} />
                        <img src="/images/entretainment.png" alt="entretainment" class="icon {receipt.category === 'ENTRETAINMENT' ? 'selected' : ''}" on:click={() => receipt.category = 'ENTRETAINMENT'} on:keydown={() => receipt.category = 'ENTRETAINMENT'} />
                        <img src="/images/other.png" alt="other" class="icon {receipt.category === null ? 'selected' : ''}" on:click={() => receipt.category = null} on:keydown={() => receipt.category = null} />
                    </div>
                {/if}
                <div class="col-md-12 white">{receipt.created.toLocaleDateString()} {receipt.created.toLocaleTimeString()}</div>
            </div>
        </div>
        <ul class="list-group mw-100 w-100">
            {#each receipt.lines as line}
            <li class="list-group-item">
                <div class="container">
                    <div class="row">
                        <div class="display-6 col-sm-8 col-12 row">
                            <div class="col-2">
                                {#if editMode} <input class="input-width-adjust" type="number" bind:value={line.amount}> {:else} {line.amount || 1} {/if}
                            </div>
                            <div class="col-10">
                                {#if editMode} <input class="input-width-adjust" bind:value={line.name}> {:else} {line.name} {/if}
                            </div>
                        </div>
                        <div class="display-4 col-sm-4 col-12 row">
                            <div class="text-end">
                                {#if editMode} 
                                    <input class="input-close" type="number" step=".01" on:change={recalculateTotal} bind:value={line.total}> 
                                    <img src="/images/close_button.svg" alt="delete" on:click={() => deleteLine(line)} on:keydown={() => deleteLine(line)} class="delete icon" />
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
        float: right;
        margin-right: 2%;
    }
    .total-input {
        max-width: 137px;
    }
    .input-width-adjust {
        max-width: 100%;
    }
    .input-close {
        max-width: 75%;
    }
    .white {
        color: white;
    }
    .delete {
        cursor: pointer;
    }

    .selected {
        max-width: 70px;
        animation: tilt-shaking 0.25s linear infinite;
    }

    @keyframes tilt-shaking {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(5deg); }
        50% { transform: rotate(0eg); }
        75% { transform: rotate(-5deg); }
        100% { transform: rotate(0deg); }
    }
</style>