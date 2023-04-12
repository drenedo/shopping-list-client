export class Error {
    static go(error: string){
        if(error != 'cancel'){
            console.log("Error", error);
            window.location.href = "/error?message=" + error;
        }
    }
}