import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateNewSandwichPlanData {
  sandwichPlan_insert: SandwichPlan_Key;
}

export interface CreateNewSandwichPlanVariables {
  eventId: UUIDString;
  notes?: string | null;
  quantity: number;
  sandwichType: string;
}

export interface DistributionPlan_Key {
  id: UUIDString;
  __typename?: 'DistributionPlan_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface ListAllEventsData {
  events: ({
    id: UUIDString;
    address: string;
    contactEmail: string;
    contactName: string;
    contactPhone?: string | null;
    createdAt: TimestampString;
    department: string;
    description?: string | null;
    eventDate: DateString;
    eventTime: string;
    groupName: string;
    status: string;
  } & Event_Key)[];
}

export interface ListStaffingNeedsForEventData {
  staffingNeeds: ({
    id: UUIDString;
    role: string;
    requiredCount: number;
  } & StaffingNeed_Key)[];
}

export interface ListStaffingNeedsForEventVariables {
  eventId: UUIDString;
}

export interface SandwichPlan_Key {
  id: UUIDString;
  __typename?: 'SandwichPlan_Key';
}

export interface StaffingNeed_Key {
  id: UUIDString;
  __typename?: 'StaffingNeed_Key';
}

export interface UpdateEventStatusData {
  event_update?: Event_Key | null;
}

export interface UpdateEventStatusVariables {
  id: UUIDString;
  status: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewSandwichPlanRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewSandwichPlanVariables): MutationRef<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewSandwichPlanVariables): MutationRef<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;
  operationName: string;
}
export const createNewSandwichPlanRef: CreateNewSandwichPlanRef;

export function createNewSandwichPlan(vars: CreateNewSandwichPlanVariables): MutationPromise<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;
export function createNewSandwichPlan(dc: DataConnect, vars: CreateNewSandwichPlanVariables): MutationPromise<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;

interface ListAllEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllEventsData, undefined>;
  operationName: string;
}
export const listAllEventsRef: ListAllEventsRef;

export function listAllEvents(): QueryPromise<ListAllEventsData, undefined>;
export function listAllEvents(dc: DataConnect): QueryPromise<ListAllEventsData, undefined>;

interface UpdateEventStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEventStatusVariables): MutationRef<UpdateEventStatusData, UpdateEventStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEventStatusVariables): MutationRef<UpdateEventStatusData, UpdateEventStatusVariables>;
  operationName: string;
}
export const updateEventStatusRef: UpdateEventStatusRef;

export function updateEventStatus(vars: UpdateEventStatusVariables): MutationPromise<UpdateEventStatusData, UpdateEventStatusVariables>;
export function updateEventStatus(dc: DataConnect, vars: UpdateEventStatusVariables): MutationPromise<UpdateEventStatusData, UpdateEventStatusVariables>;

interface ListStaffingNeedsForEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListStaffingNeedsForEventVariables): QueryRef<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListStaffingNeedsForEventVariables): QueryRef<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;
  operationName: string;
}
export const listStaffingNeedsForEventRef: ListStaffingNeedsForEventRef;

export function listStaffingNeedsForEvent(vars: ListStaffingNeedsForEventVariables): QueryPromise<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;
export function listStaffingNeedsForEvent(dc: DataConnect, vars: ListStaffingNeedsForEventVariables): QueryPromise<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;

