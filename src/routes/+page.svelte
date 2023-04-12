<script>
	import ListTable from './ListTable.svelte';
</script>

<svelte:head>
	<title>Lists</title>
	<meta name="description" content="Shopping list" />
</svelte:head>

<section>
	<ListTable />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
