export class Fetcher {

    static put(endPoint:string, body:any){
        return fetch(endPoint, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: body
        })
    }

    static post(endPoint:string, body:any){
        return fetch(endPoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: body
        }).then(Fetcher.checkLogued);
    }

    static get(endPoint:string){
        return fetch(endPoint, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(Fetcher.checkLogued);
    }

    static delete(endPoint:string){
        return fetch(endPoint, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
    }

    private static checkLogued(response: Response) {
        if(response.status === 403){
            console.log("Not logued");
            if(window.location.pathname != "/login"){
                window.location.href = "/login";
                throw 'cancel';
            }
        }
        return response;
    }
}