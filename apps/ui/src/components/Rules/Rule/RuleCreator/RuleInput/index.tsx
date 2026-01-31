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

/** Filter apps based on server selection and media server type */
const shouldFilterApplication = (
  appId: number,
  radarrSettingsId: number | null | undefined,
  sonarrSettingsId: number | null | undefined,
  isPlex: boolean,
  isJellyfin: boolean,
): boolean => {
  if (appId === Application.RADARR && radarrSettingsId == null) return true
  if (appId === Application.SONARR && sonarrSettingsId == null) return true
  if (
    isJellyfin &&
    (appId === Application.PLEX || appId === Application.TAUTULLI)
  )
    return true
  if (isPlex && appId === Application.JELLYFIN) return true
  return false
}

/** Parse editData to extract initial secondVal and customVal */
const parseEditData = (
  rule: IRule | undefined,
): { secondVal?: string; customVal?: string } => {
  if (!rule) return {}
  if (!rule.customVal) return { secondVal: JSON.stringify(rule.lastVal) }

  const { ruleTypeId, value } = rule.customVal
  const customVal = value.toString()
  const typeMap: Record<number, CustomParams> = {
    // TODO: This is a hack to distinguish "amount of days" from raw numbers.
    // When ruleTypeId is 0 (NUMBER), we check if value is divisible by 86400 (seconds/day).
    // Proper fix: store the secondVal type (CUSTOM_DAYS vs CUSTOM_NUMBER) in the rule schema
    // and run a migration to update existing rules.
    0:
      (value as number) % 86400 === 0 && value !== 0
        ? CustomParams.CUSTOM_DAYS
        : CustomParams.CUSTOM_NUMBER,
    1: CustomParams.CUSTOM_DATE,
    2: CustomParams.CUSTOM_TEXT,
    3: CustomParams.CUSTOM_BOOLEAN,
    4: CustomParams.CUSTOM_TEXT_LIST,
  }
  return { secondVal: typeMap[ruleTypeId], customVal }
}

const RuleInput = (props: IRuleInput) => {
  const { data: constants, isLoading: constantsLoading } = useRuleConstants()
  const { isPlex, isJellyfin } = useMediaServerType()

  // Initialize state from editData (lazy initializers run once on mount)
  const isNewlyAdded = props.id != null && props.newlyAdded?.includes(props.id)
  const initialRule = !isNewlyAdded ? props.editData?.rule : undefined
  const initialParsed = parseEditData(initialRule)

  const [operator, setOperator] = useState(() =>
    initialRule?.operator?.toString(),
  )
  const [firstval, setFirstVal] = useState(() =>
    initialRule ? JSON.stringify(initialRule.firstVal) : undefined,
  )
  const [action, setAction] = useState<RulePossibility | undefined>(
    () => initialRule?.action,
  )
  const [secondVal, setSecondVal] = useState(() => initialParsed.secondVal)
  const [customVal, setCustomVal] = useState(() => initialParsed.customVal)
  // Track last known valid ruleType and possibilities for UI continuity
  const [lastRuleType, setLastRuleType] = useState<RuleType>(RuleType.NUMBER)
  const [lastPossibilities, setLastPossibilities] = useState<RulePossibility[]>(
    [],
  )

  // Helper to get property from [appId, propId] tuple
  const getProp = (value: string | undefined): IProperty | undefined => {
    if (!value || !constants) return undefined
    const [appId, propId] = JSON.parse(value) as [number, number]
    const application = constants.applications?.find((a) => a.id === appId)
    if (!application) return undefined
    if (
      shouldFilterApplication(
        application.id,
        props.radarrSettingsId,
        props.sonarrSettingsId,
        isPlex,
        isJellyfin,
      )
    )
      return undefined
    if (
      application.mediaType !== MediaType.BOTH &&
      props.mediaType !== application.mediaType
    )
      return undefined
    const prop = application.props.find((p) => p.id === propId)
    if (!prop) return undefined
    if (prop.mediaType !== MediaType.BOTH && props.mediaType !== prop.mediaType)
      return undefined
    if (
      props.mediaType !== MediaType.MOVIE &&
      prop.showType &&
      !prop.showType.includes(props.dataType!)
    )
      return undefined
    return prop
  }

  // Derived values computed during render (not stored in state)
  const currentProp = getProp(firstval)
  const ruleType = currentProp
    ? (+currentProp.type.key as RuleType)
    : lastRuleType
  // Update last known values when we have a valid property - done via event handlers, not during render
  const possibilities = currentProp?.type.possibilities ?? lastPossibilities

  const effectiveFirstval = isNewlyAdded
    ? undefined
    : currentProp
      ? firstval
      : undefined
  const effectiveSecondVal = effectiveFirstval ? secondVal : undefined
  const effectiveCustomValBase = effectiveFirstval ? customVal : undefined
  const effectiveCustomVal =
    effectiveSecondVal === CustomParams.CUSTOM_BOOLEAN &&
    effectiveCustomValBase !== '0'
      ? (effectiveCustomValBase ?? '1')
      : effectiveCustomValBase

  // Derive customValActive and customValType from secondVal
  const customValMapping: Record<string, { active: true; type: RuleType }> = {
    [CustomParams.CUSTOM_NUMBER]: { active: true, type: RuleType.NUMBER },
    [CustomParams.CUSTOM_DATE]: { active: true, type: RuleType.DATE },
    [CustomParams.CUSTOM_DAYS]: { active: true, type: RuleType.TEXT },
    [CustomParams.CUSTOM_TEXT]: { active: true, type: RuleType.TEXT },
    [CustomParams.CUSTOM_TEXT_LIST]: { active: true, type: RuleType.TEXT_LIST },
    [CustomParams.CUSTOM_BOOLEAN]: { active: true, type: RuleType.BOOL },
  }
  const { active: customValActive, type: customValType } =
    effectiveSecondVal && customValMapping[effectiveSecondVal]
      ? customValMapping[effectiveSecondVal]
      : { active: false, type: undefined }

  // Submit rule to parent - accepts overrides for values being updated in the same handler
  const submit = (
    overrides: {
      firstval?: string
      action?: RulePossibility
      secondVal?: string
      customVal?: string
      operator?: string
    } = {},
  ) => {
    const currentFirstval =
      overrides.firstval !== undefined ? overrides.firstval : effectiveFirstval
    const currentAction =
      overrides.action !== undefined ? overrides.action : action
    const currentSecondVal =
      overrides.secondVal !== undefined
        ? overrides.secondVal
        : effectiveSecondVal
    const currentCustomVal =
      overrides.customVal !== undefined
        ? overrides.customVal
        : effectiveCustomVal
    const currentOperator =
      overrides.operator !== undefined ? overrides.operator : operator

    const isCustomParam = (v: string | undefined) =>
      v && Object.values(CustomParams).includes(v as CustomParams)
    const isComplete =
      currentFirstval &&
      currentAction != null &&
      (currentCustomVal ||
        (currentSecondVal && !isCustomParam(currentSecondVal)))

    if (!isComplete) {
      props.onIncomplete(props.id ?? 0)
      return
    }

    const ruleValues = {
      operator: currentOperator ?? null,
      firstVal: JSON.parse(currentFirstval!),
      action: currentAction!,
      section: props.section ? props.section - 1 : 0,
    }

    if (currentCustomVal) {
      // Derive customValActive/Type from currentSecondVal
      const currentMapping = currentSecondVal
        ? customValMapping[currentSecondVal]
        : undefined
      const currentCustomValType = currentMapping?.type

      const ruleTypeId =
        currentCustomValType != null
          ? currentSecondVal === CustomParams.CUSTOM_DAYS
            ? RuleType.NUMBER
            : currentCustomValType
          : ruleType
      props.onCommit(props.id ?? 0, {
        customVal: { ruleTypeId, value: currentCustomVal },
        ...ruleValues,
      })
    } else {
      props.onCommit(props.id ?? 0, {
        lastVal: JSON.parse(currentSecondVal!),
        ...ruleValues,
      })
    }
  }

  const scheduleSubmit = (
    overrides: {
      firstval?: string
      action?: RulePossibility
      secondVal?: string
      customVal?: string
      operator?: string
    } = {},
  ) => {
    // Use queueMicrotask to batch the submit call
    queueMicrotask(() => {
      submit(overrides)
    })
  }

  // Handle initial submit and invalid firstval detection
  // Using useState lazy initializer pattern with a one-time effect via queueMicrotask
  const [initState] = useState(() => {
    // Schedule initial submit after first render
    queueMicrotask(() => {
      submit({})
    })
    return true
  })
  // Suppress unused variable warning
  void initState

  // Handle invalid firstval - when constants load and firstval is no longer valid
  // This is done through state rather than refs to avoid render-time ref access
  const needsClear = firstval && constants && !constantsLoading && !currentProp
  const [lastClearedFirstval, setLastClearedFirstval] = useState<
    string | undefined
  >(undefined)

  if (needsClear && lastClearedFirstval !== firstval) {
    // Schedule the clear for next microtask to avoid setState during render
    queueMicrotask(() => {
      setLastClearedFirstval(firstval)
      setFirstVal(undefined)
      submit({ firstval: undefined })
    })
  }

  // Event handlers - pass new values directly to submit to avoid stale closure issues
  const updateFirstValue = (e: { target: { value: string } }) => {
    const newVal = e.target.value || undefined
    const newProp = getProp(newVal)
    const newType = newProp ? (+newProp.type.key as RuleType) : undefined

    // Update last known values for UI continuity when property changes
    if (newProp) {
      setLastRuleType(newType!)
      setLastPossibilities(newProp.type.possibilities)
    }

    // Reset secondVal/customVal if rule type changed
    let newSecondVal = secondVal
    let newCustomVal = customVal
    if (newType && newType !== ruleType) {
      newSecondVal = undefined
      newCustomVal = undefined
      setSecondVal(undefined)
      setCustomVal(undefined)
    }
    setFirstVal(newVal)
    submit({
      firstval: newVal,
      secondVal: newSecondVal,
      customVal: newCustomVal,
    })
  }

  const updateSecondValue = (e: { target: { value: string } }) => {
    const newVal = e.target.value || undefined
    setSecondVal(newVal)

    // Handle boolean default and clear customVal for non-custom selections
    let newCustomVal = effectiveCustomVal
    if (newVal === CustomParams.CUSTOM_BOOLEAN && newCustomVal !== '0') {
      newCustomVal = '1'
      setCustomVal('1')
    } else if (!newVal || !customValMapping[newVal]) {
      newCustomVal = undefined
      setCustomVal(undefined)
    }
    submit({ secondVal: newVal, customVal: newCustomVal })
  }

  const updateCustomValue = (e: { target: { value: string } }) => {
    const newVal =
      secondVal === CustomParams.CUSTOM_DAYS
        ? (+e.target.value * 86400).toString()
        : e.target.value
    setCustomVal(newVal)
    submit({ customVal: newVal })
  }

  const updateAction = (e: { target: { value: string } }) => {
    const newVal =
      e.target.value === '' ? undefined : (+e.target.value as RulePossibility)
    setAction(newVal)
    submit({ action: newVal })
  }

  const updateOperator = (e: { target: { value: string } }) => {
    const newVal = e.target.value || undefined
    setOperator(newVal)
    submit({ operator: newVal })
  }

  const onDelete = (e: FormEvent | null) => {
    e?.preventDefault()
    props.onDelete(props.section ?? 0, props.id ?? 0)
  }

  if (!constants || constantsLoading) return <LoadingSpinner />

  return (
    <div className="w-full rounded-2xl bg-zinc-800 p-4 text-zinc-100 shadow-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-600">
          Rule #{props.tagId ?? props.id ?? 1}
        </h3>

        {props.allowDelete && (
          <button
            className="flex items-center rounded-lg bg-red-600 px-3 py-1 text-zinc-100 shadow-md hover:bg-red-500"
            onClick={onDelete}
            title={`Remove rule ${props.tagId}, section ${props.section}`}
          >
            <TrashIcon className="mr-1 h-5 w-5" />
            Delete
          </button>
        )}
      </div>

      {props.id !== 1 &&
        ((props.id && props.id > 0) ||
          (props.section && props.section > 1)) && (
          <div className="mb-3 mt-2 md:flex md:items-center">
            <label htmlFor="operator">
              {!props.id || (props.tagId ?? props.id) === 1
                ? 'Section Operator'
                : 'Operator'}
            </label>
            <div className="md:ml-4">
              <select
                name="operator"
                id="operator"
                onChange={updateOperator}
                value={operator ?? ''}
              >
                <option value=""> </option>
                {Object.keys(RuleOperators)
                  .filter((v) => !isNaN(+v))
                  .map((_, key) => (
                    <option key={key} value={key}>
                      {RuleOperators[key]}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

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
            value={effectiveFirstval ?? ''}
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
                    {app.props
                      .filter(
                        (prop) =>
                          (prop.mediaType === MediaType.BOTH ||
                            props.mediaType === prop.mediaType) &&
                          (props.mediaType === MediaType.MOVIE ||
                            !prop.showType ||
                            prop.showType.includes(props.dataType!)),
                      )
                      .map((prop) => (
                        <option
                          key={`${app.id}-${prop.id}`}
                          value={JSON.stringify([app.id, prop.id])}
                        >
                          {`${app.name} - ${prop.humanName}`}
                        </option>
                      ))}
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
            value={action ?? ''}
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
            value={effectiveSecondVal ?? ''}
            className="w-full rounded-lg p-2 text-zinc-100 focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="" className="text-amber-600">
              Select Second Value...
            </option>
            <optgroup label="Custom values">
              {ruleType === RuleType.DATE && (
                <>
                  <option value={CustomParams.CUSTOM_DAYS}>
                    Amount of days
                  </option>
                  {action != null &&
                    action !== RulePossibility.IN_LAST &&
                    action !== RulePossibility.IN_NEXT && (
                      <option value={CustomParams.CUSTOM_DATE}>
                        Specific date
                      </option>
                    )}
                </>
              )}
              {ruleType === RuleType.NUMBER && (
                <option value={CustomParams.CUSTOM_NUMBER}>Number</option>
              )}
              {ruleType === RuleType.BOOL && (
                <option value={CustomParams.CUSTOM_BOOLEAN}>Boolean</option>
              )}
              {ruleType === RuleType.TEXT && (
                <option value={CustomParams.CUSTOM_TEXT}>Text</option>
              )}
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
              .map((app) =>
                (app.mediaType === MediaType.BOTH ||
                  props.mediaType === app.mediaType) &&
                action != null &&
                action !== RulePossibility.IN_LAST &&
                action !== RulePossibility.IN_NEXT ? (
                  <optgroup key={app.id} label={app.name}>
                    {app.props
                      .filter((prop) => {
                        const validTypes = getSecondValueTypes(ruleType)
                        return (
                          validTypes.includes(+prop.type.key as RuleType) &&
                          (prop.mediaType === MediaType.BOTH ||
                            props.mediaType === prop.mediaType) &&
                          (props.mediaType === MediaType.MOVIE ||
                            !prop.showType ||
                            prop.showType.includes(props.dataType!))
                        )
                      })
                      .map((prop) => (
                        <option
                          key={`${app.id}-${prop.id}`}
                          value={JSON.stringify([app.id, prop.id])}
                        >
                          {`${app.name} - ${prop.humanName}`}
                        </option>
                      ))}
                  </optgroup>
                ) : null,
              )}
          </select>
        </div>

        {/* Custom Value Input */}
        {customValActive && (
          <div className="mb-2">
            <label
              htmlFor="custom_val"
              className="mb-1 block text-sm font-medium"
            >
              Custom Value
            </label>
            {customValType === RuleType.TEXT &&
            effectiveSecondVal === CustomParams.CUSTOM_DAYS ? (
              <input
                type="number"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={effectiveCustomVal ? +effectiveCustomVal / 86400 : ''}
                placeholder="Amount of days"
              />
            ) : (customValType === RuleType.TEXT &&
                effectiveSecondVal === CustomParams.CUSTOM_TEXT) ||
              customValType === RuleType.TEXT_LIST ? (
              <input
                type="text"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={effectiveCustomVal ?? ''}
                placeholder="Text"
              />
            ) : customValType === RuleType.DATE ? (
              <input
                type="date"
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={effectiveCustomVal ?? ''}
                placeholder="Date"
              />
            ) : customValType === RuleType.BOOL ? (
              <select
                name="custom_val"
                id="custom_val"
                onChange={updateCustomValue}
                value={effectiveCustomVal ?? '1'}
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
                value={effectiveCustomVal ?? ''}
                placeholder="Number"
              />
            )}
          </div>
        )}
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
      {/* This was accidentally shipped - we keep it as a hidden option so that it still appears in
          the UI if somebody had already selected it, but we don't want it to be able to be selected
          in new rules. We should run a migration at some point to update all
          "customValue { type: 'text list' }" to "customValue { type: text }". */}
      <option hidden value={CustomParams.CUSTOM_TEXT_LIST}>
        Text (legacy list option)
      </option>
    </>
  )
}

export default RuleInput
