import { ClipboardListIcon, DocumentAddIcon } from '@heroicons/react/solid'
import { type MediaItemType, MediaType } from '@maintainerr/contracts'
import { useState } from 'react'
import Alert from '../../../Common/Alert'
import SectionHeading from '../../../Common/SectionHeading'
import RuleInput from './RuleInput'

interface IRulesToCreate {
  id: number
  rule: IRule
}

export interface IRule {
  operator: string | null
  firstVal: [string, string]
  lastVal?: [string, string]
  section?: number
  customVal?: { ruleTypeId: number; value: string | number }
  action: number
}

export interface ILoadedRule {
  uniqueID: number
  rules: IRule[]
}

interface iRuleCreator {
  mediaType?: MediaType
  dataType?: MediaItemType
  editData?: { rules: IRule[] }
  onUpdate: (rules: IRule[]) => void
  onCancel: () => void
  radarrSettingsId?: number | null
  sonarrSettingsId?: number | null
}

const calculateRuleAmount = (
  data: { rules: IRule[] } | undefined,
  sections: number,
): [number, number[]] => {
  const sectionAmounts = [] as number[]
  if (data) {
    data.rules.forEach((el) =>
      el.section !== undefined
        ? sectionAmounts[el.section]
          ? sectionAmounts[el.section]++
          : (sectionAmounts[el.section] = 1)
        : (sectionAmounts[0] = 1),
    )
  }

  return [
    sections,
    sectionAmounts.filter((el) => el !== undefined && el !== null),
  ]
}

const calculateRuleAmountArr = (ruleAmount: [number, number[]]) => {
  let s = 0,
    r = 0
  const lenS = ruleAmount[0]

  const worker: [number[], [number[]]] = [[], [[]]]

  while (++s <= lenS) {
    worker[0].push(s)
    if (s > 1) {
      worker[1].push([])
    }
  }

  for (const sec of worker[0]) {
    r = 0
    while (++r <= ruleAmount[1][sec - 1]) worker[1][sec - 1].push(r)
  }

  return worker
}

const RuleCreator = (props: iRuleCreator) => {
  const initialSections =
    props.editData &&
    Array.isArray(props.editData.rules) &&
    props.editData.rules.length > 0
      ? props.editData.rules[props.editData.rules.length - 1].section! + 1
      : undefined
  const initialRuleAmount: [number, number[]] = initialSections
    ? calculateRuleAmount(props.editData, initialSections)
    : [1, [1]]

  const [ruleAmount, setRuleAmount] =
    useState<[number, number[]]>(initialRuleAmount)
  const [editData, setEditData] = useState<{ rules: IRule[] } | undefined>(
    props.editData,
  )
  const [ruleAmountArr, setRuleAmountArr] = useState<[number[], [number[]]]>(
    calculateRuleAmountArr(initialRuleAmount),
  )
  const [deleted, setDeleted] = useState(0)
  const [added, setAdded] = useState<number[]>(initialSections ? [] : [1])
  // Track created rules as state instead of ref to allow render-time access
  const [rulesCreated, setRulesCreated] = useState<IRulesToCreate[]>([])

  const ruleCommited = (id: number, rule: IRule) => {
    setRulesCreated((prev) => {
      const rules = prev.filter((el) => el.id !== id)
      const toCommit = [...rules, { id: id, rule: rule }].sort(
        (a, b) => a.id - b.id,
      )
      props.onUpdate(toCommit.map((el) => el.rule))
      return toCommit
    })
    setAdded((prev) => prev.filter((e) => e !== id))
  }

  const ruleOmitted = (id: number) => {
    setRulesCreated((prev) => {
      const rules = prev.filter((el) => el.id !== id)
      props.onUpdate(rules.map((el) => el.rule))
      return rules
    })
  }

  const ruleDeleted = (section = 0, id: number) => {
    setRulesCreated((prev) => {
      if (prev.length === 0) return prev

      let rules = prev.filter((el) => el.id !== id)
      const section1IsEmpty = !rules.some((r) => r.rule.section === 0)

      rules = rules.map((e) => {
        const newE = { ...e, rule: { ...e.rule } }
        newE.id = newE.id > id ? newE.id - 1 : newE.id

        if (section1IsEmpty && section === 1 && newE.rule.section) {
          newE.rule.section -= 1
        }

        return newE
      })

      props.onUpdate(rules.map((el) => el.rule))
      setEditData({ rules: rules.map((el) => el.rule) })
      return rules
    })

    setAdded((prev) =>
      prev.filter((e) => e !== id).map((e) => (e > id ? e - 1 : e)),
    )

    const rules = [...ruleAmount[1]]
    rules[section - 1] = rules[section - 1] - 1

    // Find sections that still contain rules
    const nonEmptySections = rules.filter((e) => e > 0)

    // Update the rule count while ensuring at least one section remains
    updateRuleAmount([
      nonEmptySections.length,
      nonEmptySections.length > 0 ? nonEmptySections : [1],
    ])

    setDeleted((prev) => prev + 1)
  }

  const RuleAdded = (section: number) => {
    const ruleId =
      ruleAmount[1].reduce((prev, cur, idx) =>
        idx + 1 <= section ? prev + cur : prev,
      ) + 1

    setAdded((prev) => [...prev, ruleId])

    setRulesCreated((prev) =>
      prev.map((e) => {
        if (e.id >= ruleId) {
          return { ...e, id: e.id + 1 }
        }
        return e
      }),
    )

    const rules = [...ruleAmount[1]]
    rules[section - 1] = rules[section - 1] + 1

    updateRuleAmount([ruleAmount[0], rules])
  }

  const addSection = () => {
    const rules = [...ruleAmount[1]]
    rules.push(1)

    const ruleId =
      ruleAmount[1].reduce((prev, cur, idx) =>
        idx + 1 <= ruleAmount[0] + 1 ? prev + cur : prev,
      ) + 1
    setAdded((prev) => [...prev, ruleId])

    updateRuleAmount([ruleAmount[0] + 1, rules])
  }

  const updateRuleAmount = (ruleAmount: [number, number[]]) => {
    setRuleAmountArr(calculateRuleAmountArr(ruleAmount))
    setRuleAmount(ruleAmount)
  }

  return (
    <div className="text-zinc-100">
      {ruleAmountArr[0].map((sid) => {
        return (
          <div key={`${sid}-${deleted}`} className="mb-4">
            <div className="rounded-lg bg-zinc-700 px-6 py-0.5 shadow-md">
              <SectionHeading id={sid} name={'Section'} />
              <div className="flex flex-col space-y-2">
                {ruleAmountArr[1][sid - 1].map((id) => (
                  <div
                    key={`${sid}-${id}`}
                    className="flex w-full flex-col items-start"
                  >
                    <div className="mb-4 w-full">
                      <RuleInput
                        key={`${sid}-${id}`}
                        id={
                          ruleAmount[1].length > 1
                            ? ruleAmount[1].reduce((pv, cv, idx) =>
                                sid === 1
                                  ? cv - (cv - id)
                                  : idx <= sid - 1
                                    ? idx === sid - 1
                                      ? cv - (cv - id) + pv
                                      : cv + pv
                                    : pv,
                              )
                            : ruleAmount[1][0] - (ruleAmount[1][0] - id)
                        }
                        tagId={id}
                        editData={
                          editData
                            ? {
                                rule: editData.rules[
                                  (ruleAmount[1].length > 1
                                    ? ruleAmount[1].reduce((pv, cv, idx) =>
                                        sid === 1
                                          ? cv - (cv - id)
                                          : idx <= sid - 1
                                            ? idx === sid - 1
                                              ? cv - (cv - id) + pv
                                              : cv + pv
                                            : pv,
                                      )
                                    : ruleAmount[1][0] -
                                      (ruleAmount[1][0] - id)) - 1
                                ],
                              }
                            : undefined
                        }
                        section={sid}
                        newlyAdded={added}
                        mediaType={props.mediaType}
                        dataType={props.dataType}
                        radarrSettingsId={props.radarrSettingsId}
                        sonarrSettingsId={props.sonarrSettingsId}
                        onCommit={ruleCommited}
                        onIncomplete={ruleOmitted}
                        onDelete={ruleDeleted}
                        allowDelete={
                          ruleAmount[0] > 1 || ruleAmount[1][sid - 1] > 1
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {added.length <= 0 ? (
                <div className="mb-2 flex w-full justify-end">
                  <button
                    type="button"
                    className="flex h-8 rounded bg-amber-600 text-zinc-200 shadow-md hover:bg-amber-500"
                    onClick={() => RuleAdded(sid)}
                    title={`Add a new rule to Section ${sid}`}
                  >
                    <DocumentAddIcon className="m-auto ml-5 h-5" />
                    <p className="button-text m-auto ml-1 mr-5 text-zinc-200">
                      Add Rule
                    </p>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )
      })}

      {added.length <= 0 ? (
        <div className="mb-3 mt-3 flex w-full">
          <div className="m-auto xl:m-0">
            <button
              type="button"
              className="flex h-8 rounded bg-amber-600 text-zinc-200 shadow-md hover:bg-amber-500"
              onClick={addSection}
              title={`Add a new section`}
            >
              <ClipboardListIcon className="m-auto ml-5 h-5" />
              <p className="button-text m-auto ml-1 mr-5 text-zinc-200">
                New Section
              </p>
            </button>
          </div>
        </div>
      ) : undefined}

      {rulesCreated.length !== ruleAmount[1].reduce((pv, cv) => pv + cv) ? (
        <div className="max-width-form-head mt-5">
          <Alert>{`Some incomplete rules won't be saved`} </Alert>
        </div>
      ) : undefined}
    </div>
  )
}

export default RuleCreator
