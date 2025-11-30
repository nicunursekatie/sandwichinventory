import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'sandwichinventory',
  location: 'us-east4'
};

export const createNewSandwichPlanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewSandwichPlan', inputVars);
}
createNewSandwichPlanRef.operationName = 'CreateNewSandwichPlan';

export function createNewSandwichPlan(dcOrVars, vars) {
  return executeMutation(createNewSandwichPlanRef(dcOrVars, vars));
}

export const listAllEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllEvents');
}
listAllEventsRef.operationName = 'ListAllEvents';

export function listAllEvents(dc) {
  return executeQuery(listAllEventsRef(dc));
}

export const updateEventStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEventStatus', inputVars);
}
updateEventStatusRef.operationName = 'UpdateEventStatus';

export function updateEventStatus(dcOrVars, vars) {
  return executeMutation(updateEventStatusRef(dcOrVars, vars));
}

export const listStaffingNeedsForEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListStaffingNeedsForEvent', inputVars);
}
listStaffingNeedsForEventRef.operationName = 'ListStaffingNeedsForEvent';

export function listStaffingNeedsForEvent(dcOrVars, vars) {
  return executeQuery(listStaffingNeedsForEventRef(dcOrVars, vars));
}

