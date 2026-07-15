import fs from 'fs';
const f = 'lib/store.ts';
let txt = fs.readFileSync(f, 'utf8');

// 1. emit function update
txt = txt.replace(
  /function emit\(\) \{\n\s*for \(const listener of listeners\) \{\n\s*listener\(\);\n\s*\}\n\}/g,
  `async function saveToIDB() {
  try {
    const state = {
      globalSettings, globalCustomers, globalUsers, globalProducts, globalTransactions,
      globalCashTransactions, globalBankAccounts, globalPersonnel, globalJobApplications,
      globalServiceTickets, globalReminderNotes, globalOrders, globalProposals,
      globalEInvoices, globalNotifications, globalBoms, globalWorkOrders,
      globalSuspendedCarts, globalAttendance, globalSalaryAdjustments, globalPersonnelTasks,
      globalPersonnelKPIs, globalMeetingNotes, globalCampaigns, globalPurchaseRequests,
      globalDocuments, globalChequeNotes, globalWaybills
    };
    await set('esila_app_state', state);
  } catch (e) { console.error("IDB Save Error:", e); }
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
  saveToIDB();
}`
);

// 2. initializeStore update
txt = txt.replace(
  /export async function initializeStore\(force = false\) \{\n\s*if \(isInitialized && !force\) return;\n\s*isInitialized = true;\n\s*try \{/g,
  `export async function initializeStore(force = false) {
  if (isInitialized && !force) return;
  isInitialized = true;
  
  try {
    const cachedState: any = await get('esila_app_state');
    if (cachedState) {
      if (cachedState.globalSettings) globalSettings = cachedState.globalSettings;
      if (cachedState.globalCustomers) globalCustomers = cachedState.globalCustomers;
      if (cachedState.globalUsers) globalUsers = cachedState.globalUsers;
      if (cachedState.globalProducts) globalProducts = cachedState.globalProducts;
      if (cachedState.globalTransactions) globalTransactions = cachedState.globalTransactions;
      if (cachedState.globalCashTransactions) globalCashTransactions = cachedState.globalCashTransactions;
      if (cachedState.globalBankAccounts) globalBankAccounts = cachedState.globalBankAccounts;
      if (cachedState.globalPersonnel) globalPersonnel = cachedState.globalPersonnel;
      if (cachedState.globalJobApplications) globalJobApplications = cachedState.globalJobApplications;
      if (cachedState.globalServiceTickets) globalServiceTickets = cachedState.globalServiceTickets;
      if (cachedState.globalReminderNotes) globalReminderNotes = cachedState.globalReminderNotes;
      if (cachedState.globalOrders) globalOrders = cachedState.globalOrders;
      if (cachedState.globalProposals) globalProposals = cachedState.globalProposals;
      if (cachedState.globalEInvoices) globalEInvoices = cachedState.globalEInvoices;
      if (cachedState.globalNotifications) globalNotifications = cachedState.globalNotifications;
      if (cachedState.globalBoms) globalBoms = cachedState.globalBoms;
      if (cachedState.globalWorkOrders) globalWorkOrders = cachedState.globalWorkOrders;
      if (cachedState.globalSuspendedCarts) globalSuspendedCarts = cachedState.globalSuspendedCarts;
      if (cachedState.globalAttendance) globalAttendance = cachedState.globalAttendance;
      if (cachedState.globalSalaryAdjustments) globalSalaryAdjustments = cachedState.globalSalaryAdjustments;
      if (cachedState.globalPersonnelTasks) globalPersonnelTasks = cachedState.globalPersonnelTasks;
      if (cachedState.globalPersonnelKPIs) globalPersonnelKPIs = cachedState.globalPersonnelKPIs;
      if (cachedState.globalMeetingNotes) globalMeetingNotes = cachedState.globalMeetingNotes;
      if (cachedState.globalCampaigns) globalCampaigns = cachedState.globalCampaigns;
      if (cachedState.globalPurchaseRequests) globalPurchaseRequests = cachedState.globalPurchaseRequests;
      if (cachedState.globalDocuments) globalDocuments = cachedState.globalDocuments;
      if (cachedState.globalChequeNotes) globalChequeNotes = cachedState.globalChequeNotes;
      if (cachedState.globalWaybills) globalWaybills = cachedState.globalWaybills;
      // Trigger a silent emit to update UI without triggering IDB save loop
      for (const listener of listeners) { listener(); }
    }
  } catch (e) { console.error("IDB Load Error:", e); }

  try {`
);

fs.writeFileSync(f, txt);
console.log('Modified store.ts');
