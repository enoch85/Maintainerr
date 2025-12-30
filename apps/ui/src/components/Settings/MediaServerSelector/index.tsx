import { CheckCircleIcon, ExclamationIcon } from '@heroicons/react/solid'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
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

  const { mutateAsync: previewSwitch, isPending: isPreviewPending } =
    usePreviewMediaServerSwitch()
  const { mutateAsync: switchServer, isPending: isSwitchPending } =
    useSwitchMediaServer()

  const [previewData, setPreviewData] = useState<{
    collections: number
    collectionMedia: number
    exclusions: number
    collectionLogs: number
  } | null>(null)

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
        toast.success(`Selected ${type === 'plex' ? 'Plex' : 'Jellyfin'} as your media server`)
        
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
      setPreviewData(preview.dataToBeCleared)
      setShowConfirmModal(true)
    } catch (err) {
      toast.error('Failed to preview switch')
      setPendingType(null)
    }
  }

  const handleConfirmSwitch = async () => {
    if (!pendingType) return

    try {
      await switchServer({
        targetServerType: pendingType,
        confirmDataClear: true,
      })
      toast.success(`Switched to ${pendingType === 'plex' ? 'Plex' : 'Jellyfin'}`)
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
  }

  const hasDataToDelete =
    previewData &&
    (previewData.collections > 0 ||
      previewData.collectionMedia > 0 ||
      previewData.exclusions > 0)

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
              (isPreviewPending || isSwitchPending) && pendingType === option.value

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
          iconSvg={
            <ExclamationIcon className="h-6 w-6 text-amber-500" />
          }
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
                  {previewData!.collections > 0 && (
                    <li>{previewData!.collections} collection(s)</li>
                  )}
                  {previewData!.collectionMedia > 0 && (
                    <li>{previewData!.collectionMedia} collection media item(s)</li>
                  )}
                  {previewData!.exclusions > 0 && (
                    <li>{previewData!.exclusions} exclusion(s)</li>
                  )}
                  {previewData!.collectionLogs > 0 && (
                    <li>{previewData!.collectionLogs} log entries</li>
                  )}
                </ul>
              </>
            ) : (
              <p className="mb-4 text-green-400">
                No data will be deleted (no collections exist).
              </p>
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
