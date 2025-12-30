import { CheckCircleIcon, ExclamationIcon } from '@heroicons/react/solid'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  MediaServerSwitchPreview,
  MediaServerType,
  usePreviewMediaServerSwitch,
  useSwitchMediaServer,
} from '../../../api/settings'
import Modal from '../../Common/Modal'

interface MediaServerSelectorProps {
  currentType: MediaServerType | null
  onSwitch?: () => void
}

const serverOptions: {
  value: MediaServerType
  name: string
  description: string
  icon: string
}[] = [
  {
    value: 'plex',
    name: 'Plex',
    description: 'Plex Media Server',
    icon: '/icons_logos/plex_logo.svg',
  },
  {
    value: 'jellyfin',
    name: 'Jellyfin',
    description: 'Jellyfin Media Server',
    icon: '/icons_logos/jellyfin.svg',
  },
]

const MediaServerSelector = ({
  currentType,
  onSwitch,
}: MediaServerSelectorProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pendingType, setPendingType] = useState<MediaServerType | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [migrateRules, setMigrateRules] = useState(true)

  const { mutateAsync: previewSwitch, isPending: isPreviewPending } =
    usePreviewMediaServerSwitch()
  const { mutateAsync: switchServer, isPending: isSwitchPending } =
    useSwitchMediaServer()

  const [previewData, setPreviewData] =
    useState<MediaServerSwitchPreview | null>(null)

  const handleServerClick = async (type: MediaServerType) => {
    if (type === currentType) return

    setPendingType(type)

    // If no current type is set (initial setup), skip preview and just set the type
    if (!currentType) {
      try {
        await switchServer({
          targetServerType: type,
          confirmDataClear: true,
        })
        toast.success(
          `Selected ${type === 'plex' ? 'Plex' : 'Jellyfin'} as your media server`,
        )

        // Wait for settings to refetch before navigating
        await queryClient.invalidateQueries({ queryKey: ['settings'] })
        // Wait for the queries to actually refetch
        await queryClient.refetchQueries({ queryKey: ['settings'] })

        onSwitch?.()
        setPendingType(null)
        // Navigate to the new media server's settings page
        navigate(`/settings/${type}`, { replace: true })
      } catch (err) {
        console.error('Failed to set media server:', err)
        toast.error('Failed to set media server')
        setPendingType(null)
      }
      return
    }

    // For switching (when currentType exists), show preview modal
    try {
      const preview = await previewSwitch(type)
      setPreviewData(preview)
      setShowConfirmModal(true)
    } catch (err) {
      toast.error('Failed to preview switch')
      setPendingType(null)
    }
  }

  const handleConfirmSwitch = async () => {
    if (!pendingType) return

    try {
      const result = await switchServer({
        targetServerType: pendingType,
        confirmDataClear: true,
        migrateRules: migrateRules,
      })

      // Show appropriate success message
      if (result.ruleMigration) {
        const { migratedRules, totalRules, skippedRules } = result.ruleMigration
        if (skippedRules > 0) {
          toast.warning(
            `Switched to ${pendingType === 'plex' ? 'Plex' : 'Jellyfin'}. ${migratedRules}/${totalRules} rules migrated, ${skippedRules} skipped (incompatible properties).`,
            { autoClose: 8000 },
          )
        } else {
          toast.success(
            `Switched to ${pendingType === 'plex' ? 'Plex' : 'Jellyfin'}. All ${migratedRules} rules migrated successfully!`,
          )
        }
      } else {
        toast.success(
          `Switched to ${pendingType === 'plex' ? 'Plex' : 'Jellyfin'}`,
        )
      }

      setShowConfirmModal(false)

      // Wait for settings to refetch before navigating
      await queryClient.invalidateQueries({ queryKey: ['settings'] })

      onSwitch?.()
      setPendingType(null)
      // Navigate to the new media server's settings page
      navigate(`/settings/${pendingType}`)
    } catch (err) {
      toast.error('Failed to switch media server')
    }
  }

  const handleCancelSwitch = () => {
    setShowConfirmModal(false)
    setPendingType(null)
    setPreviewData(null)
    setMigrateRules(true)
  }

  const hasDataToDelete =
    previewData?.dataToBeCleared &&
    (previewData.dataToBeCleared.collections > 0 ||
      previewData.dataToBeCleared.collectionMedia > 0 ||
      previewData.dataToBeCleared.exclusions > 0)

  const hasRulesToMigrate =
    previewData?.ruleMigration && previewData.ruleMigration.totalRules > 0

  return (
    <>
      <div className="section">
        <h3 className="heading">Media Server</h3>
        <p className="description">
          {currentType
            ? 'Select your media server type. Switching will clear all collections and related data.'
            : 'Select your media server to get started with Maintainerr.'}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {serverOptions.map((option) => {
            const isSelected = currentType === option.value
            const isPending =
              (isPreviewPending || isSwitchPending) &&
              pendingType === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleServerClick(option.value)}
                disabled={isPreviewPending || isSwitchPending}
                className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                } ${(isPreviewPending || isSwitchPending) && !isPending ? 'opacity-50' : ''}`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="h-10 w-10 rounded"
                    />
                    <div className="ml-4 text-left">
                      <p className="font-medium text-zinc-100">{option.name}</p>
                      <p className="text-sm text-zinc-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 text-amber-500">
                      <CheckCircleIcon className="h-6 w-6" />
                    </div>
                  )}
                  {isPending && (
                    <div className="shrink-0">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-amber-500" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          title="Switch Media Server"
          onCancel={handleCancelSwitch}
          onOk={handleConfirmSwitch}
          okText="Switch"
          okButtonType="danger"
          okDisabled={isSwitchPending}
          cancelText="Cancel"
          loading={isSwitchPending}
          iconSvg={<ExclamationIcon className="h-6 w-6 text-amber-500" />}
        >
          <div className="text-zinc-300">
            <p className="mb-4">
              You are about to switch from{' '}
              <strong className="text-zinc-100">
                {currentType === 'plex' ? 'Plex' : 'Jellyfin'}
              </strong>{' '}
              to{' '}
              <strong className="text-zinc-100">
                {pendingType === 'plex' ? 'Plex' : 'Jellyfin'}
              </strong>
              .
            </p>

            {hasDataToDelete ? (
              <>
                <p className="mb-3 font-semibold text-amber-400">
                  The following data will be permanently deleted:
                </p>
                <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
                  {previewData!.dataToBeCleared.collections > 0 && (
                    <li>
                      {previewData!.dataToBeCleared.collections} collection(s)
                    </li>
                  )}
                  {previewData!.dataToBeCleared.collectionMedia > 0 && (
                    <li>
                      {previewData!.dataToBeCleared.collectionMedia} collection
                      media item(s)
                    </li>
                  )}
                  {previewData!.dataToBeCleared.exclusions > 0 && (
                    <li>
                      {previewData!.dataToBeCleared.exclusions} exclusion(s)
                    </li>
                  )}
                  {previewData!.dataToBeCleared.collectionLogs > 0 && (
                    <li>
                      {previewData!.dataToBeCleared.collectionLogs} log entries
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <p className="mb-4 text-green-400">
                No data will be deleted (no collections exist).
              </p>
            )}

            {/* Rule Migration Section */}
            {hasRulesToMigrate && (
              <div className="mb-4 rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="migrateRules"
                    checked={migrateRules}
                    onChange={(e) => setMigrateRules(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="migrateRules" className="ml-3 cursor-pointer">
                    <span className="block font-medium text-zinc-100">
                      Migrate rules to{' '}
                      {pendingType === 'plex' ? 'Plex' : 'Jellyfin'}
                    </span>
                    <span className="block text-sm text-zinc-400">
                      {previewData!.ruleMigration!.migratableRules} of{' '}
                      {previewData!.ruleMigration!.totalRules} rules can be
                      migrated.
                      {previewData!.ruleMigration!.skippedRules > 0 && (
                        <span className="text-amber-400">
                          {' '}
                          {previewData!.ruleMigration!.skippedRules} rule(s) use
                          properties not available in{' '}
                          {pendingType === 'plex' ? 'Plex' : 'Jellyfin'}.
                        </span>
                      )}
                    </span>
                    {migrateRules && (
                      <span className="mt-1 block text-xs text-zinc-500">
                        Note: Rule groups will need library re-assignment after
                        migration.
                      </span>
                    )}
                  </label>
                </div>

                {/* Show skipped rules details if any */}
                {previewData!.ruleMigration!.skippedRules > 0 &&
                  previewData!.ruleMigration!.skippedDetails.length > 0 && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">
                        Show incompatible rules (
                        {previewData!.ruleMigration!.skippedRules})
                      </summary>
                      <ul className="mt-1 space-y-1 pl-4 text-zinc-500">
                        {previewData!
                          .ruleMigration!.skippedDetails.slice(0, 5)
                          .map((detail, idx) => (
                            <li key={idx}>
                              <span className="text-zinc-400">
                                {detail.ruleGroupName}
                              </span>
                              {detail.propertyName && (
                                <span> - uses {detail.propertyName}</span>
                              )}
                            </li>
                          ))}
                        {previewData!.ruleMigration!.skippedDetails.length >
                          5 && (
                          <li className="text-zinc-400">
                            ...and{' '}
                            {previewData!.ruleMigration!.skippedDetails.length -
                              5}{' '}
                            more
                          </li>
                        )}
                      </ul>
                    </details>
                  )}
              </div>
            )}

            <p className="text-sm text-zinc-400">
              Your general settings, Radarr, Sonarr, Overseerr, Jellyseerr,
              Tautulli, and notification settings will be kept.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}

export default MediaServerSelector
