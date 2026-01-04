import { MediaServerType } from './enums'

/**
 * Request for switching media server type
 */
export interface SwitchMediaServerRequest {
  /**
   * Target media server type to switch to
   */
  targetServerType: MediaServerType

  /**
   * Whether to attempt migrating rules to the new media server.
   * Rules that use properties only available in the source server will be skipped.
   * Default: false (rules are cleared like other data)
   */
  migrateRules?: boolean
}

/**
 * Details about a rule that was skipped during migration
 */
export interface SkippedRuleDetail {
  ruleGroupId: number
  ruleGroupName: string
  ruleId: number
  reason: string
  propertyName?: string
}

/**
 * Result of rule migration attempt
 */
export interface RuleMigrationResult {
  /** Total rules processed */
  totalRules: number
  /** Successfully migrated rules */
  migratedRules: number
  /** Rules that couldn't be migrated */
  skippedRules: number
  /** Rule groups that had all rules migrated */
  fullyMigratedGroups: number
  /** Rule groups that had some rules skipped */
  partiallyMigratedGroups: number
  /** Rule groups that couldn't be migrated at all */
  skippedGroups: number
  /** Details about skipped rules */
  skippedDetails: SkippedRuleDetail[]
}

/**
 * Response for media server switch operation
 */
export interface SwitchMediaServerResponse {
  status: 'OK' | 'NOK'
  code: number
  message: string
  clearedData?: {
    collections: number
    collectionMedia: number
    exclusions: number
    collectionLogs: number
  }
  /** Present when migrateRules was true */
  ruleMigration?: RuleMigrationResult
}

/**
 * Summary of data that will be cleared when switching media servers
 */
export interface MediaServerSwitchPreview {
  currentServerType: MediaServerType
  targetServerType: MediaServerType
  dataToBeCleared: {
    collections: number
    collectionMedia: number
    exclusions: number
    collectionLogs: number
  }
  dataToBeKept: {
    generalSettings: boolean
    radarrSettings: number
    sonarrSettings: number
    overseerrSettings: boolean
    jellyseerrSettings: boolean
    tautulliSettings: boolean
    notificationSettings: boolean
  }
  /** Rule migration preview - shows what can be migrated vs skipped */
  ruleMigration?: {
    canMigrate: boolean
    totalGroups: number
    totalRules: number
    migratableRules: number
    skippedRules: number
    skippedDetails: SkippedRuleDetail[]
  }
}
