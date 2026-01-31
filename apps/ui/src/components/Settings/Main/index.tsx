import { RefreshIcon, SaveIcon } from '@heroicons/react/solid'
import React, { useActionState, useState } from 'react'
import { useSettingsOutletContext } from '..'
import { usePatchSettings } from '../../../api/settings'
import GetApiHandler from '../../../utils/ApiHandler'
import Alert from '../../Common/Alert'
import Button from '../../Common/Button'
import DocsButton from '../../Common/DocsButton'
import MediaServerSelector from '../MediaServerSelector'

const MainSettings = () => {
  const [hostname, setHostname] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)
  
  const { settings } = useSettingsOutletContext()
  const {
    mutateAsync: updateSettings,
    isSuccess,
    isPending,
  } = usePatchSettings()

  // Initialize form from settings
  if (settings && !formInitialized) {
    setFormInitialized(true)
    setHostname(settings.applicationUrl || '')
    setApiKey(settings.apikey || '')
  }

  // Form action for React 19
  const [error, submitAction, isSubmitting] = useActionState(
    async (_prevState: string | null, formData: FormData) => {
      const hostnameValue = formData.get('hostname') as string
      const apiKeyValue = formData.get('apikey') as string
      
      if (!hostnameValue || !apiKeyValue) {
        return 'Not all fields contain values'
      }
      
      await updateSettings({
        applicationUrl: hostnameValue,
        apikey: apiKeyValue,
      })
      
      return null
    },
    null
  )

  const regenerateApi = async () => {
    const key = await GetApiHandler('/settings/api/generate')
    setApiKey(key)
    await updateSettings({
      apikey: key,
    })
  }

  return (
    <>
      <title>General settings - Maintainerr</title>
      <div className="h-full w-full">
        <div className="section h-full w-full">
          <h3 className="heading">General Settings</h3>
          <p className="description">Configure global settings</p>
        </div>
        {error && (
          <Alert type="error" title={error} />
        )}

        {isSuccess && (
          <Alert type="info" title="Settings successfully updated" />
        )}
        <div className="section">
          <form action={submitAction}>
            <div className="form-row">
              <label htmlFor="hostname" className="text-label">
                Hostname
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    name="hostname"
                    id="hostname"
                    type="text"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="apikey" className="text-label">
                API key
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    name="apikey"
                    id="apikey"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={regenerateApi}
                    className="input-action ml-3"
                  >
                    <RefreshIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="actions mt-5 w-full">
              <div className="flex justify-end">
                <div className="flex w-full">
                  <span className="mr-auto flex rounded-md shadow-sm">
                    <DocsButton />
                  </span>
                  <span className="ml-auto flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      type="submit"
                      disabled={isPending || isSubmitting}
                    >
                      <SaveIcon />
                      <span>Save Changes</span>
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Media Server Selector */}
        <MediaServerSelector currentType={settings.media_server_type ?? null} />
      </div>
    </>
  )
}
export default MainSettings
