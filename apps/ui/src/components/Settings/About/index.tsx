import { InformationCircleIcon } from '@heroicons/react/solid'
import { type VersionResponse } from '@maintainerr/contracts'
import { useState } from 'react'
import GetApiHandler from '../../../utils/ApiHandler'
import Releases from './Releases'

const AboutSettings = () => {
  // Maintainerr state
  const [timezone, setTimezone] = useState<string>('')
  const [version, setVersion] = useState<string>('')
  const [commitTag, setCommitTag] = useState<string>('')
  const [ruleCount, setRuleCount] = useState<number>()
  const [itemCount, setItemCount] = useState<number>()
  const [communityCount, setCommunityCount] = useState<number>()

  // Initialize all data on mount using lazy state initializer
  useState(() => {
    queueMicrotask(async () => {
      const [timezoneResp, statusResp, rulesResp, mediaResp, communityResp] = await Promise.all([
        GetApiHandler<string>('/app/timezone'),
        GetApiHandler<VersionResponse>('/app/status'),
        GetApiHandler<number>('/rules/count/'),
        GetApiHandler<number>('/collections/media/count'),
        GetApiHandler<number>('/rules/community/count'),
      ])
      
      setTimezone(timezoneResp)
      if (statusResp.status) {
        setVersion(statusResp.version)
        setCommitTag(statusResp.commitTag)
      }
      setRuleCount(rulesResp)
      setItemCount(mediaResp)
      setCommunityCount(communityResp)
    })
    return true
  })

  return (
    <>
      <title>About - Maintainerr</title>
      <div className="h-full w-full">
        <div className="mt-6 rounded-md border border-amber-600 bg-amber-500 bg-opacity-20 p-4 backdrop-blur">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-gray-100" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm leading-5 text-gray-100">
                This is BETA software. Features may be broken and/or unstable.
                Please report any issues on GitHub!
              </p>
              <p className="mt-3 text-sm leading-5 md:ml-6 md:mt-0">
                <a
                  href="https://github.com/Maintainerr/Maintainerr"
                  className="whitespace-nowrap font-medium text-gray-100 transition duration-150 ease-in-out hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub &rarr;
                </a>
              </p>
            </div>
          </div>
        </div>
        {/* Maintainerr Portion */}
        <div className="section mb-2 h-full w-full">
          <h3 className="heading">About Maintainerr</h3>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section my-2">
          <div className="form-row my-2">
            <label htmlFor="name" className="text-label">
              Version
            </label>
            <div className="form-input">
              <div className="form-input-field">
                <span className="">
                  <code>
                    {commitTag === 'local' ? 'local' : <>{version}</>}
                  </code>
                </span>
              </div>
            </div>
          </div>
          <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
          <div className="form-row my-2">
            <label htmlFor="name" className="text-label">
              Container Config Path
            </label>
            <div className="form-input">
              <div className="form-input-field">
                <span className="">
                  <code>/opt/data</code>
                </span>
              </div>
            </div>
          </div>
          <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
          <div className="form-row my-2">
            <label htmlFor="name" className="text-label">
              Time Zone
            </label>
            <div className="form-input">
              <div className="form-input-field">
                <span className="">
                  <code>{timezone}</code>
                </span>
              </div>
            </div>
          </div>
          <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
          <div className="form-row my-2">
            <label htmlFor="name" className="text-label">
              Number Of Rules
            </label>
            <div className="form-input">
              <div className="form-input-field">
                <span className="">
                  <code>{ruleCount}</code>
                </span>
              </div>
            </div>
          </div>
          <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
          <div className="form-row my-2">
            <label htmlFor="name" className="text-label">
              Total Media in Collections
            </label>
            <div className="form-input">
              <div className="form-input-field">
                <span className="">
                  <code>{itemCount}</code>
                </span>
              </div>
            </div>
          </div>
          <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
          <div className="form-row my-2">
            <label htmlFor="name" className="text-label">
              Community Rules
            </label>
            <div className="form-input">
              <div className="form-input-field">
                <span className="">
                  <code>{communityCount}</code>
                </span>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        {/* End Maintainerr Portion */}
        {/* Useful Links */}
        <div className="section mb-2 h-full w-full">
          <h3 className="heading">Useful Links</h3>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section my-2">
          <div className="form-row my-2">
            <label className="text-label"> Documentation </label>
            <div className="form-input">
              <div className="form-input-field font-bold text-amber-600 underline">
                <a
                  className="hover:text-amber-800"
                  href="https://docs.maintainerr.info"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://docs.maintainerr.info
                </a>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section my-2">
          <div className="form-row my-2">
            <label className="text-label"> Discord </label>
            <div className="form-input">
              <div className="form-input-field font-bold text-amber-600 underline">
                <a
                  className="hover:text-amber-800"
                  href="https://discord.gg/WP4ZW2QYwk"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://discord.gg/WP4ZW2QYwk
                </a>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section my-2">
          <div className="form-row my-2">
            <label className="text-label"> Feature Requests </label>
            <div className="form-input">
              <div className="form-input-field font-bold text-amber-600 underline">
                <a
                  className="hover:text-amber-800"
                  href="https://features.maintainerr.info"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://features.maintainerr.info
                </a>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section my-2">
          <div className="form-row my-2">
            <label className="text-label"> Services Status </label>
            <div className="form-input">
              <div className="form-input-field font-bold text-amber-600 underline">
                <a
                  className="hover:text-amber-800"
                  href="https://status.maintainerr.info"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://status.maintainerr.info
                </a>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section mb-2 h-full w-full">
          <h3 className="heading">Loving Maintainerr?</h3>
        </div>
        <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        <div className="section my-2">
          <div className="form-row my-2">
            <label className="text-label">Donations Welcome</label>
            <div className="form-input">
              <div className="form-input-field font-bold text-amber-600">
                <a
                  className="pr-2 underline hover:text-amber-800"
                  href="https://opencollective.com/maintainerr"
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenCollective
                </a>
              </div>
            </div>
          </div>
        </div>
        <hr className="h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
        {/* End Userful Links */}
        {/* Show Releases */}
        <div className="section">
          <Releases currentVersion={version} />
        </div>
        {/* End Showing Releases */}
      </div>
    </>
  )
}
export default AboutSettings
