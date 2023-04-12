import {v4 as uuidv4} from 'uuid';


export class FullItem {
    id: string 
    name: string
    amount: number
    unit: string
    brand: string
    status: string


    constructor(id: string, name: string, amount: number, unit: string, brand: string, status: string) {
        this.id = id
        this.name = name;
        this.amount = amount;
        this.unit = unit;
        this.brand = brand;
        this.status = status;
      }

}

export class ItemRequest {
    id: string
    name: string
    unit: string | null
    amount: number
    brand: string  | null
    list: string

    constructor(name: string, unit: string | null, amount: number, brand: string | null, list: string) {
        this.id = uuidv4();
        this.name = name;
        this.unit = unit;
        this.amount = amount;
        this.brand = brand;
        this.list = list;
      }

    toBody() {
        return JSON.stringify({name: this.name, unit: this.unit, amount: this.amount, brand: this.brand, shoppingListId: this.list});
    }
}