import { AsyncLocalStorage } from 'async_hooks';

export type AuditActor = {
  userId: string;
  email?: string;
  organizationId?: string;
};

const storage = new AsyncLocalStorage<AuditActor>();

export const auditContext = {
  run<T>(actor: AuditActor, fn: () => T): T {
    return storage.run(actor, fn);
  },

  get(): AuditActor | undefined {
    return storage.getStore();
  },

  getActorId(): string {
    const ctx = storage.getStore();
    return ctx?.userId || ctx?.email || 'system';
  },

  getOrganizationId(fallback?: string): string {
    const ctx = storage.getStore();
    return ctx?.organizationId || fallback || 'default-org';
  },
};
