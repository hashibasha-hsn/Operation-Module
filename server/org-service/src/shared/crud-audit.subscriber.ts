import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { auditContext } from './audit-context';
import { auditLogClientHolder } from './audit-log-client.holder';

/** Skip noisy / circular / already-custom-logged entities. */
const SKIP_AUDIT_LOG_ENTITIES = new Set([
  'AuditLog',
  'PermissionAuditLog',
  'DeliveryLog',
  'Session',
  'RefreshToken',
  'PermissionCache',
  'Process',
  'Audit',
  'Submission',
  'ProcessSection',
  'ProcessQuestion',
  'AuditSection',
  'AuditQuestion',
  'Translation',
  'LanguageEntry',
  'NoticeboardLike',
  'NoticeboardRead',
  'CourseProgress',
  'AssessmentResult',
  'Notification',
  'NotificationPreference',
]);

const TARGET_LABELS: Record<string, string> = {
  BusinessEntity: 'Entity',
  RemovedEntity: 'Removed Entity',
  EntityTag: 'Entity Tag',
  ActionPoint: 'Action Point',
  AttendanceRecord: 'Attendance',
  AttendanceConfig: 'Attendance Config',
  Noticeboard: 'Notice',
  NoticeboardComment: 'Notice Comment',
  TicketTag: 'Ticket Tag',
  TicketRule: 'Ticket Rule',
  TicketSettings: 'Ticket Settings',
  TicketClosureQuestion: 'Ticket Closure Question',
  AutoTicketCategory: 'Ticket Category',
  AssetTable: 'Asset Table',
  CourseCategory: 'Course Category',
  CourseQuiz: 'Course Quiz',
  BiDashboard: 'BI Dashboard',
  SaRegion: 'SA Region',
  SaDistrict: 'SA District',
  SaCity: 'SA City',
};

const DETAIL_FIELDS = [
  'title',
  'name',
  'storeName',
  'email',
  'status',
  'priority',
  'code',
  'employeeId',
  'roleName',
  'featureName',
  'permissionLevel',
  'designation',
  'category',
  'checkInAt',
  'checkOutAt',
  'type',
  'storeStatus',
] as const;

@EventSubscriber()
export class CrudAuditSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>): void {
    this.applyActorFields(event.entity, event.metadata, true);
  }

  beforeUpdate(event: UpdateEvent<any>): void {
    this.applyActorFields(event.entity, event.metadata, false);
  }

  afterInsert(event: InsertEvent<any>): void {
    void this.writeAuditLog('Create', event.metadata.name, event.entity);
  }

  afterUpdate(event: UpdateEvent<any>): void {
    void this.writeAuditLog('Update', event.metadata.name, event.entity, event.databaseEntity);
  }

  afterRemove(event: RemoveEvent<any>): void {
    void this.writeAuditLog('Delete', event.metadata.name, event.entity ?? event.databaseEntity);
  }

  private applyActorFields(
    entity: Record<string, unknown> | undefined,
    metadata: InsertEvent<any>['metadata'],
    isInsert: boolean,
  ): void {
    if (!entity) return;

    const actor = auditContext.getActorId();
    const columns = new Set(metadata.columns.map((column) => column.propertyName));

    if (isInsert && columns.has('createdBy') && (entity.createdBy == null || entity.createdBy === '')) {
      entity.createdBy = actor;
    }

    if (columns.has('updatedBy')) {
      entity.updatedBy = actor;
    }
  }

  private async writeAuditLog(
    operation: 'Create' | 'Update' | 'Delete',
    entityName: string,
    entity?: Record<string, unknown> | null,
    previousEntity?: Record<string, unknown> | null,
  ): Promise<void> {
    if (SKIP_AUDIT_LOG_ENTITIES.has(entityName)) return;

    const client = auditLogClientHolder.client;
    if (!client) return;

    const source = entity || previousEntity || {};
    const targetId = this.resolveEntityId(entity) ?? this.resolveEntityId(previousEntity);
    const organizationId = auditContext.getOrganizationId(
      typeof source.organizationId === 'string' ? source.organizationId : undefined,
    );

    const details: Record<string, unknown> = {};
    for (const field of DETAIL_FIELDS) {
      const value = source[field] ?? previousEntity?.[field];
      if (value != null && value !== '') {
        details[field] = value instanceof Date ? value.toISOString() : value;
      }
    }

    if (operation === 'Update' && entity && previousEntity) {
      const changedFields = Object.keys(entity).filter((key) => {
        if (['updatedAt', 'updatedBy', 'createdAt', 'createdBy'].includes(key)) return false;
        return JSON.stringify(entity[key]) !== JSON.stringify(previousEntity[key]);
      });
      if (changedFields.length) details.changedFields = changedFields;
    }

    try {
      const performedBy = await client.resolveEmail(auditContext.getActorId());
      await client.log({
        target: TARGET_LABELS[entityName] || entityName,
        operation,
        performedBy,
        targetId,
        organizationId,
        details,
      });
    } catch (error) {
      console.error('[CrudAuditSubscriber] Failed to write audit log:', error);
    }
  }

  private resolveEntityId(entity?: Record<string, unknown> | null): string | undefined {
    if (!entity) return undefined;
    const id = entity.id ?? entity.uuid ?? entity.userId;
    return id != null ? String(id) : undefined;
  }
}
