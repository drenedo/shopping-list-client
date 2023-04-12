import {v4 as uuidv4} from 'uuid';
import { FullItem } from './items';

export type List = {
    id: string
    name: string
    description: string
    date: Date
    status: string
}

export class ListRequest {
    id: string
    name: string
    description: string

    constructor(name: string, description: string) {
        this.id = uuidv4();
        this.name = name;
        this.description = description;
      }

    toBody() {
        return JSON.stringify({name: this.name, description: this.description});
    }
}

export class FullList {
  id: string
  name: string
  description: string
  date: Date
  items: Array<FullItem>

  constructor(id: string, name: string, description: string, date: string, items: Array<FullItem>) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.date = new Date(date);
    this.items = items;
  }

}