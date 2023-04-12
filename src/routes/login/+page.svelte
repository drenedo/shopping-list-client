<script lang="ts">
    import { Fetcher } from "../../util/fetch";
    
    let user:string = "";
	let password:string = "";
    let shake: boolean = false;
    let message = "";

    async function submit(){
        if(!user || user == ''){
            shakeForm("You need a user");
            return;
        }
        if(!password || password == ''){
            shakeForm("You need a password");
            return;
        }
        await Fetcher.post('/api/v1/auth/login', JSON.stringify({user: user, password: password}))
        .then(response => {
            if(response.status == 403){
                shakeForm("Login incorrect");
            }else{
                return response.json();
            }
        }).then(body => {
            localStorage.setItem('token', body.token);
            window.location.href = "/";
        })
        .catch(err => Error.go(err))
    }


    async function shakeForm(passMessage: string){
        message = passMessage;
        shake = true;
        setTimeout(function () { shake = false  }, 1200);
    }
</script>

<svelte:head>
	<title>Shopping List Login</title>
	<meta name="description" content="Shopping list login" />
</svelte:head>

<div class="container">
    <div class="row justify-content-md-center {shake ? 'shake' : ''}">
        <div class="form-group col col-xl-6 col-md-8 col-sm-10">
            <div>{message}</div>
            <form on:submit|preventDefault={submit}>
                <div class="p-1">
                    <label for="name"><strong>User</strong></label>
                    <input class="form-control" id="name" bind:value={user}>
                </div>
                <div class="p-1">
                    <label for="description"><strong>Password</strong></label>
                    <input type="password" class="form-control" id="description" bind:value={password}>
                </div>
                <button class="d-none">GO</button>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" on:click={submit}>Login!</button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    label {
        color: var(--color-theme-1);
    }

    .shake {
        animation: shake 1s; 
    }

    @keyframes shake{
        25%{transform:translateX(12px)}
        50%{transform:translateX(-12px)}
        75%{transform:translateX(12px)}
    }
</style>