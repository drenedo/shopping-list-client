<script lang="ts">
    import { onMount } from "svelte";
    import ItemTable from './ItemTable.svelte';
    import { FullList } from "../../types/list";
    import { Fetcher } from "../../util/fetch";
    import { Error } from "../../util/error";
    import Loading from "../Loading.svelte";

    let loading = true;
    let id: string| null;
    let name: string| null;
    let description: string| null;
    let list: FullList| null;

    onMount(load);

    function load(){    
        const urlParams = new URLSearchParams(window.location.search);
        id = urlParams.get('id');
        name = urlParams.get('name');
        description = urlParams.get('des');
        if(!undefined && !description){
            loadFromId();
        } else {
            list = new FullList(id, name, description, new Date(), null);
        }
    }

    async function loadFromId(){
        await Fetcher.get('/api/v1/lists/' + id)
            .then(response => response.json())
            .then(loadData)
            .catch(err => Error.go(err));
    }

    function loadData(data:Array<any>){
        list = data as FullList;
        list.items.sort((a, b) => a.status > b.status ? 1 : -1);
        list.date = new Date(data.date);
        loading = false;
    }

</script>

<svelte:head>
	<title>List details {list?.name || id}</title>
	<meta name="description" content="List details {id}" />
</svelte:head>

<div>
    {#if loading}
        <Loading />
    {:else}
        <h1>{list?.name}</h1>
        <div>{list?.date.toLocaleString()}</div>
        <div>{list?.description}</div>
        <ItemTable items={list?.items} list={id} ></ItemTable>
    {/if}
</div>