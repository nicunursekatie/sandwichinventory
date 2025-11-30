# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createNewSandwichPlan, listAllEvents, updateEventStatus, listStaffingNeedsForEvent } from '@dataconnect/generated';


// Operation CreateNewSandwichPlan:  For variables, look at type CreateNewSandwichPlanVars in ../index.d.ts
const { data } = await CreateNewSandwichPlan(dataConnect, createNewSandwichPlanVars);

// Operation ListAllEvents: 
const { data } = await ListAllEvents(dataConnect);

// Operation UpdateEventStatus:  For variables, look at type UpdateEventStatusVars in ../index.d.ts
const { data } = await UpdateEventStatus(dataConnect, updateEventStatusVars);

// Operation ListStaffingNeedsForEvent:  For variables, look at type ListStaffingNeedsForEventVars in ../index.d.ts
const { data } = await ListStaffingNeedsForEvent(dataConnect, listStaffingNeedsForEventVars);


```