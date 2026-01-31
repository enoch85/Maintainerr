import { SaveIcon } from '@heroicons/react/solid'
import { isValidCron } from 'cron-validator'
import { useActionState, useState } from 'react'
import { useSettingsOutletContext } from '..'
import { usePatchSettings } from '../../../api/settings'
import Alert from '../../Common/Alert'
import Button from '../../Common/Button'

const JobSettings = () => {
  const [ruleHandler, setRuleHandler] = useState('')
  const [collectionHandler, setCollectionHandler] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)
  const [secondCronValid, setSecondCronValid] = useState(true)
  const [firstCronValid, setFirstCronValid] = useState(true)
  
  const {
    mutateAsync: updateSettings,
    isError: updateSettingsError,
    isPending: updateSettingsPending,
    isSuccess: updateSettingsSuccess,
  } = usePatchSettings()
  const { settings } = useSettingsOutletContext()

  // Initialize form from settings
  if (settings && !formInitialized) {
    setFormInitialized(true)
    setRuleHandler(settings.rules_handler_job_cron || '')
    setCollectionHandler(settings.collection_handler_job_cron || '')
  }

  // Form action for React 19
  const [error, submitAction, isSubmitting] = useActionState(
    async (_prevState: string | null, formData: FormData) => {
      const ruleHandlerValue = formData.get('ruleHandler') as string
      const collectionHandlerValue = formData.get('collectionHandler') as string
      
      if (
        !ruleHandlerValue ||
        !collectionHandlerValue ||
        !isValidCron(ruleHandlerValue) ||
        !isValidCron(collectionHandlerValue)
      ) {
        return 'Please make sure all values are valid'
      }
      
      await updateSettings({
        collection_handler_job_cron: collectionHandlerValue,
        rules_handler_job_cron: ruleHandlerValue,
      })
      
      return null
    },
    null
  )

  return (
    <>
      <title>Job settings - Maintainerr</title>
      <div className="h-full w-full">
        <div className="section h-full w-full">
          <h3 className="heading">Job Settings</h3>
          <p className="description">Job configuration</p>
        </div>

        {error && (
          <Alert type="error" title={error} />
        )}

        {updateSettingsError && (
          <Alert
            type="error"
            title="Something went wrong, please check your values"
          />
        )}

        {updateSettingsSuccess && (
          <Alert type="info" title="Settings successfully updated" />
        )}

        <div className="section">
          <form action={submitAction}>
            <div className="form-row">
              <label htmlFor="ruleHandler" className="text-label">
                Rule Handler
                <p className="text-xs font-normal">
                  Supports all standard{' '}
                  <a
                    href="http://crontab.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    cron
                  </a>{' '}
                  patterns. Can be overridden by individual rule groups.
                </p>
              </label>
              <div className="form-input">
                <div
                  className={`form-input-field' ${
                    !firstCronValid ? 'border-2 border-red-700' : ''
                  }`}
                >
                  <input
                    name="ruleHandler"
                    id="ruleHandler"
                    type="text"
                    value={ruleHandler}
                    onChange={(e) => {
                      setRuleHandler(e.target.value)
                      setFirstCronValid(e.target.value ? isValidCron(e.target.value) : false)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="collectionHandler" className="text-label">
                Collection Handler
                <p className="text-xs font-normal">
                  Supports all standard{' '}
                  <a
                    href="http://crontab.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    cron
                  </a>{' '}
                  patterns
                </p>
              </label>

              <div className="form-input">
                <div
                  className={`form-input-field' ${
                    !secondCronValid ? 'border-2 border-red-700' : ''
                  }`}
                >
                  <input
                    name="collectionHandler"
                    id="collectionHandler"
                    type="text"
                    value={collectionHandler}
                    onChange={(e) => {
                      setCollectionHandler(e.target.value)
                      setSecondCronValid(e.target.value ? isValidCron(e.target.value) : false)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="actions mt-5 w-full">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={updateSettingsPending || isSubmitting}
                  >
                    <SaveIcon />
                    <span>Save Changes</span>
                  </Button>
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
export default JobSettings
