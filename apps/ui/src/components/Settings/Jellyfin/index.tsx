import {
  BeakerIcon,
  CheckIcon,
  ExclamationIcon,
  SaveIcon,
} from '@heroicons/react/solid'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useSettingsOutletContext } from '..'
import {
  useDeleteJellyfinSettings,
  useSaveJellyfinSettings,
  useTestJellyfin,
} from '../../../api/settings'
import Alert from '../../Common/Alert'
import Button from '../../Common/Button'
import DocsButton from '../../Common/DocsButton'

const JellyfinSettings = () => {
  const [error, setError] = useState<string | undefined>()
  const [testResult, setTestResult] = useState<{
    status: boolean
    message: string
  } | null>(null)
  const [testedSettings, setTestedSettings] = useState<{
    url: string
    apiKey: string
  } | null>(null)
  
  // Form state
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [userId, setUserId] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)

  const { settings } = useSettingsOutletContext()

  const { mutateAsync: testJellyfin, isPending: isTestPending } =
    useTestJellyfin()

  const {
    mutateAsync: saveSettings,
    isPending: isSavePending,
    isSuccess: saveSuccess,
    isError: saveError,
  } = useSaveJellyfinSettings()

  const {
    mutateAsync: deleteSettings,
    isPending: isDeletePending,
    isSuccess: deleteSuccess,
  } = useDeleteJellyfinSettings()

  // Initialize form values from settings once
  const settingsKey = settings ? `${settings.jellyfin_url}-${settings.jellyfin_api_key}-${settings.jellyfin_user_id}` : undefined
  
  if (settingsKey && !formInitialized) {
    setFormInitialized(true)
    setUrl(settings?.jellyfin_url || '')
    setApiKey(settings?.jellyfin_api_key || '')
    setUserId(settings?.jellyfin_user_id || '')
  }

  // Clear test result when URL or API key changes
  const handleCredentialChange = () => {
    if (testResult) {
      setTestResult(null)
      setTestedSettings(null)
    }
  }

  const handleTest = async () => {
    setError(undefined)
    setTestResult(null)

    const trimmedUrl = url.trim()
    const trimmedApiKey = apiKey.trim()

    if (!trimmedUrl || !trimmedApiKey) {
      setError('Please fill in the Jellyfin URL and API key')
      return
    }

    try {
      const result = await testJellyfin({
        jellyfin_url: trimmedUrl,
        jellyfin_api_key: trimmedApiKey,
        jellyfin_user_id: userId.trim() || undefined,
      })

      if (result.code === 1) {
        setTestResult({
          status: true,
          message: result.serverName
            ? `Connected to ${result.serverName} (v${result.version})`
            : result.message,
        })
        setTestedSettings({ url: trimmedUrl, apiKey: trimmedApiKey })
        toast.success('Jellyfin connection successful!')
      } else {
        setTestResult({ status: false, message: result.message })
        setTestedSettings(null)
        toast.error(`Connection failed: ${result.message}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      setTestResult({ status: false, message })
      setTestedSettings(null)
      toast.error(message)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)

    const trimmedUrl = url.trim()
    const trimmedApiKey = apiKey.trim()

    // If both fields are empty, delete the settings (like Jellyseerr pattern)
    const isRemovingSettings = trimmedUrl === '' && trimmedApiKey === ''

    if (isRemovingSettings) {
      try {
        await deleteSettings()
        setTestResult(null)
        setTestedSettings(null)
        toast.success('Jellyfin settings cleared')
      } catch (err) {
        toast.error('Failed to clear Jellyfin settings')
      }
      return
    }

    // Validate required fields for saving
    if (!trimmedUrl || !trimmedApiKey) {
      setError('Please fill in the Jellyfin URL and API key')
      toast.error('Please fill in the required fields')
      return
    }

    // Check if settings have been tested
    const currentSettingsAreSameAsSaved =
      trimmedUrl === settings?.jellyfin_url && trimmedApiKey === settings?.jellyfin_api_key
    const currentSettingsHaveBeenTested =
      testedSettings?.url === trimmedUrl &&
      testedSettings?.apiKey === trimmedApiKey &&
      testResult?.status

    if (!currentSettingsAreSameAsSaved && !currentSettingsHaveBeenTested) {
      setError('Please test the connection before saving')
      toast.error('Please test the connection before saving')
      return
    }

    try {
      await saveSettings({
        jellyfin_url: trimmedUrl,
        jellyfin_api_key: trimmedApiKey,
        jellyfin_user_id: userId.trim() || undefined,
      })
      toast.success('Jellyfin settings saved successfully!')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save settings'
      toast.error(message)
    }
  }

  return (
    <>
      <title>Jellyfin settings - Maintainerr</title>
      <div className="h-full w-full">
        <div className="section h-full w-full">
          <h3 className="heading">Jellyfin Settings</h3>
          <p className="description">
            Configure your Jellyfin server connection
          </p>
        </div>

        {error && <Alert type="error" title={error} />}

        {saveError && (
          <Alert
            type="error"
            title="There was an error saving Jellyfin settings."
          />
        )}

        {(saveSuccess || deleteSuccess) && (
          <Alert type="info" title="Settings successfully updated" />
        )}

        {testResult && (
          <Alert
            type={testResult.status ? 'info' : 'error'}
            title={testResult.message}
          />
        )}

        <div className="section">
          <form onSubmit={handleSave}>
            <div className="form-row">
              <label htmlFor="jellyfin_url" className="text-label">
                Jellyfin URL
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    name="jellyfin_url"
                    id="jellyfin_url"
                    type="text"
                    placeholder="http://jellyfin.local:8096"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      handleCredentialChange()
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="jellyfin_api_key" className="text-label">
                API Key
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    name="jellyfin_api_key"
                    id="jellyfin_api_key"
                    type="password"
                    placeholder="Enter your Jellyfin API key"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      handleCredentialChange()
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  In Jellyfin, go to <strong>Dashboard → API Keys</strong> and
                  create a new API key named &quot;Maintainerr&quot;.
                </p>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="jellyfin_user_id" className="text-label">
                Admin User ID (Optional)
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    name="jellyfin_user_id"
                    id="jellyfin_user_id"
                    type="text"
                    placeholder="Auto-detected if not specified"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Used for admin operations. Leave blank to auto-detect.
                </p>
              </div>
            </div>

            <div className="actions mt-6">
              <div className="flex flex-wrap justify-between">
                <div className="flex">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      type="button"
                      buttonType={
                        testResult
                          ? testResult.status
                            ? 'success'
                            : 'danger'
                          : 'default'
                      }
                      onClick={handleTest}
                      disabled={isTestPending}
                    >
                      {testResult ? (
                        testResult.status ? (
                          <CheckIcon className="h-5 w-5" />
                        ) : (
                          <ExclamationIcon className="h-5 w-5" />
                        )
                      ) : (
                        <BeakerIcon className="h-5 w-5" />
                      )}
                      <span className="ml-1">
                        {isTestPending ? 'Testing...' : 'Test Connection'}
                      </span>
                    </Button>
                  </span>

                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isSavePending || isDeletePending}
                    >
                      <SaveIcon className="h-5 w-5" />
                      <span className="ml-1">
                        {isSavePending || isDeletePending
                          ? 'Saving...'
                          : 'Save Changes'}
                      </span>
                    </Button>
                  </span>
                </div>

                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <DocsButton page="using-maintainerr/settings/jellyfin" />
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default JellyfinSettings
