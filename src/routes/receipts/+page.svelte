<script lang="ts">
    import Modal from "sv-bootstrap-modal";
    import { ReceiptRequest, Receipt, SimpleReceiptRequest } from "../../types/receipts";
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
    let modalReceipt: string | undefined;
    let receipt: Receipt | null;

    let image: string | ArrayBuffer | null;
    let imageName: string | null;

    let receipts: Array<Receipt> = [];
    let partialLoading: boolean = false;
    let blockPartialLoad: boolean = false;
    let isImage: boolean = false;

    let site: string;
    let total: number;
    let totalMonth: number = 0;

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
        data.forEach(x => x.created = new Date(x.date));
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
        return new SimpleReceiptRequest(site, total);
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

    //$: receipts, updateTotalForThisMonth()
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
            <button type="button" class="btn btn-primary" on:click={() => openReceipt(true)}>Add new receipt from image</button>
            <button type="button" class="btn btn-primary" on:click={() => openReceipt(false)}>Add new simple receipt</button>
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
                    </div>
                {/if}
                {#if errorInImage}
                    <div class="alert alert-danger">Sorry, the program couldn't extract information from the image</div>
                {/if}
                {#if loadingCreation}<Loading width="45" />{/if}
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
</style>