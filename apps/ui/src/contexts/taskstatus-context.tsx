import {
  CollectionHandlerFinishedEventDto,
  CollectionHandlerStartedEventDto,
  MaintainerrEvent,
  RuleExecuteStatusDto,
  RuleHandlerFinishedEventDto,
  RuleHandlerQueueStatusUpdatedEventDto,
  RuleHandlerStartedEventDto,
  TaskStatusDto,
} from '@maintainerr/contracts'
import { useQuery } from '@tanstack/react-query'
import { createContext, use, useState } from 'react'
import { useRuleHandlerStatus } from '../api/rules'
import GetApiHandler from '../utils/ApiHandler'
import { useEvent } from './events-context'

export interface TaskStatusState {
  ruleHandlerRunning?: TaskStatusDto
  collectionHandlerRunning?: TaskStatusDto
  queueStatus?: RuleExecuteStatusDto
}

export const TaskStatusContext = createContext<TaskStatusState | undefined>(
  undefined,
)

export const TaskStatusProvider = (props: any) => {
  const [ruleHandlerRunningState, setRuleHandlerRunningState] =
    useState<TaskStatusDto>()
  const [collectionHandlerRunningState, setCollectionHandlerRunningState] =
    useState<TaskStatusDto>()
  const { data: ruleHandlerStatus } = useRuleHandlerStatus()

  const updateRuleExecutorRunning = (value: boolean, date: Date) => {
    setRuleHandlerRunningState((prev) => {
      if (prev?.time && prev?.time > date) {
        return prev
      } else {
        return {
          time: date,
          running: value,
        }
      }
    })
  }

  const queueStatusState = useEvent<RuleHandlerQueueStatusUpdatedEventDto>(
    MaintainerrEvent.RuleHandlerQueue_StatusUpdated,
  )

  useEvent<RuleHandlerStartedEventDto>(
    MaintainerrEvent.RuleHandler_Started,
    (event) => {
      updateRuleExecutorRunning(true, event.time)
    },
  )

  useEvent<RuleHandlerFinishedEventDto>(
    MaintainerrEvent.RuleHandler_Finished,
    (event) => {
      updateRuleExecutorRunning(false, event.time)
    },
  )

  // Collection handler
  const collectionHandlerStatusQuery = useQuery({
    queryKey: ['taskstatus_collectionhandler'],
    queryFn: async () => {
      return await GetApiHandler<TaskStatusDto>(
        '/tasks/Collection Handler/status',
      )
    },
  })

  const updateCollectionExecutorRunning = (value: boolean, date: Date) => {
    setCollectionHandlerRunningState((prev) => {
      if (prev?.time && prev?.time > date) {
        return prev
      } else {
        return {
          time: date,
          running: value,
        }
      }
    })
  }

  useEvent<CollectionHandlerStartedEventDto>(
    MaintainerrEvent.CollectionHandler_Started,
    (event) => {
      updateCollectionExecutorRunning(true, event.time)
    },
  )

  useEvent<CollectionHandlerFinishedEventDto>(
    MaintainerrEvent.CollectionHandler_Finished,
    (event) => {
      updateCollectionExecutorRunning(false, event.time)
    },
  )

  // Compute derived values inline - React Compiler will optimize
  const ruleHandlerRunning = ruleHandlerRunningState
    ? ruleHandlerRunningState
    : ruleHandlerStatus
      ? ({
          time: new Date(),
          running: ruleHandlerStatus.processingQueue,
        } satisfies TaskStatusDto)
      : undefined

  const collectionHandlerRunning = collectionHandlerRunningState
    ? collectionHandlerRunningState
    : collectionHandlerStatusQuery.data ?? undefined

  const queueStatus = queueStatusState?.data ?? ruleHandlerStatus

  // Compute context value inline - React Compiler will optimize
  const contextValue = {
    ruleHandlerRunning,
    collectionHandlerRunning,
    queueStatus,
  } satisfies TaskStatusState

  return <TaskStatusContext value={contextValue} {...props} />
}

export type TaskStatusContext = {
  ruleHandlerRunning?: boolean
  collectionHandlerRunning?: boolean
  queueStatus?: RuleExecuteStatusDto
}

export const useTaskStatusContext = (): TaskStatusContext => {
  const context = use(TaskStatusContext)

  if (!context) {
    throw new Error(
      'useTaskStatusContext must be used within a TaskStatusProvider',
    )
  }

  return {
    ruleHandlerRunning: context.ruleHandlerRunning?.running,
    collectionHandlerRunning: context.collectionHandlerRunning?.running,
    queueStatus: context.queueStatus,
  }
}
