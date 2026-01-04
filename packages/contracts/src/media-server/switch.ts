import { MediaServerType } from './enums'

export interface SwitchMediaServerRequest {
  targetServerType: MediaServerType
  /**
   * Whether to attempt migrating rules to the new media server.
   * Rules that use properties only available in the source server will be skipped.
   * Default: false (rules are cleared like other data)
   */
  migrateRules?: boolean
}

export interface SkippedRuleDetail {
  ruleGroupId: number
  ruleGroupName: string
  ruleId: number
  reason: string
  propertyName?: string
}

export interface RuleMigrationResult {
  totalRules: number
  migratedRules: number
  skippedRules: number
  fullyMigratedGroups: number
  partiallyMigratedGroups: number
  skippedGroups: number
  skippedDetails: SkippedRuleDetail[]
}

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
  ruleMigration?: RuleMigrationResult
}

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
  ruleMigration?: {
    canMigrate: boolean
    totalGroups: number
    totalRules: number
    migratableRules: number
    skippedRules: number
    skippedDetails: SkippedRuleDetail[]
  }
}
