import { TrashIcon } from '@heroicons/react/solid'
import {
  Application,
  type MediaItemType,
  MediaType,
  RulePossibility,
  RulePossibilityTranslations,
} from '@maintainerr/contracts'
import { FormEvent, useState } from 'react'
import { IRule } from '../'
import { useRuleConstants } from '../../../../../api/rules'
import { IProperty } from '../../../../../contexts/constants-context'
import { useMediaServerType } from '../../../../../hooks/useMediaServerType'
import LoadingSpinner from '../../../../Common/LoadingSpinner'

enum RuleType {
  NUMBER,
  DATE,
  TEXT,
  BOOL,
  TEXT_LIST,
}
enum RuleOperators {
  AND,
  OR,
}

enum CustomParams {
  CUSTOM_NUMBER = 'custom_number',
  CUSTOM_DAYS = 'custom_days',
  CUSTOM_DATE = 'custom_date',
  CUSTOM_TEXT = 'custom_text',
  CUSTOM_TEXT_LIST = 'custom_text_list',
  CUSTOM_BOOLEAN = 'custom_boolean',
}

interface IRuleInput {
  id?: number
  tagId?: number
  mediaType?: MediaType
  dataType?: MediaItemType
  section?: number
  newlyAdded?: number[]
  editData?: { rule: IRule }
  onCommit: (id: number, rule: IRule) => void
  onIncomplete: (id: number) => void
  onDelete: (section: number, id: number) => void
  allowDelete?: boolean
  radarrSettingsId?: number | null
  sonarrSettingsId?: number | null
}

/**
 * Helper function to determine if an application should be filtered out
 * based on server selection and media server type
 */
const shouldFilterApplication = (
  appId: number,
  radarrSettingsId: number | null | undefined,
  sonarrSettingsId: number | null | undefined,
  isPlex: boolean,
  isJellyfin: boolean,
): boolean => {
  if (
    appId === Application.RADARR &&
    (radarrSettingsId === undefined || radarrSettingsId === null)
  ) {
    return true
  }
  if (
    appId === Application.SONARR &&
    (sonarrSettingsId === undefined || sonarrSettingsId === null)
  ) {
    return true
  }
  if (
    isJellyfin &&
    (appId === Application.PLEX || appId === Application.TAUTULLI)
  ) {
    return true
  }
  if (isPlex && appId === Application.JELLYFIN) {
    return true
  }
  return false
}

/** Parse initial values from editData rule */
const parseInitialEditData = (
  rule: IRule | undefined,
  isNewlyAdded: boolean,
): {
  operator?: string
  firstval?: string
  action?: RulePossibility
  secondVal?: string
  customVal?: string
  ruleType: RuleType
} => {
  if (!rule || isNewlyAdded) {
    return { ruleType: RuleType.NUMBER }
  }

  let secondVal: string | undefined
  let customVal: string | undefined
  let ruleType = RuleType.NUMBER

  if (rule.customVal) {
    customVal = rule.customVal.value.toString()
    switch (rule.customVal.ruleTypeId) {
      case 0:
        // Hack to determine if param is amount of days or really a number
        if (
          (rule.customVal.value as number) % 86400 === 0 &&
          (rule.customVal.value as number) !== 0
        ) {
          secondVal = CustomParams.CUSTOM_DAYS
        } else {
          secondVal = CustomParams.CUSTOM_NUMBER
        }
        ruleType = RuleType.NUMBER
        break
      case 1:
        secondVal = CustomParams.CUSTOM_DATE
        ruleType = RuleType.DATE
        break
      case 2:
        secondVal = CustomParams.CUSTOM_TEXT
        ruleType = RuleType.TEXT
        break
      case 3:
        secondVal = CustomParams.CUSTOM_BOOLEAN
        ruleType = RuleType.BOOL
        break
      case 4:
        secondVal = CustomParams.CUSTOM_TEXT_LIST
        ruleType = RuleType.TEXT_LIST
        break
    }
  } else {
    secondVal = JSON.stringify(rule.lastVal)
  }

  return {
    operator: rule.operator?.toString(),
    firstval: JSON.stringify(rule.firstVal),
    action: rule.action,
    secondVal,
    customVal,
    ruleType,
  }
}

/** Get property from [appId, propId] tuple */
const getPropFromConstants = (
  value: string | undefined,
  constants:
    | { applications?: { id: number; props: IProperty[] }[] }
    | undefined,
): IProperty | undefined => {
  if (!value || !constants) return undefined
  try {
    const parsed = JSON.parse(value) as [number, number]
    const application = constants.applications?.find(
      (el) => el.id === parsed[0],
    )
    return application?.props.find((el) => el.id === parsed[1])
  } catch {
    return undefined
  }
}

/** Derive customValActive and customValType from secondVal */
const deriveCustomValState = (
  secondVal: string | undefined,
): { active: boolean; type: RuleType | undefined } => {
  switch (secondVal) {
    case CustomParams.CUSTOM_NUMBER:
      return { active: true, type: RuleType.NUMBER }
    case CustomParams.CUSTOM_DATE:
      return { active: true, type: RuleType.DATE }
    case CustomParams.CUSTOM_DAYS:
    case CustomParams.CUSTOM_TEXT:
      return { active: true, type: RuleType.TEXT }
    case CustomParams.CUSTOM_TEXT_LIST:
      return { active: true, type: RuleType.TEXT_LIST }
    case CustomParams.CUSTOM_BOOLEAN:
      return { active: true, type: RuleType.BOOL }
    default:
      return { active: false, type: undefined }
  }
}

/** Check if firstval is still valid given current filters */
const isFirstvalValid = (
  firstval: string | undefined,
  constants:
    | {
        applications?: {
          id: number
          mediaType: MediaType
          props: IProperty[]
        }[]
      }
    | undefined,
  mediaType: MediaType | undefined,
  dataType: MediaItemType | undefined,
): boolean => {
  if (!firstval || !constants) return true
  try {
    const val = JSON.parse(firstval) as [number, number]
    const app = constants.applications?.find((a) => a.id === val[0])
    if (!app) return false
    const validProps = app.props.filter((prop) => {
      return (
        (prop.mediaType === MediaType.BOTH || mediaType === prop.mediaType) &&
        (mediaType === MediaType.MOVIE ||
          prop.showType === undefined ||
          prop.showType.includes(dataType!))
      )
    })
    return validProps.some((p) => p.id === val[1])
  } catch {
    return false
  }
}

const RuleInput = (props: IRuleInput) => {
  const { data: constants, isLoading: constantsLoading } = useRuleConstants()
  const { isPlex, isJellyfin } = useMediaServerType()

  // Determine if this is a newly added rule
  const isNewlyAdded = props.id != null && props.newlyAdded?.includes(props.id)

  // Initialize state from editData using lazy initializers (runs once on mount)
  const [operator, setOperator] = useState<string | undefined>(() => {
    const initial = parseInitialEditData(props.editData?.rule, isNewlyAdded)
    return initial.operator
  })

  const [firstval, setFirstVal] = useState<string | undefined>(() => {
    const initial = parseInitialEditData(props.editData?.rule, isNewlyAdded)
    return initial.firstval
  })

  const [action, setAction] = useState<RulePossibility | undefined>(() => {
    const initial = parseInitialEditData(props.editData?.rule, isNewlyAdded)
    return initial.action
  })

  const [secondVal, setSecondVal] = useState<string | undefined>(() => {
    const initial = parseInitialEditData(props.editData?.rule, isNewlyAdded)
    return initial.secondVal
  })

  const [customVal, setCustomVal] = useState<string | undefined>(() => {
    const initial = parseInitialEditData(props.editData?.rule, isNewlyAdded)
    return initial.customVal
  })

  const [initialRuleType] = useState<RuleType>(() => {
    const initial = parseInitialEditData(props.editData?.rule, isNewlyAdded)
    return initial.ruleType
  })

  // Track previous dataType/mediaType to detect changes and invalidate firstval
  const [prevDataType, setPrevDataType] = useState(props.dataType)
  const [prevMediaType, setPrevMediaType] = useState(props.mediaType)

  // Detect dataType/mediaType changes and clear invalid firstval
  if (props.dataType !== prevDataType || props.mediaType !== prevMediaType) {
    setPrevDataType(props.dataType)
    setPrevMediaType(props.mediaType)
    // Check if current firstval is still valid
    if (
      firstval &&
      constants &&
      !isFirstvalValid(firstval, constants, props.mediaType, props.dataType)
    ) {
      setFirstVal(undefined)
    }
  }

  // Derive ruleType and possibilities from firstval (computed during render, not stored)
  const currentProp = getPropFromConstants(firstval, constants)
  const ruleType = currentProp
    ? (+currentProp.type.key as RuleType)
    : initialRuleType
  const possibilities = currentProp?.type.possibilities ?? []

  // Derive customValActive and customValType from secondVal (computed during render)
  const { active: customValActive, type: customValType } =
    deriveCustomValState(secondVal)

  // Adjust customVal for boolean type
  const effectiveCustomVal =
    secondVal === CustomParams.CUSTOM_BOOLEAN && customVal !== '0'
      ? (customVal ?? '1')
      : customVal

  // Submit function - called from event handlers
  const submit = () => {
    const isCustomParam = (v: string | undefined) =>
      v && Object.values(CustomParams).includes(v as CustomParams)

    if (
      firstval &&
      action != null &&
      ((secondVal && !isCustomParam(secondVal)) || effectiveCustomVal)
    ) {
      const ruleValues = {
        operator: operator ?? null,
        firstVal: JSON.parse(firstval),
        action,
        section: props.section ? props.section - 1 : 0,
      }

      if (effectiveCustomVal) {
        const effectiveRuleTypeId = customValActive
          ? customValType === RuleType.DATE
            ? customValType
            : customValType === RuleType.NUMBER
              ? customValType
              : customValType === RuleType.TEXT &&
                  secondVal === CustomParams.CUSTOM_DAYS
                ? RuleType.NUMBER
                : customValType === RuleType.TEXT
                  ? customValType
                  : customValType === RuleType.BOOL
                    ? customValType
                    : customValType === RuleType.TEXT_LIST
                      ? customValType
                      : ruleType
          : ruleType

        props.onCommit(props.id ?? 0, {
          customVal: {
            ruleTypeId: effectiveRuleTypeId,
            value: effectiveCustomVal,
          },
          ...ruleValues,
        })
      } else {
        props.onCommit(props.id ?? 0, {
          lastVal: JSON.parse(secondVal!),
          ...ruleValues,
        })
      }
    } else {
      props.onIncomplete(props.id ?? 0)
    }
  }

  // Schedule initial submit after first render
  const [didInitialSubmit] = useState(() => {
    queueMicrotask(() => submit())
    return true
  })
  void didInitialSubmit

  // Event handlers - update state and call submit
  const updateOperator = (event: { target: { value: string } }) => {
    const newValue = event.target.value || undefined
    setOperator(newValue)
    queueMicrotask(() => submit())
  }

  const updateFirstValue = (event: { target: { value: string } }) => {
    const newValue = event.target.value || undefined
    const newProp = getPropFromConstants(newValue, constants)
    const newRuleType = newProp ? (+newProp.type.key as RuleType) : undefined

    // If rule type changed, clear secondVal and customVal
    if (newRuleType !== undefined && newRuleType !== ruleType) {
      setSecondVal(undefined)
      setCustomVal(undefined)
    }

    setFirstVal(newValue)
    queueMicrotask(() => submit())
  }

  const updateAction = (event: { target: { value: string } }) => {
    const newValue =
      event.target.value === ''
        ? undefined
        : (+event.target.value as RulePossibility)
    setAction(newValue)
    queueMicrotask(() => submit())
  }

  const updateSecondValue = (event: { target: { value: string } }) => {
    const newValue = event.target.value || undefined
    setSecondVal(newValue)

    // Handle custom value state based on new secondVal
    const { active } = deriveCustomValState(newValue)
    if (!active) {
      setCustomVal(undefined)
    } else if (newValue === CustomParams.CUSTOM_BOOLEAN && customVal !== '0') {
      setCustomVal('1')
    }

    queueMicrotask(() => submit())
  }

  const updateCustomValue = (event: { target: { value: string } }) => {
    const newValue =
      secondVal === CustomParams.CUSTOM_DAYS
        ? (+event.target.value * 86400).toString()
        : event.target.value
    setCustomVal(newValue)
    queueMicrotask(() => submit())
  }

  const onDelete = (e: FormEvent | null) => {
    e?.preventDefault()
    props.onDelete(props.section ?? 0, props.id ?? 0)
  }

  if (!constants || constantsLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="w-full rounded-2xl bg-zinc-800 p-4 text-zinc-100 shadow-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-600">
          {props.tagId
            ? `Rule #${props.tagId}`
            : props.id
              ? `Rule #${props.id}`
              : `Rule #1`}
        </h3>

        {props.allowDelete ? (
          <button
            className="flex items-center rounded-lg bg-red-600 px-3 py-1 text-zinc-100 shadow-md hover:bg-red-500"
            onClick={onDelete}
            title={`Remove rule ${props.tagId}, section ${props.section}`}
          >
            <TrashIcon className="mr-1 h-5 w-5" />
            Delete
          </button>
        ) : null}
      </div>

      {props.id !== 1 ? (
        (props.id && props.id > 0) || (props.section && props.section > 1) ? (
          <div className="mb-3 mt-2 md:flex md:items-center">
            {!props.id || (props.tagId ? props.tagId === 1 : props.id === 1) ? (
              <label htmlFor="operator">Section Operator</label>
            ) : (
              <label htmlFor="operator">Operator</label>
            )}
            <div className="md:ml-4">
              <div className="flex w-1/2 md:w-fit">
                <select
                  name="operator"
                  id="operator"
                  onChange={updateOperator}
                  value={operator}
                >
                  <option value=""> </option>
                  {Object.keys(RuleOperators).map(
                    (value: string, key: number) => {
                      if (!isNaN(+value)) {
                        return (
                          <option key={key} value={key}>
                            {RuleOperators[key]}
                          </option>
                        )
                      }
                    },
                  )}
                </select>
              </div>
            </div>
          </div>
        ) : undefined
      ) : undefined}

      {/* First Value Selection */}
      <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2">
        <div>
          <label htmlFor="first_val" className="block text-sm font-medium">
            First Value
          </label>
          <select
            name="first_val"
            id="first_val"
            onChange={updateFirstValue}
            value={firstval}
            className="w-full rounded-lg p-2 text-zinc-100 focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="" className="text-amber-600">
              Select First Value...
            </option>
            {constants.applications
              ?.filter(
                (app) =>
                  !shouldFilterApplication(
                    app.id,
                    props.radarrSettingsId,
                    props.sonarrSettingsId,
                    isPlex,
                    isJellyfin,
                  ),
              )
              .map((app) =>
                app.mediaType === MediaType.BOTH ||
                props.mediaType === app.mediaType ? (
                  <optgroup key={app.id} label={app.name}>
                    {app.props.map((prop) =>
                      (prop.mediaType === MediaType.BOTH ||
                        props.mediaType === prop.mediaType) &&
                      (props.mediaType === MediaType.MOVIE ||
                        prop.showType === undefined ||
                        prop.showType.includes(props.dataType!)) ? (
                        <option
                          key={`${app.id}-${prop.id}`}
                          value={JSON.stringify([app.id, prop.id])}
                        >
                          {`${app.name} - ${prop.humanName}`}
                        </option>
                      ) : null,
                    )}
                  </optgroup>
                ) : null,
              )}
          </select>
        </div>

        {/* Action Selection */}
        <div>
          <label htmlFor="action" className="mb-1 block text-sm font-medium">
            Action
          </label>
          <select
            name="action"
            id="action"
            onChange={updateAction}
            value={action}
            className="w-full rounded-lg p-2 text-zinc-100 focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="" className="text-amber-600">
              Select Action...
            </option>
            {possibilities.map((act) => (
              <option key={act} value={act}>
                {RulePossibilityTranslations[act]}
              </option>
            ))}
          </select>
        </div>

        {/* Second Value Selection */}
        <div>
          <label
            htmlFor="second_val"
            className="mb-1 block text-sm font-medium"
          >
            Second Value
          </label>
          <select
            name="second_val"
            id="second_val"
            onChange={updateSecondValue}
            value={secondVal}
            className="w-full rounded-lg p-2 text-zinc-100 focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="" className="text-amber-600">
              Select Second Value...
            </option>
            <optgroup label="Custom values">
              {ruleType === RuleType.DATE ? (
                <>
                  <option value={CustomParams.CUSTOM_DAYS}>
                    Amount of days
                  </option>
                  {action != null &&
                  action !== RulePossibility.IN_LAST &&
                  action !== RulePossibility.IN_NEXT ? (
                    <option value={CustomParams.CUSTOM_DATE}>
                      Specific date
                    </option>
                  ) : undefined}
                </>
              ) : undefined}
              {ruleType === RuleType.NUMBER ? (
                <option value={CustomParams.CUSTOM_NUMBER}>Number</option>
              ) : undefined}
              {ruleType === RuleType.BOOL ? (
                <option value={CustomParams.CUSTOM_BOOLEAN}>Boolean</option>
              ) : undefined}
              {ruleType === RuleType.TEXT ? (
                <option value={CustomParams.CUSTOM_TEXT}>Text</option>
              ) : undefined}
              <MaybeTextListOptions ruleType={ruleType} action={action} />
            </optgroup>
            {constants.applications
              ?.filter(
                (app) =>
                  !shouldFilterApplication(
                    app.id,
                    props.radarrSettingsId,
                    props.sonarrSettingsId,
                    isPlex,
                    isJellyfin,
                  ),
              )
              .map((app) => {
                return (app.mediaType === MediaType.BOTH ||
                  props.mediaType === app.mediaType) &&
                  action != null &&
                  action !== RulePossibility.IN_LAST &&
                  action !== RulePossibility.IN_NEXT ? (
                  <optgroup key={app.id} label={app.name}>
                    {app.props.map((prop) => {
                      const secondValueTypes = getSecondValueTypes(ruleType)
                      for (const type of secondValueTypes) {
                        if (+prop.type.key === type) {
                          return (prop.mediaType === MediaType.BOTH ||
                            props.mediaType === prop.mediaType) &&
                            (props.mediaType === MediaType.MOVIE ||
                              prop.showType === undefined ||
                              prop.showType.includes(props.dataType!)) ? (
                            <option
                              key={app.id + 10 + prop.id}
                              value={JSON.stringify([app.id, prop.id])}
                            >{`${app.name} - ${prop.humanName}`}</option>
                          ) : undefined
                        }
                      }
                    })}
                  </optgroup>
                ) : undefined
              })}
          </select>
        </div>

        {/* Custom Value Input */}
        {customValActive ? (
          <div className="mb-2">
            <label
              htmlFor="custom_val"
              className="mb-1 block text-sm font-medium"
            >
              Custom Value
            </label>
            {customValType === RuleType.TEXT &&
            secondVal === CustomParams.CUSTOM_DAYS ? (
              <input
                type="number"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={customVal ? +customVal / 86400 : undefined}
                placeholder="Amount of days"
              ></input>
            ) : (customValType === RuleType.TEXT &&
                secondVal === CustomParams.CUSTOM_TEXT) ||
              customValType === RuleType.TEXT_LIST ? (
              <input
                type="text"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={customVal}
                placeholder="Text"
              ></input>
            ) : customValType === RuleType.DATE ? (
              <input
                type="date"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={customVal}
                placeholder="Date"
              ></input>
            ) : customValType === RuleType.BOOL ? (
              <select
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={customVal}
              >
                <option value={1}>True</option>
                <option value={0}>False</option>
              </select>
            ) : (
              <input
                type="number"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={customVal}
                placeholder="Number"
              ></input>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Returns a list of types that are valid to be matched against a given first value type. */
function getSecondValueTypes(firstType: RuleType) {
  if (firstType === RuleType.TEXT_LIST || firstType === RuleType.TEXT) {
    return [RuleType.TEXT, RuleType.TEXT_LIST]
  }
  return [firstType]
}

function MaybeTextListOptions({
  ruleType,
  action,
}: {
  ruleType: RuleType
  action: RulePossibility | undefined
}) {
  if (action == null || ruleType !== RuleType.TEXT_LIST) {
    return
  }

  if (
    [
      RulePossibility.COUNT_EQUALS,
      RulePossibility.COUNT_NOT_EQUALS,
      RulePossibility.COUNT_BIGGER,
      RulePossibility.COUNT_SMALLER,
    ].includes(action)
  ) {
    return <option value={CustomParams.CUSTOM_NUMBER}>Count (number)</option>
  }

  return (
    <>
      <option value={CustomParams.CUSTOM_TEXT}>Text</option>
      <option hidden value={CustomParams.CUSTOM_TEXT_LIST}>
        Text (legacy list option)
      </option>
    </>
  )
}

export default RuleInput
