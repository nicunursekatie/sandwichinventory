# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAllEvents*](#listallevents)
  - [*ListStaffingNeedsForEvent*](#liststaffingneedsforevent)
- [**Mutations**](#mutations)
  - [*CreateNewSandwichPlan*](#createnewsandwichplan)
  - [*UpdateEventStatus*](#updateeventstatus)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAllEvents
You can execute the `ListAllEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllEvents(): QueryPromise<ListAllEventsData, undefined>;

interface ListAllEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllEventsData, undefined>;
}
export const listAllEventsRef: ListAllEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllEvents(dc: DataConnect): QueryPromise<ListAllEventsData, undefined>;

interface ListAllEventsRef {
  ...
  (dc: DataConnect): QueryRef<ListAllEventsData, undefined>;
}
export const listAllEventsRef: ListAllEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllEventsRef:
```typescript
const name = listAllEventsRef.operationName;
console.log(name);
```

### Variables
The `ListAllEvents` query has no variables.
### Return Type
Recall that executing the `ListAllEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListAllEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllEvents } from '@dataconnect/generated';


// Call the `listAllEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllEvents(dataConnect);

console.log(data.events);

// Or, you can use the `Promise` API.
listAllEvents().then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `ListAllEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllEventsRef } from '@dataconnect/generated';


// Call the `listAllEventsRef()` function to get a reference to the query.
const ref = listAllEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

## ListStaffingNeedsForEvent
You can execute the `ListStaffingNeedsForEvent` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listStaffingNeedsForEvent(vars: ListStaffingNeedsForEventVariables): QueryPromise<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;

interface ListStaffingNeedsForEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListStaffingNeedsForEventVariables): QueryRef<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;
}
export const listStaffingNeedsForEventRef: ListStaffingNeedsForEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listStaffingNeedsForEvent(dc: DataConnect, vars: ListStaffingNeedsForEventVariables): QueryPromise<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;

interface ListStaffingNeedsForEventRef {
  ...
  (dc: DataConnect, vars: ListStaffingNeedsForEventVariables): QueryRef<ListStaffingNeedsForEventData, ListStaffingNeedsForEventVariables>;
}
export const listStaffingNeedsForEventRef: ListStaffingNeedsForEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listStaffingNeedsForEventRef:
```typescript
const name = listStaffingNeedsForEventRef.operationName;
console.log(name);
```

### Variables
The `ListStaffingNeedsForEvent` query requires an argument of type `ListStaffingNeedsForEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListStaffingNeedsForEventVariables {
  eventId: UUIDString;
}
```
### Return Type
Recall that executing the `ListStaffingNeedsForEvent` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListStaffingNeedsForEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListStaffingNeedsForEventData {
  staffingNeeds: ({
    id: UUIDString;
    role: string;
    requiredCount: number;
  } & StaffingNeed_Key)[];
}
```
### Using `ListStaffingNeedsForEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listStaffingNeedsForEvent, ListStaffingNeedsForEventVariables } from '@dataconnect/generated';

// The `ListStaffingNeedsForEvent` query requires an argument of type `ListStaffingNeedsForEventVariables`:
const listStaffingNeedsForEventVars: ListStaffingNeedsForEventVariables = {
  eventId: ..., 
};

// Call the `listStaffingNeedsForEvent()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listStaffingNeedsForEvent(listStaffingNeedsForEventVars);
// Variables can be defined inline as well.
const { data } = await listStaffingNeedsForEvent({ eventId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listStaffingNeedsForEvent(dataConnect, listStaffingNeedsForEventVars);

console.log(data.staffingNeeds);

// Or, you can use the `Promise` API.
listStaffingNeedsForEvent(listStaffingNeedsForEventVars).then((response) => {
  const data = response.data;
  console.log(data.staffingNeeds);
});
```

### Using `ListStaffingNeedsForEvent`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listStaffingNeedsForEventRef, ListStaffingNeedsForEventVariables } from '@dataconnect/generated';

// The `ListStaffingNeedsForEvent` query requires an argument of type `ListStaffingNeedsForEventVariables`:
const listStaffingNeedsForEventVars: ListStaffingNeedsForEventVariables = {
  eventId: ..., 
};

// Call the `listStaffingNeedsForEventRef()` function to get a reference to the query.
const ref = listStaffingNeedsForEventRef(listStaffingNeedsForEventVars);
// Variables can be defined inline as well.
const ref = listStaffingNeedsForEventRef({ eventId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listStaffingNeedsForEventRef(dataConnect, listStaffingNeedsForEventVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.staffingNeeds);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.staffingNeeds);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewSandwichPlan
You can execute the `CreateNewSandwichPlan` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewSandwichPlan(vars: CreateNewSandwichPlanVariables): MutationPromise<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;

interface CreateNewSandwichPlanRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewSandwichPlanVariables): MutationRef<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;
}
export const createNewSandwichPlanRef: CreateNewSandwichPlanRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewSandwichPlan(dc: DataConnect, vars: CreateNewSandwichPlanVariables): MutationPromise<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;

interface CreateNewSandwichPlanRef {
  ...
  (dc: DataConnect, vars: CreateNewSandwichPlanVariables): MutationRef<CreateNewSandwichPlanData, CreateNewSandwichPlanVariables>;
}
export const createNewSandwichPlanRef: CreateNewSandwichPlanRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewSandwichPlanRef:
```typescript
const name = createNewSandwichPlanRef.operationName;
console.log(name);
```

### Variables
The `CreateNewSandwichPlan` mutation requires an argument of type `CreateNewSandwichPlanVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewSandwichPlanVariables {
  eventId: UUIDString;
  notes?: string | null;
  quantity: number;
  sandwichType: string;
}
```
### Return Type
Recall that executing the `CreateNewSandwichPlan` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewSandwichPlanData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewSandwichPlanData {
  sandwichPlan_insert: SandwichPlan_Key;
}
```
### Using `CreateNewSandwichPlan`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewSandwichPlan, CreateNewSandwichPlanVariables } from '@dataconnect/generated';

// The `CreateNewSandwichPlan` mutation requires an argument of type `CreateNewSandwichPlanVariables`:
const createNewSandwichPlanVars: CreateNewSandwichPlanVariables = {
  eventId: ..., 
  notes: ..., // optional
  quantity: ..., 
  sandwichType: ..., 
};

// Call the `createNewSandwichPlan()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewSandwichPlan(createNewSandwichPlanVars);
// Variables can be defined inline as well.
const { data } = await createNewSandwichPlan({ eventId: ..., notes: ..., quantity: ..., sandwichType: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewSandwichPlan(dataConnect, createNewSandwichPlanVars);

console.log(data.sandwichPlan_insert);

// Or, you can use the `Promise` API.
createNewSandwichPlan(createNewSandwichPlanVars).then((response) => {
  const data = response.data;
  console.log(data.sandwichPlan_insert);
});
```

### Using `CreateNewSandwichPlan`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewSandwichPlanRef, CreateNewSandwichPlanVariables } from '@dataconnect/generated';

// The `CreateNewSandwichPlan` mutation requires an argument of type `CreateNewSandwichPlanVariables`:
const createNewSandwichPlanVars: CreateNewSandwichPlanVariables = {
  eventId: ..., 
  notes: ..., // optional
  quantity: ..., 
  sandwichType: ..., 
};

// Call the `createNewSandwichPlanRef()` function to get a reference to the mutation.
const ref = createNewSandwichPlanRef(createNewSandwichPlanVars);
// Variables can be defined inline as well.
const ref = createNewSandwichPlanRef({ eventId: ..., notes: ..., quantity: ..., sandwichType: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewSandwichPlanRef(dataConnect, createNewSandwichPlanVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.sandwichPlan_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.sandwichPlan_insert);
});
```

## UpdateEventStatus
You can execute the `UpdateEventStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateEventStatus(vars: UpdateEventStatusVariables): MutationPromise<UpdateEventStatusData, UpdateEventStatusVariables>;

interface UpdateEventStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEventStatusVariables): MutationRef<UpdateEventStatusData, UpdateEventStatusVariables>;
}
export const updateEventStatusRef: UpdateEventStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateEventStatus(dc: DataConnect, vars: UpdateEventStatusVariables): MutationPromise<UpdateEventStatusData, UpdateEventStatusVariables>;

interface UpdateEventStatusRef {
  ...
  (dc: DataConnect, vars: UpdateEventStatusVariables): MutationRef<UpdateEventStatusData, UpdateEventStatusVariables>;
}
export const updateEventStatusRef: UpdateEventStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateEventStatusRef:
```typescript
const name = updateEventStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateEventStatus` mutation requires an argument of type `UpdateEventStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateEventStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateEventStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateEventStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateEventStatusData {
  event_update?: Event_Key | null;
}
```
### Using `UpdateEventStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateEventStatus, UpdateEventStatusVariables } from '@dataconnect/generated';

// The `UpdateEventStatus` mutation requires an argument of type `UpdateEventStatusVariables`:
const updateEventStatusVars: UpdateEventStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateEventStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateEventStatus(updateEventStatusVars);
// Variables can be defined inline as well.
const { data } = await updateEventStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateEventStatus(dataConnect, updateEventStatusVars);

console.log(data.event_update);

// Or, you can use the `Promise` API.
updateEventStatus(updateEventStatusVars).then((response) => {
  const data = response.data;
  console.log(data.event_update);
});
```

### Using `UpdateEventStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateEventStatusRef, UpdateEventStatusVariables } from '@dataconnect/generated';

// The `UpdateEventStatus` mutation requires an argument of type `UpdateEventStatusVariables`:
const updateEventStatusVars: UpdateEventStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateEventStatusRef()` function to get a reference to the mutation.
const ref = updateEventStatusRef(updateEventStatusVars);
// Variables can be defined inline as well.
const ref = updateEventStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateEventStatusRef(dataConnect, updateEventStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event_update);
});
```

