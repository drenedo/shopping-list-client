<script lang="ts">
    import { onMount } from "svelte";
    import { Fetcher } from "../../../util/fetch";
    import { Receipt } from "../../../types/receipts";
    import { Error } from "../../../util/error";
	import Loading from "../../Loading.svelte";

    let id: string | null;
    let loading = true;
    let receipt: Receipt;


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
        console.log(data);
        data.created = new Date(data.created);
        receipt = data as Receipt;
    }

</script>


<div>
    {#if loading}
        <Loading />
    {:else}
        <div>
            <span class="display-5" >{receipt.site}</span><span class="display-4 fw-bold float-end">{receipt.total}</span>
        </div>
        <div class="col-md-10 col-sm-8">{receipt.created.toLocaleDateString()} {receipt.created.toLocaleTimeString()}</div>
        <ul class="list-group mw-100 w-100">
            {#each receipt.lines as line}
            <li class="list-group-item">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12 col-sm-8 container row">
                            <div class="display-6 col-md-9">{line.amount || 1} {line.name}</div>
                            <div class="display-4 col-md-3 d-flex justify-content-end">{line.total.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </li>
            {/each}
        </ul>
    {/if}
</div>