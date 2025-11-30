const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'sandwichinventory',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createNewSandwichPlanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewSandwichPlan', inputVars);
}
createNewSandwichPlanRef.operationName = 'CreateNewSandwichPlan';
exports.createNewSandwichPlanRef = createNewSandwichPlanRef;

exports.createNewSandwichPlan = function createNewSandwichPlan(dcOrVars, vars) {
  return executeMutation(createNewSandwichPlanRef(dcOrVars, vars));
};

const listAllEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllEvents');
}
listAllEventsRef.operationName = 'ListAllEvents';
exports.listAllEventsRef = listAllEventsRef;

exports.listAllEvents = function listAllEvents(dc) {
  return executeQuery(listAllEventsRef(dc));
};

const updateEventStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEventStatus', inputVars);
}
updateEventStatusRef.operationName = 'UpdateEventStatus';
exports.updateEventStatusRef = updateEventStatusRef;

exports.updateEventStatus = function updateEventStatus(dcOrVars, vars) {
  return executeMutation(updateEventStatusRef(dcOrVars, vars));
};

const listStaffingNeedsForEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListStaffingNeedsForEvent', inputVars);
}
listStaffingNeedsForEventRef.operationName = 'ListStaffingNeedsForEvent';
exports.listStaffingNeedsForEventRef = listStaffingNeedsForEventRef;

exports.listStaffingNeedsForEvent = function listStaffingNeedsForEvent(dcOrVars, vars) {
  return executeQuery(listStaffingNeedsForEventRef(dcOrVars, vars));
};
