type Listener = (...args: any[]) => void

export default class EventEmitter {
  private listeners: { [key: string]: Listener[] }

  constructor() {
    this.listeners = {}
  }

  on(eventName: string, listener: Listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(listener)

    return () => this.off(eventName, listener)
  }

  once(eventName: string, listener: Listener) {
    const wrapper = (...args: any[]) => {
      listener(...args)
      this.off(eventName, wrapper)
    }
    return this.on(eventName, wrapper)
  }

  off(eventName: string, listener: Listener) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(
        (l) => l !== listener
      )
    }
  }

  emit(eventName: string, ...args: any[]) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((listener) => listener(...args))
    }
  }

  removeAllListeners() {
    this.listeners = {}
  }
}
