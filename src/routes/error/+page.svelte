<script lang="ts">
    import { onMount } from "svelte";

    onMount(load);

    let message:string = "";

    function load(){    
        const urlParams = new URLSearchParams(window.location.search);
        message = urlParams.get('message') || "Undefined error";
    }

</script>

<svelte:head>
	<title>Error: {message}</title>
	<meta name="description" content="{message}" />
</svelte:head>

<div class="h-100 d-flex middle">
    <h1 class="text-danger">{message}</h1>
</div>


<style>
    .middle {
        padding-top: 30%;
    }
</style>