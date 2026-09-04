export class TranscriptRegistry {
  entries = [];
  get current() {
    return [...this.entries].sort((a, b) => b.priority - a.priority || b.order - a.order)[0]?.callback || null;
  }
  order = 0;
  add(callback, priority = 0) {
    const entry = { callback, priority, order: ++this.order };
    this.entries.push(entry);
    return () => { this.entries = this.entries.filter(item => item !== entry); };
  }
  clear() { this.entries = []; }
}
