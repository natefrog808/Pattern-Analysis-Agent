export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number) {
    const queueItem = { item, priority };
    const insertIndex = this.items.findIndex(i => i.priority > priority);
    
    if (insertIndex === -1) {
      this.items.push(queueItem);
    } else {
      this.items.splice(insertIndex, 0, queueItem);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  get size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}
