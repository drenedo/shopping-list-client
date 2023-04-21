<script lang="ts">
    import Modal from "sv-bootstrap-modal";
    import { ReceiptRequest, Receipt, SimpleReceiptRequest, LinePrice } from "../../types/receipts";
    import { Fetcher } from "../../util/fetch";
    import { onMount } from "svelte";
    import { Error } from "../../util/error";
	import ReceiptDetail from "./ReceiptDetail.svelte";
	import Loading from "../Loading.svelte";

    const PAGE_SIZE = 15;

    let receiptIsOpen:boolean = false;
    let loading = true;
    let loadingCreation = false;
    let shakeReceipt: boolean = false;
    let errorInImage: boolean = false;
    let errorMessage: string;
    let modalReceipt: string | undefined;
    let receipt: Receipt | null;

    let image: string | ArrayBuffer | null;
    let imageName: string | null;

    let receipts: Array<Receipt> = [];
    let partialLoading: boolean = false;
    let blockPartialLoad: boolean = false;
    let isImage: boolean = false;

    let site: string | null;
    let total: number | null;
    let totalMonth: number = 0;
    let category: string | null;
    let cash: boolean | null;

    // Search
    let searchIsOpen: boolean;
    let textToSearch: String;
    let searched: Array<LinePrice> = [];
    let searching: boolean;

    onMount(fetchInit);

    async function fetchInit() {
        const pReceipts = Fetcher.get('/api/v1/receipts/size/' + PAGE_SIZE)
        .then(response => {
            return response.json();
        })
        .catch(err => Error.go(err));
        const pTotal = Fetcher.get('/api/v1/receipts/statistics/total/current/month?time-zone=' + 
            Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("/", "%2F"))
        .then(response => {
            return response.json();
        });
        Promise.all([pReceipts, pTotal]).then(function(responses) {
            loadReceipts(responses[0]);
            totalMonth = responses[1];
            loading = false;
        }).catch(err => Error.go(err));
    }

    function handleScroll(event: Event){
        let percent = (document.documentElement.scrollTop || document.body.scrollTop) / 
        ((document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight) * 100;
        if(percent > 80 && !partialLoading && !blockPartialLoad){
            partialLoading = true;
            fetchReceipts(receipts.at(-1)?.created.toISOString())
        }
    }

    function fetchReceipts(date: string | undefined) {
        return Fetcher.get('/api/v1/receipts/size/' + PAGE_SIZE + (date ? '?date-time='+date : ""))
            .then(response => {
                return response.json();
            }).then(addData)
            .catch(err => Error.go(err));
    }

    function addData(data:Array<any>){
        data.forEach(x => x.created = new Date(x.created));
        if(data && data.length > 0){
            receipts = receipts.concat(data as Array<Receipt>);
        } else {
            blockPartialLoad = true;
        }
        partialLoading = false;
    }

    function loadReceipts(data:Array<any>){
        loading = false;
        data.forEach(x => x.created = new Date(x.created));
        receipts = data as Array<Receipt>;
    }

    function closeReceiptModal(){
        receiptIsOpen = false;

    }

    function openReceipt(mode: boolean) {
        site = null;
        total = null;
        category = null;
        cash = null;
        isImage = mode;
        receipt = null;
        receiptIsOpen = true;
    }

    function getReceipt(){
        if(!image || !imageName){
            shakeModalReceipt("Please select an image");
            throw new Error(modalReceipt);
        }
        return new ReceiptRequest(image, imageName);
    }

    function getSimpleReceipt(){
        if(!site || !total){
            shakeModalReceipt("Please indicate site and total");
            throw new Error(modalReceipt);
        }
        return new SimpleReceiptRequest(site, total, cash, category);
    }

    async function shakeModalReceipt(message: string){
        modalReceipt = message;
        shakeReceipt = true;
        setTimeout(function () { shakeReceipt = false  }, 1200);
    }

    async function createReceipt() {
        const request = isImage ? getReceipt() : getSimpleReceipt();
        const url = isImage ? '/api/v1/receipt/' + request.id : '/api/v1/receipt/simple/' + request.id;
        await Fetcher.put(url, request.toBody())
            .then(response => {
                if(response.status != 201){
                    errorInImage = true;
                    response.json().then(body => errorMessage = body.message);
                    //errorMessage = response.json().message;
                    loadingCreation = false;
                    throw new Error("cancel");
                }
                return response.json();
            })
            .then(loadData);
    }

    function loadData(data: unknown){
        receipt = data as Receipt;
        receipt.created = new Date(receipt.created);
        totalMonth = totalMonth + receipt.total;
        if (receipt && receipt.site === undefined && receipt.total === undefined){
            receipt = null;
        }
        loadingCreation = false;
        errorInImage = false;
        if(receipt) {
            receipts = [receipt].concat(receipts);
        }
    }

    function loadBase64(event:Event) {
        loadingCreation = true;
        let reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]);
        reader.onloadend = function () {
            image = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
            imageName = event.target.files[0].name;
            createReceipt();
        };
    }

    function openSearch() {
        searchIsOpen = true;
    }

    function closeSearch() {
        searchIsOpen = false;
    }

    async function search() {
        searching = true;
        await Fetcher.get('/api/v1/line/search/' + textToSearch)
            .then(response => {
                return response.json();
            }).then(data => {
                data.forEach(x => x.created = new Date(x.created));
                searched = data as Array<LinePrice>;
            }).finally(() => searching = false);
    }

    function selectCategory(selected: string | null){
        category = selected;
    }

    function isCash(selected: boolean) {
        cash = selected;
    }
</script>

<svelte:head>
	<title>Receipts</title>
	<meta name="description" content="Receipts" />
</svelte:head>

<div>
    {#if loading}
        <Loading/>
    {:else}
        <div class="d-flex flex-row-reverse bd-highlight gap-3 p-2">
            <button type="button" class="btn btn-primary" on:click={() => openReceipt(true)}>From image</button>
            <button type="button" class="btn btn-primary" on:click={() => openReceipt(false)}>Add simple</button>
            <button type="button" class="btn btn-primary" on:click={openSearch}>Search item</button>
        </div>
        <div class="row">
            <div class="col-md-12 col-sm-12 total">
                <span class="h2">Total this month</span>
                <span class="display-4 fw-bold float-end">{totalMonth.toFixed(2)}</span>
            </div>
        </div>
        <div class="d-flex justify-content-center">
            {#if receipts.length <= 0}
                <div>There are no receipts</div>
            {:else}
                <ul class="list-group mw-100 w-100">    
                    {#each receipts as receipt}
                        <ReceiptDetail receipt={receipt} on:remove={fetchInit}/>
                    {/each}
                </ul>
            {/if}
        </div>
        <Modal bind:open={receiptIsOpen}>
            <div class="modal-header">
                <h5 class="modal-title">Create new receipt</h5>
                <button type="button" class="btn-close" on:click={closeReceiptModal}>
                </button>
            </div>
            <div class="modal-body {shakeReceipt ? 'shake' : ''}">
                <div class="p-3">Woohoo, you're creating a new receipt!</div>
                {#if isImage}
                    <label for="image">Image of the receipt:</label>
                    <input id="image" type="file" accept="image/*" on:change={loadBase64}/>
                {:else}
                    <div class="form-group">
                        <div class="p-1">
                            <label for="site">Site for the receipt:</label>
                            <input class="form-control" id="site" bind:value={site}>
                        </div>
                        <div class="p-1">
                            <label for="total">Total:</label>
                            <input class="form-control" id="total" type="number" step=".01" bind:value={total}>
                        </div>
                        <div class="p-1">
                            <div>Payment:</div>
                            <div>
                                <img src="/images/money.svg" alt="money" class="icon {cash ? 'selected' : ''}" on:click={() => isCash(true)} on:keydown={() => isCash(true)} />
                                <img src="/images/credit_card.svg" alt="credit_card" class="icon {cash === false ? 'selected' : ''}" on:click={() => isCash(false)} on:keydown={() => isCash(false)} />
                            </div>
                        </div>
                        <div class="p-1">
                            <div>Category:</div>
                            <div>
                                <img src="/images/food.png" alt="food" class="icon {category === 'FOOD' ? 'selected' : ''}" on:click={() => selectCategory('FOOD')} on:keydown={() => selectCategory('FOOD')} />
                                <img src="/images/transport.png" alt="transport" class="icon {category === 'TRANSPORT' ? 'selected' : ''}" on:click={() => selectCategory('TRANSPORT')} on:keydown={() => selectCategory('TRANSPORT')} />
                                <img src="/images/clothes.png" alt="clothes" class="icon {category === 'CLOTHES' ? 'selected' : ''}" on:click={() => selectCategory('CLOTHES')} on:keydown={() => selectCategory('CLOTHES')} />
                                <img src="/images/house.png" alt="house" class="icon {category === 'HOUSE' ? 'selected' : ''}" on:click={() => selectCategory('HOUSE')} on:keydown={() => selectCategory('HOUSE')} />
                                <img src="/images/entertainment.png" alt="entertainment" class="icon {category === 'ENTRETAINMENT' ? 'selected' : ''}" on:click={() => selectCategory('ENTRETAINMENT')} on:keydown={() => selectCategory('ENTRETAINMENT')} />
                                <img src="/images/other.png" alt="other" class="icon {category === null ? 'selected' : ''}" on:click={() => selectCategory(null)} on:keydown={() => selectCategory(null)} />
                            </div>
                        </div>
                    </div>
                {/if}
                {#if errorInImage}
                    <div class="alert alert-danger">Sorry, the program couldn't extract information from the image. Reason: {errorMessage}</div>
                {/if}
                {#if loadingCreation}
                    <Loading width="45" />
                {/if}
                <div>
                {#if receipt}
                    <h3 class="p-3 justify-content-center">{receipt?.site}</h3>
                    <div class="p-2">{receipt?.created?.toLocaleString()}</div>
                    {#if receipt?.lines}
                        {#each receipt?.lines as line}
                            <div class="d-flex justify-content-between"><span>{line.name}</span><span>{line.total}</span></div>
                        {/each}
                    {/if}
                    <div class="p-3"><b class="d-flex justify-content-between"><span>TOTAL:</span><span>{receipt?.total}</span></b></div>
                {/if}
                </div>
            </div>
            <div class="modal-footer">
                {#if receipt}
                    <button type="button" class="btn btn-primary" on:click={closeReceiptModal}>OK</button>
                {:else}
                    {#if !isImage}
                        <button type="button" class="btn btn-primary" on:click={createReceipt}>OK</button>
                    {/if}
                    <button type="button" class="btn btn-secondary" on:click={closeReceiptModal}>Close</button>
                {/if}
            </div>
        </Modal>
        <Modal bind:open={searchIsOpen}>
            <div class="modal-header">
                <h5 class="modal-title">Search</h5>
                <button type="button" class="btn-close" on:click={closeSearch}>
                </button>
            </div>
            <div class="modal-body">
                <form on:submit|preventDefault={search}>
                    <label for="search">What you wanna search?</label>
                    <div>
                        <input class="form-control search" id="search" bind:value={textToSearch} >
                        <button type="button" class="btn btn-primary" on:click={search}>&gt;</button>
                    </div>
                    {#if searching}
                        <Loading width="45" />
                    {/if}
                    {#if searched}
                        <div class="container">
                        {#each searched as search}
                            <div class="row">
                                <div class="col-md-2">{search.created?.toLocaleDateString()}</div>
                                <div class="col-md-5"><b>{search.name}</b></div>
                                <div class="col-md-3">{search.site}</div>
                                <div class="col-md-2">{search.total}</div>
                            </div>
                        {/each}
                        </div>
                    {/if}
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" on:click={closeSearch}>OK</button>
            </div>
        </Modal>
    {/if}
</div>


<svelte:window on:scroll={handleScroll} />

<style>
    .shake {
        animation: shake 1s; 
    }

    @keyframes shake{
        25%{transform:translateX(12px)}
        50%{transform:translateX(-12px)}
        75%{transform:translateX(12px)}
    }

    .total {
        padding: 0 39px 1%;
        color: #57005F;
    }

    .search {
        display: initial;
        width: 90%;
    }

    .icon {
        max-width: 50px;
        margin-right: 4%;
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