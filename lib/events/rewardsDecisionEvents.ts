// Global event system for rewards decision updates
export const rewardsDecisionEvents = {
  listeners: new Set<() => void>(),
  emit() {
    this.listeners.forEach(listener => listener());
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};
