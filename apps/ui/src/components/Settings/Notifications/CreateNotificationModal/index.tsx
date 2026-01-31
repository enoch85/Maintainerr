import { BasicResponseDto } from '@maintainerr/contracts'
import { Editor } from '@monaco-editor/react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import GetApiHandler, { PostApiHandler } from '../../../../utils/ApiHandler'
import { camelCaseToPrettyText } from '../../../../utils/SettingsUtils'
import LoadingSpinner from '../../../Common/LoadingSpinner'
import Modal from '../../../Common/Modal'
import ToggleItem from '../../../Common/ToggleButton'

interface agentSpec {
  name: string
  friendlyName: string
  options: [
    { field: string; type: string; required: boolean; extraInfo: string },
  ]
}

interface typeSpec {
  title: string
  id: number
}

export interface AgentConfiguration {
  id?: number
  name: string
  agent: string
  enabled: boolean
  types: number[]
  aboutScale: number
  options: object
}

interface CreateNotificationModal {
  selected?: AgentConfiguration
  onSave: (status: boolean) => void
  onTest: () => void
  onCancel: () => void
}

const CreateNotificationModal = (props: CreateNotificationModal) => {
  const [availableAgents, setAvailableAgents] = useState<agentSpec[]>()
  const [availableTypes, setAvailableTypes] = useState<typeSpec[]>()
  const [nameValue, setNameValue] = useState<string>(props.selected?.name ?? '')
  const [aboutScaleValue, setAboutScaleValue] = useState<number>(props.selected?.aboutScale ?? 3)
  const [enabledValue, setEnabledValue] = useState<boolean>(props.selected?.enabled ?? false)
  const [formValues, setFormValues] = useState<any>(props.selected?.options)

  const [targetAgent, setTargetAgent] = useState<agentSpec>()
  const [targetTypes, setTargetTypes] = useState<typeSpec[]>([])

  // Initialize data on mount
  useState(() => {
    queueMicrotask(async () => {
      const agents = await GetApiHandler<agentSpec[]>('/notifications/agents')
      setAvailableAgents([{ name: '-', options: [] } as agentSpec, ...agents])

      // load selected agents if editing
      if (props.selected && props.selected.agent) {
        setTargetAgent(
          agents.find(
            (agent: agentSpec) => props.selected!.agent === agent.name,
          ),
        )
      }

      const types = await GetApiHandler<typeSpec[]>('/notifications/types')
      setAvailableTypes(types)

      // load selected types if editing
      if (props.selected && props.selected.types) {
        setTargetTypes(
          types.filter((type) => props.selected!.types.includes(type.id)),
        )
      }
    })
    return true
  })

  const handleSubmit = () => {
    const types = targetTypes ? targetTypes.map((t) => t.id) : []

    if (targetAgent && nameValue !== '') {
      const payload: AgentConfiguration = {
        id: props.selected?.id,
        name: nameValue,
        agent: targetAgent.name,
        enabled: enabledValue,
        types: types,
        aboutScale: aboutScaleValue,
        options: formValues,
      }
      postNotificationConfig(payload)
    } else {
      props.onSave(false)
    }
  }

  const doTest = () => {
    if (targetAgent && nameValue !== '') {
      const types = targetTypes ? targetTypes.map((t) => t.id) : []

      PostApiHandler(`/notifications/test`, {
        id: props.selected?.id,
        name: nameValue,
        agent: targetAgent.name,
        enabled: enabledValue,
        types: types,
        aboutScale: aboutScaleValue,
        options: formValues,
      }).then((resp) => {
        if (resp !== 'Success') {
          toast.error(resp, {
            autoClose: 10000,
          })
        } else {
          toast.success('Successfully fired the notification!')
        }
      })
    }
  }

  const postNotificationConfig = (payload: AgentConfiguration) => {
    PostApiHandler('/notifications/configuration/add', payload).then(
      (status: BasicResponseDto) => {
        props.onSave(status.status === 'OK')
      },
    )
  }

  const handleInputChange = (fieldName: string, value: any) => {
    setFormValues((prevValues: any) => ({
      ...prevValues,
      [fieldName]: value,
    }))
  }

  if (!availableAgents || !availableTypes) {
    return (
      <span>
        <LoadingSpinner />
      </span>
    )
  } else {
    return (
      <Modal
        loading={false}
        backgroundClickable={false}
        onCancel={() => props.onCancel()}
        okDisabled={false}
        okText="Save"
        okButtonType={'primary'}
        title={
          props.selected?.id
            ? 'Edit Notification Agent'
            : 'New Notification Agent'
        }
        iconSvg={''}
        onOk={handleSubmit}
        secondaryButtonType="success"
        secondaryText={'Test'}
        onSecondary={doTest}
      >
        <div>
          <form className="space-y-4">
            {/* Config Name */}
            <div className="form-row">
              <label htmlFor="name" className="text-label">
                Name *
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={nameValue}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setNameValue(event.target.value)
                    }
                  ></input>
                </div>
              </div>
            </div>
            {/* Enabled */}
            <div className="form-row">
              <label htmlFor="enabled" className="text-label">
                Enabled
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <input
                    type="checkbox"
                    name="enabled"
                    id="enabled"
                    checked={enabledValue}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setEnabledValue(event.target.checked)
                    }
                  ></input>
                </div>
              </div>
            </div>
            {/* Select agent */}
            <div className="form-row">
              <label htmlFor="agent" className="text-label">
                Agent *
              </label>
              <div className="form-input">
                <div className="form-input-field">
                  <select
                    id="agent"
                    name="agent"
                    onChange={(e) => {
                      setFormValues({})
                      setTargetAgent(availableAgents[Number(e.target.value)])
                    }}
                    className="rounded-l-only"
                  >
                    {availableAgents?.map((agent, index) => (
                      <option
                        key={`agent-${index}`}
                        value={index}
                        selected={
                          props.selected
                            ? agent.name === props.selected?.agent
                            : false
                        }
                      >
                        {`${agent.friendlyName ? agent.friendlyName : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              {/* Load fields */}
              {targetAgent?.options.map((option) => {
                return (
                  <div className="form-row" key={`form-row-${option.field}`}>
                    <label
                      htmlFor={`${targetAgent.name}-${option.field}`}
                      className="text-label"
                    >
                      {camelCaseToPrettyText(
                        option.field + (option.required ? ' *' : ''),
                      )}
                      {option.extraInfo ? (
                        <span className="label-tip">{option.extraInfo}</span>
                      ) : null}
                    </label>
                    <div className="form-input">
                      <div className="form-input-field">
                        {option.type === 'json' ? (
                          <Editor
                            height="200px"
                            defaultLanguage="json"
                            theme="vs-dark"
                            defaultValue={
                              formValues?.[option.field]
                                ? JSON.stringify(
                                    formValues?.[option.field],
                                    null,
                                    2,
                                  )
                                : '{}'
                            }
                            options={{
                              minimap: { enabled: false },
                              formatOnPaste: true,
                              formatOnType: true,
                            }}
                            onChange={(value) =>
                              handleInputChange(
                                option.field,
                                value ? JSON.parse(value) : {},
                              )
                            }
                          />
                        ) : (
                          <input
                            name={option.field}
                            id={`${targetAgent.name}-${option.field}`}
                            type={option.type}
                            required={option.required}
                            key={`${targetAgent.name}-option-${option.field}`}
                            defaultValue={
                              formValues?.[option.field]
                                ? formValues?.[option.field]
                                : undefined
                            }
                            defaultChecked={
                              option.type == 'checkbox'
                                ? formValues?.[option.field]
                                : false
                            }
                            onChange={(e) => {
                              if (option.type == 'checkbox') {
                                handleInputChange(
                                  option.field,
                                  e.target.checked,
                                )
                              } else {
                                handleInputChange(option.field, e.target.value)
                              }
                            }}
                          ></input>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Select types */}
              <div className="form-row">
                <label className="text-label">Types *</label>
                <div className="form-input">
                  {availableTypes.map((n) => (
                    <div key={n.id}>
                      <ToggleItem
                        label={n.title}
                        toggled={props.selected?.types.includes(n.id)}
                        onStateChange={(state) => {
                          if (state) {
                            setTargetTypes([...targetTypes, n])
                          } else {
                            setTargetTypes(
                              targetTypes.filter((el) => el.id !== n.id),
                            )
                          }
                        }}
                      />
                      {/* Show only when 'Media About To Be Handled' is selected */}
                      {targetTypes.find((el) => el.id === 8) && n.id === 8 && (
                        <div className="form-row mb-0 ml-9 mt-0">
                          <label htmlFor="about-scale" className="text-label">
                            Notify x days before removal
                          </label>
                          <div className="form-input">
                            <div className="form-input-field">
                              <input
                                type="number"
                                name="about-scale"
                                value={aboutScaleValue}
                                onChange={(
                                  event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                  setAboutScaleValue(+event.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    )
  }
}
export default CreateNotificationModal
