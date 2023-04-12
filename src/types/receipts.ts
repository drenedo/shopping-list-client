import {v4 as uuidv4} from 'uuid';

export class ReceiptRequest {
    id: string
    image: string | ArrayBuffer | null
    name: string

    constructor(image: string | ArrayBuffer | null, name: string) {
        this.id = uuidv4();
        this.image = image;
        this.name = name;
      }

    toBody() {
        return JSON.stringify({name: this.name, image: this.image});
    }
}

export class SimpleReceiptRequest {
    id: string
    site: string
    total: number

    constructor(site: string, total: number) {
        this.id = uuidv4();
        this.site = site;
        this.total = total;
      }

    toBody() {
        return JSON.stringify({site: this.site, total: this.total});
    }
}

export class Line {
    id: string
    name: string
    amount: number
    total: number

    constructor(id: string, name: string, amount: number, total: number) {
        this.id = id;
        this.name = name;
        this.amount = amount;
        this.total = total;
    }

    toObject() {
        return {id: this.id, name: this.name, total: this.total};
    }
}

export class Receipt {
    id: string
    text: string
    site: string
    total: number
    lines: Array<Line>
    created: Date
    cash: boolean
    lineNumber: number

    constructor(id: string, text: string, site: string, total: number, lines: Array<Line>, created: string, cash: boolean, lineNumber: number) {
        this.id = id;
        this.text = text;
        this.site = site;
        this.total = total;
        this.lines = lines;
        this.created = new Date(created);
        this.cash = cash;
        this.lineNumber = lineNumber;
    }

    toBody() {
        return JSON.stringify({id: this.id, site: this.site, text: this.text, total: this.total, lines: this.lines.map(l => l.toObject())});
    }
}