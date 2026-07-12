import { DriverStatus, Driver, CreateDriverInput, UpdateDriverInput, Vehicle, VehicleStatus, Trip, TripStatus, CreateTripInput, CreateVehicleInput, UpdateVehicleInput } from '../domain/types.js';
import { DriverValidationError } from '../domain/driver.js';
import { TripValidationError } from '../domain/trip.js';
import { VehicleValidationError } from '../domain/vehicle.js';
import { InMemoryDriverRepository } from '../repository/inMemoryDriverRepository.js';
import { InMemoryVehicleRepository } from '../repository/inMemoryVehicleRepository.js';
import { InMemoryTripRepository } from '../repository/inMemoryTripRepository.js';
import { DriverService, DriverBusinessRuleError, DriverAlreadyExistsError } from '../service/driverService.js';
import { VehicleService, VehicleBusinessRuleError, VehicleAlreadyExistsError } from '../service/vehicleService.js';
import { TripService } from '../service/tripService.js';

// Declare global Lucide icon variable from CDN script
declare const lucide: any;

// --- Initialization ---
const driverRepository = new InMemoryDriverRepository();
const vehicleRepository = new InMemoryVehicleRepository();
const tripRepository = new InMemoryTripRepository();

const driverService = new DriverService(driverRepository);
const vehicleService = new VehicleService(vehicleRepository);
const tripService = new TripService(tripRepository, driverRepository, vehicleRepository);

// Track editing state
let editingDriverId: string | null = null;
let editingVehicleId: string | null = null;
let activeTab: 'dashboard' | 'drivers' | 'trips' | 'vehicles' = 'dashboard';

// --- DOM References ---

// Tab Switching
const navDashboard = document.getElementById('nav-dashboard') as HTMLAnchorElement;
const navDrivers = document.getElementById('nav-drivers') as HTMLAnchorElement;
const navTrips = document.getElementById('nav-trips') as HTMLAnchorElement;
const navVehicles = document.getElementById('nav-vehicles') as HTMLAnchorElement;

const dashboardTabContent = document.getElementById('dashboard-tab-content') as HTMLDivElement;
const driversTabContent = document.getElementById('drivers-tab-content') as HTMLDivElement;
const tripsTabContent = document.getElementById('trips-tab-content') as HTMLDivElement;
const vehiclesTabContent = document.getElementById('vehicles-tab-content') as HTMLDivElement;

const mainTitle = document.getElementById('main-title') as HTMLHeadingElement;
const mainSubtitle = document.getElementById('main-subtitle') as HTMLParagraphElement;

// Dashboard DOM
const dashboardTypeFilter = document.getElementById('dashboard-type-filter') as HTMLSelectElement;
const dashboardStatusFilter = document.getElementById('dashboard-status-filter') as HTMLSelectElement;
const dashboardRegionFilter = document.getElementById('dashboard-region-filter') as HTMLSelectElement;

const kpiActiveVehicles = document.getElementById('kpi-active-vehicles') as HTMLHeadingElement;
const kpiAvailableVehicles = document.getElementById('kpi-available-vehicles') as HTMLHeadingElement;
const kpiInshopVehicles = document.getElementById('kpi-inshop-vehicles') as HTMLHeadingElement;
const kpiActiveTrips = document.getElementById('kpi-active-trips') as HTMLHeadingElement;
const kpiPendingTrips = document.getElementById('kpi-pending-trips') as HTMLHeadingElement;
const kpiDriversOnduty = document.getElementById('kpi-drivers-onduty') as HTMLHeadingElement;
const kpiFleetUtilization = document.getElementById('kpi-fleet-utilization') as HTMLHeadingElement;

const dialProgressCircle = document.getElementById('dial-progress-circle') as unknown as SVGCircleElement;
const dialPercentageLabel = document.getElementById('dial-percentage-label') as HTMLSpanElement;
const dashboardActiveTripsList = document.getElementById('dashboard-active-trips-list') as HTMLTableSectionElement;

// Drivers DOM
const driverTableBody = document.getElementById('driver-table-body') as HTMLTableSectionElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
const safetyFilter = document.getElementById('safety-filter') as HTMLSelectElement;
const expiryFilter = document.getElementById('expiry-filter') as HTMLSelectElement;

// Drivers Metrics
const metricTotalDrivers = document.getElementById('metric-total-drivers') as HTMLHeadingElement;
const metricAvailableDrivers = document.getElementById('metric-available-drivers') as HTMLHeadingElement;
const metricOnTripDrivers = document.getElementById('metric-ontrip-drivers') as HTMLHeadingElement;
const metricSuspendedDrivers = document.getElementById('metric-suspended-drivers') as HTMLHeadingElement;

// Trips DOM
const tripTableBody = document.getElementById('trip-table-body') as HTMLTableSectionElement;
const searchTripInput = document.getElementById('search-trip-input') as HTMLInputElement;
const statusTripFilter = document.getElementById('status-trip-filter') as HTMLSelectElement;

// Trips Metrics
const metricTotalTrips = document.getElementById('metric-total-trips') as HTMLHeadingElement;
const metricDispatchedTrips = document.getElementById('metric-dispatched-trips') as HTMLHeadingElement;
const metricCompletedTrips = document.getElementById('metric-completed-trips') as HTMLHeadingElement;
const metricCancelledTrips = document.getElementById('metric-cancelled-trips') as HTMLHeadingElement;

// Vehicles DOM
const vehicleTableBody = document.getElementById('vehicle-table-body') as HTMLTableSectionElement;
const searchVehicleInput = document.getElementById('search-vehicle-input') as HTMLInputElement;
const statusVehicleFilter = document.getElementById('status-vehicle-filter') as HTMLSelectElement;
const typeVehicleFilter = document.getElementById('type-vehicle-filter') as HTMLSelectElement;

// Vehicles Metrics
const metricTotalVehicles = document.getElementById('metric-total-vehicles') as HTMLHeadingElement;
const metricAvailableVehicles = document.getElementById('metric-available-vehicles') as HTMLHeadingElement;
const metricInshopVehicles = document.getElementById('metric-inshop-vehicles') as HTMLHeadingElement;
const metricRetiredVehicles = document.getElementById('metric-retired-vehicles') as HTMLHeadingElement;

// Alert Banner
const expiryAlertBanner = document.getElementById('expiry-alert-banner') as HTMLDivElement;
const alertTitle = document.getElementById('alert-title') as HTMLParagraphElement;
const alertDescription = document.getElementById('alert-description') as HTMLSpanElement;
const closeAlertBtn = document.getElementById('close-alert-btn') as HTMLButtonElement;

// Modal (Driver Form)
const driverModal = document.getElementById('driver-modal') as HTMLDivElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
const driverForm = document.getElementById('driver-form') as HTMLFormElement;
const formDriverId = document.getElementById('form-driver-id') as HTMLInputElement;
const formName = document.getElementById('form-name') as HTMLInputElement;
const formContact = document.getElementById('form-contact') as HTMLInputElement;
const formLicenseNum = document.getElementById('form-license-num') as HTMLInputElement;
const formLicenseCat = document.getElementById('form-license-cat') as HTMLInputElement;
const formExpiry = document.getElementById('form-expiry') as HTMLInputElement;
const formStatus = document.getElementById('form-status') as HTMLSelectElement;
const formRegion = document.getElementById('form-region') as HTMLInputElement;
const formSafety = document.getElementById('form-safety') as HTMLInputElement;
const sliderVal = document.getElementById('slider-val') as HTMLSpanElement;
const addDriverBtn = document.getElementById('add-driver-btn') as HTMLButtonElement;
const formCancelBtn = document.getElementById('form-cancel-btn') as HTMLButtonElement;
const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
const formSummaryError = document.getElementById('form-summary-error') as HTMLDivElement;

// Safety Log Container inside Driver Form Modal
const formSafetyLogSection = document.getElementById('form-safety-log-section') as HTMLDivElement;
const formSafetyLogList = document.getElementById('form-safety-log-list') as HTMLDivElement;

// Modal (Safety Event)
const safetyModal = document.getElementById('safety-modal') as HTMLDivElement;
const safetyForm = document.getElementById('safety-form') as HTMLFormElement;
const safetyDriverId = document.getElementById('safety-driver-id') as HTMLInputElement;
const safetyDriverName = document.getElementById('safety-driver-name') as HTMLElement;
const safetyEventType = document.getElementById('safety-event-type') as HTMLSelectElement;
const safetyEventDesc = document.getElementById('safety-event-desc') as HTMLInputElement;
const customScoreField = document.getElementById('custom-score-field') as HTMLDivElement;
const customScoreInput = document.getElementById('custom-score-input') as HTMLInputElement;
const safetyCancelBtn = document.getElementById('safety-cancel-btn') as HTMLButtonElement;
const safetyModalCloseBtn = document.getElementById('safety-modal-close-btn') as HTMLButtonElement;

// Modal (Trip Form)
const tripModal = document.getElementById('trip-modal') as HTMLDivElement;
const tripForm = document.getElementById('trip-form') as HTMLFormElement;
const tripFormSource = document.getElementById('trip-form-source') as HTMLInputElement;
const tripFormDestination = document.getElementById('trip-form-destination') as HTMLInputElement;
const tripFormCargo = document.getElementById('trip-form-cargo') as HTMLInputElement;
const tripFormDistance = document.getElementById('trip-form-distance') as HTMLInputElement;
const tripFormDriver = document.getElementById('trip-form-driver') as HTMLSelectElement;
const tripFormVehicle = document.getElementById('trip-form-vehicle') as HTMLSelectElement;
const tripFormRegion = document.getElementById('trip-form-region') as HTMLInputElement;
const addTripBtn = document.getElementById('add-trip-btn') as HTMLButtonElement;
const tripFormCancelBtn = document.getElementById('trip-form-cancel-btn') as HTMLButtonElement;
const tripModalCloseBtn = document.getElementById('trip-modal-close-btn') as HTMLButtonElement;
const tripFormSummaryError = document.getElementById('trip-form-summary-error') as HTMLDivElement;

// Modal (Vehicle Form)
const vehicleModal = document.getElementById('vehicle-modal') as HTMLDivElement;
const vehicleModalTitle = document.getElementById('vehicle-modal-title') as HTMLHeadingElement;
const vehicleForm = document.getElementById('vehicle-form') as HTMLFormElement;
const formVehicleId = document.getElementById('form-vehicle-id') as HTMLInputElement;
const formVehicleReg = document.getElementById('form-vehicle-reg') as HTMLInputElement;
const formVehicleModel = document.getElementById('form-vehicle-model') as HTMLInputElement;
const formVehicleType = document.getElementById('form-vehicle-type') as HTMLInputElement;
const formVehicleCapacity = document.getElementById('form-vehicle-capacity') as HTMLInputElement;
const formVehicleOdometer = document.getElementById('form-vehicle-odometer') as HTMLInputElement;
const formVehicleCost = document.getElementById('form-vehicle-cost') as HTMLInputElement;
const formVehicleStatus = document.getElementById('form-vehicle-status') as HTMLSelectElement;
const formVehicleRegion = document.getElementById('form-vehicle-region') as HTMLInputElement;
const addVehicleBtn = document.getElementById('add-vehicle-btn') as HTMLButtonElement;
const vehicleFormCancelBtn = document.getElementById('vehicle-form-cancel-btn') as HTMLButtonElement;
const vehicleModalCloseBtn = document.getElementById('vehicle-modal-close-btn') as HTMLButtonElement;
const vehicleFormSummaryError = document.getElementById('vehicle-form-summary-error') as HTMLDivElement;

// Modal (Odometer Log Update)
const odometerModal = document.getElementById('odometer-modal') as HTMLDivElement;
const odometerForm = document.getElementById('odometer-form') as HTMLFormElement;
const odometerVehicleId = document.getElementById('odometer-vehicle-id') as HTMLInputElement;
const odometerVehicleReg = document.getElementById('odometer-vehicle-reg') as HTMLElement;
const currentOdometerLabel = document.getElementById('current-odometer-label') as HTMLDivElement;
const newOdometerInput = document.getElementById('new-odometer-input') as HTMLInputElement;
const odometerCancelBtn = document.getElementById('odometer-cancel-btn') as HTMLButtonElement;
const odometerModalCloseBtn = document.getElementById('odometer-modal-close-btn') as HTMLButtonElement;

// Time display
const currentTimeSpan = document.getElementById('current-time') as HTMLSpanElement;

// --- Clock Widget ---
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  currentTimeSpan.textContent = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateClock, 60000);
updateClock();

// --- Seed Mock Data ---
async function seedMockData() {
  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 2);

  const nearFuture = new Date();
  nearFuture.setDate(nearFuture.getDate() + 10);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 30);

  // Seed Drivers with Regions
  const driversList: CreateDriverInput[] = [
    {
      name: 'Franklin Vance',
      licenseNumber: 'TX-CDL-88219A',
      licenseCategory: 'CDL Class A',
      licenseExpiryDate: farFuture,
      contactNumber: '+1-512-555-0122',
      safetyScore: 98,
      status: DriverStatus.Available,
      region: 'Texas',
    },
    {
      name: 'Sarah Jenkins',
      licenseNumber: 'NY-CDL-44982B',
      licenseCategory: 'CDL Class A',
      licenseExpiryDate: farFuture,
      contactNumber: '+1-212-555-0182',
      safetyScore: 95,
      status: DriverStatus.Available,
      region: 'California',
    },
    {
      name: 'Marcus Castillo',
      licenseNumber: 'CA-CDL-33104C',
      licenseCategory: 'CDL Class B',
      licenseExpiryDate: nearFuture,
      contactNumber: '+1-415-555-0144',
      safetyScore: 88,
      status: DriverStatus.Available,
      region: 'California',
    },
    {
      name: 'Timothy Cole',
      licenseNumber: 'FL-CDL-11992A',
      licenseCategory: 'CDL Class A',
      licenseExpiryDate: pastDate,
      contactNumber: '+1-305-555-0188',
      safetyScore: 72,
      status: DriverStatus.OffDuty,
      region: 'Florida',
    },
    {
      name: 'Clara Oswald',
      licenseNumber: 'IL-CDL-66277D',
      licenseCategory: 'CDL Class C',
      licenseExpiryDate: farFuture,
      contactNumber: '+1-312-555-0199',
      safetyScore: 52,
      status: DriverStatus.Available,
      region: 'New York',
    },
  ];

  for (const drv of driversList) {
    await driverService.createDriver(drv);
  }

  // Seed Vehicles with Regions
  const vehiclesList: CreateVehicleInput[] = [
    {
      registrationNumber: 'TX-TRK-7711',
      nameModel: 'Freightliner Cascadia (Heavy Duty)',
      type: 'Heavy Truck',
      status: VehicleStatus.Available,
      maxLoadCapacity: 12000,
      odometer: 145200,
      acquisitionCost: 115000,
      region: 'Texas',
    },
    {
      registrationNumber: 'CA-TRK-8840',
      nameModel: 'Volvo VNL 860 (Sleeper Cab)',
      type: 'Heavy Truck',
      status: VehicleStatus.Available,
      maxLoadCapacity: 8000,
      odometer: 89600,
      acquisitionCost: 95000,
      region: 'California',
    },
    {
      registrationNumber: 'IL-TRK-1102',
      nameModel: 'Peterbilt 579 (Semi-Truck)',
      type: 'Heavy Truck',
      status: VehicleStatus.InShop,
      maxLoadCapacity: 10000,
      odometer: 201300,
      acquisitionCost: 135000,
      region: 'Illinois',
    },
    {
      registrationNumber: 'NY-VAN-5529',
      nameModel: 'Ford F-550 Cargo Van',
      type: 'Cargo Van',
      status: VehicleStatus.Available,
      maxLoadCapacity: 3500,
      odometer: 23100,
      acquisitionCost: 45000,
      region: 'New York',
    },
  ];

  for (const v of vehiclesList) {
    await vehicleService.createVehicle(v);
  }

  // Seed initial trips
  const allDrivers = await driverService.getAllDrivers();
  const vance = allDrivers.find(d => d.name === 'Franklin Vance');
  const allVehicles = await vehicleService.getAllVehicles();
  const trk7711 = allVehicles.find(v => v.registrationNumber === 'TX-TRK-7711');
  const jenkins = allDrivers.find(d => d.name === 'Sarah Jenkins');
  const trk8840 = allVehicles.find(v => v.registrationNumber === 'CA-TRK-8840');

  if (vance && trk7711) {
    await tripService.createTrip({
      source: 'Houston Port Terminal D',
      destination: 'Dallas Logistics Center 4',
      driverId: vance.id,
      vehicleId: trk7711.id,
      cargoWeight: 9000,
      plannedDistance: 390,
      region: 'Texas',
    });
  }

  if (jenkins && trk8840) {
    const activeTrip = await tripService.createTrip({
      source: 'Los Angeles Cargo Depot 2',
      destination: 'Phoenix Distribution Terminal',
      driverId: jenkins.id,
      vehicleId: trk8840.id,
      cargoWeight: 4000,
      plannedDistance: 590,
      region: 'California',
    });
    await tripService.dispatchTrip(activeTrip.id);
  }
}

// --- Render Operations ---

async function renderDashboardView() {
  const typeFilterVal = dashboardTypeFilter.value;
  const statusFilterVal = dashboardStatusFilter.value;
  const regionFilterVal = dashboardRegionFilter.value;

  const drivers = await driverService.getAllDrivers();
  const vehicles = await vehicleService.getAllVehicles();
  const trips = await tripService.getAllTrips();

  // Populate dynamic filters if not already set
  const uniqueTypes = Array.from(new Set(vehicles.map(v => v.type)));
  const uniqueRegions = Array.from(new Set([
    ...drivers.map(d => d.region),
    ...vehicles.map(v => v.region),
    ...trips.map(t => t.region)
  ]));

  // Re-render select lists while preserving current selections
  const prevType = dashboardTypeFilter.value;
  dashboardTypeFilter.innerHTML = '<option value="ALL">All Types</option>' +
    uniqueTypes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  dashboardTypeFilter.value = prevType || 'ALL';

  const prevRegion = dashboardRegionFilter.value;
  dashboardRegionFilter.innerHTML = '<option value="ALL">All Regions</option>' +
    uniqueRegions.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  dashboardRegionFilter.value = prevRegion || 'ALL';

  // Apply filters to calculate metrics
  let filteredVehicles = vehicles;
  let filteredTrips = trips;
  let filteredDrivers = drivers;

  if (typeFilterVal !== 'ALL') {
    filteredVehicles = filteredVehicles.filter(v => v.type === typeFilterVal);
    // filter trips associated with those vehicles
    filteredTrips = filteredTrips.filter(t => {
      const v = vehicles.find(vh => vh.id === t.vehicleId);
      return v ? v.type === typeFilterVal : false;
    });
  }

  if (statusFilterVal !== 'ALL') {
    filteredVehicles = filteredVehicles.filter(v => v.status === statusFilterVal);
    filteredTrips = filteredTrips.filter(t => {
      const v = vehicles.find(vh => vh.id === t.vehicleId);
      return v ? v.status === statusFilterVal : false;
    });
  }

  if (regionFilterVal !== 'ALL') {
    filteredVehicles = filteredVehicles.filter(v => v.region === regionFilterVal);
    filteredTrips = filteredTrips.filter(t => t.region === regionFilterVal);
    filteredDrivers = filteredDrivers.filter(d => d.region === regionFilterVal);
  }

  // Calculate KPIs
  const activeVehCount = filteredVehicles.filter(v => v.status === VehicleStatus.OnTrip).length;
  const availVehCount = filteredVehicles.filter(v => v.status === VehicleStatus.Available).length;
  const inshopVehCount = filteredVehicles.filter(v => v.status === VehicleStatus.InShop).length;
  
  const activeTripsCount = filteredTrips.filter(t => t.status === TripStatus.Dispatched).length;
  const pendingTripsCount = filteredTrips.filter(t => t.status === TripStatus.Draft).length;
  
  const driversOnDutyCount = filteredDrivers.filter(d => d.status === DriverStatus.Available || d.status === DriverStatus.OnTrip).length;
  
  const totalFleet = filteredVehicles.length;
  const utilizationRate = totalFleet > 0 ? Math.round((activeVehCount / totalFleet) * 100) : 0;

  // Render KPI values
  kpiActiveVehicles.textContent = activeVehCount.toString();
  kpiAvailableVehicles.textContent = availVehCount.toString();
  kpiInshopVehicles.textContent = inshopVehCount.toString();
  kpiActiveTrips.textContent = activeTripsCount.toString();
  kpiPendingTrips.textContent = pendingTripsCount.toString();
  kpiDriversOnduty.textContent = driversOnDutyCount.toString();
  kpiFleetUtilization.textContent = `${utilizationRate}%`;

  // Draw SVG Dial progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~440
  const offset = circumference - (utilizationRate / 100) * circumference;
  dialProgressCircle.style.strokeDasharray = `${circumference}`;
  dialProgressCircle.style.strokeDashoffset = `${offset}`;
  dialPercentageLabel.textContent = `${utilizationRate}%`;

  // Render Active Transit Routes
  const activeTrips = filteredTrips.filter(t => t.status === TripStatus.Dispatched);
  dashboardActiveTripsList.innerHTML = '';

  if (activeTrips.length === 0) {
    dashboardActiveTripsList.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="5">
          <div class="empty-state" style="padding: 20px;">
            <i data-lucide="route" style="width: 24px; height: 24px;"></i>
            <span>No active routes currently running.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  for (const trip of activeTrips) {
    const row = document.createElement('tr');
    
    let driverName = 'Unknown';
    try {
      const drv = await driverService.getDriver(trip.driverId);
      driverName = drv.name;
    } catch {}

    let maxCap = 1;
    try {
      const v = await vehicleService.getVehicle(trip.vehicleId);
      maxCap = v.maxLoadCapacity;
    } catch {}

    const capacityPct = Math.min(100, Math.round((trip.cargoWeight / maxCap) * 100));

    row.innerHTML = `
      <td>
        <div class="route-path" style="font-size: 12px; font-weight: 600;">
          <span>${escapeHtml(trip.source)}</span>
          <span class="route-arrow"><i data-lucide="arrow-right"></i></span>
          <span>${escapeHtml(trip.destination)}</span>
        </div>
      </td>
      <td>
        <span class="license-category-badge">${escapeHtml(trip.region)}</span>
      </td>
      <td>
        <span>${escapeHtml(driverName)}</span>
      </td>
      <td>
        <span style="font-weight: 700;">${capacityPct}%</span>
        <span style="font-size: 10px; color: var(--text-muted); display: block;">${trip.cargoWeight.toLocaleString()} kg</span>
      </td>
      <td>
        <span>${trip.plannedDistance} km</span>
      </td>
    `;
    dashboardActiveTripsList.appendChild(row);
  }

  lucide.createIcons();
}

async function renderDriversView() {
  const query = searchInput.value.toLowerCase().trim();
  const statusSel = statusFilter.value;
  const safetySel = safetyFilter.value;
  const expirySel = expiryFilter.value;

  const allDrivers = await driverService.getAllDrivers();

  metricTotalDrivers.textContent = allDrivers.length.toString();
  metricAvailableDrivers.textContent = allDrivers.filter(d => d.status === DriverStatus.Available).length.toString();
  metricOnTripDrivers.textContent = allDrivers.filter(d => d.status === DriverStatus.OnTrip).length.toString();
  metricSuspendedDrivers.textContent = allDrivers.filter(d => d.status === DriverStatus.Suspended).length.toString();

  const report = await driverService.getDriversLicenseStatusReport(30);
  if (report.expired.length > 0 || report.expiringSoon.length > 0) {
    expiryAlertBanner.classList.remove('hidden');
    let msg = '';
    if (report.expired.length > 0 && report.expiringSoon.length > 0) {
      msg = `${report.expired.length} driver(s) have expired licenses, and ${report.expiringSoon.length} driver(s) have licenses expiring within 30 days.`;
    } else if (report.expired.length > 0) {
      msg = `${report.expired.length} driver(s) have expired licenses. Dispatch suspended for affected drivers.`;
    } else {
      msg = `${report.expiringSoon.length} driver(s) have licenses expiring soon (within 30 days).`;
    }
    alertDescription.textContent = msg;
    alertTitle.textContent = report.expired.length > 0 ? 'Critical Expiry Alert' : 'Expiry Warning';
  } else {
    expiryAlertBanner.classList.add('hidden');
  }

  let filtered = allDrivers;

  if (query) {
    filtered = filtered.filter(
      d => d.name.toLowerCase().includes(query) || d.licenseNumber.toLowerCase().includes(query)
    );
  }

  if (statusSel !== 'ALL') {
    filtered = filtered.filter(d => d.status === statusSel);
  }

  if (safetySel !== 'ALL') {
    filtered = filtered.filter(d => {
      if (safetySel === 'HIGH') return d.safetyScore >= 90;
      if (safetySel === 'MEDIUM') return d.safetyScore >= 70 && d.safetyScore < 90;
      if (safetySel === 'LOW') return d.safetyScore < 70;
      return true;
    });
  }

  if (expirySel !== 'ALL') {
    filtered = filtered.filter(d => {
      const isExpired = report.expired.some(x => x.id === d.id);
      const isExpiring = report.expiringSoon.some(x => x.id === d.id);
      if (expirySel === 'EXPIRED') return isExpired;
      if (expirySel === 'EXPIRING') return isExpiring;
      if (expirySel === 'VALID') return !isExpired && !isExpiring;
      return true;
    });
  }

  driverTableBody.innerHTML = '';
  
  if (filtered.length === 0) {
    driverTableBody.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="7">
          <div class="empty-state">
            <i data-lucide="users"></i>
            <span>No drivers found matching current filter criteria.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(driver => {
    const row = document.createElement('tr');
    const initials = driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const isExpired = report.expired.some(x => x.id === driver.id);
    const isExpiring = report.expiringSoon.some(x => x.id === driver.id);
    
    let expiryLabelClass = 'valid';
    let expiryLabelText = driver.licenseExpiryDate.toLocaleDateString();
    
    if (isExpired) {
      expiryLabelClass = 'expired';
      expiryLabelText += ' (Expired)';
    } else if (isExpiring) {
      expiryLabelClass = 'expiring';
      expiryLabelText += ' (Expiring)';
    }

    let scoreClass = 'score-excellent';
    if (driver.safetyScore < 70) scoreClass = 'score-critical';
    else if (driver.safetyScore < 90) scoreClass = 'score-good';

    let statusClass = 'offduty';
    if (driver.status === DriverStatus.Available) statusClass = 'available';
    else if (driver.status === DriverStatus.OnTrip) statusClass = 'ontrip';
    else if (driver.status === DriverStatus.Suspended) statusClass = 'suspended';

    row.innerHTML = `
      <td>
        <div class="driver-name-cell">
          <div class="driver-initials">${initials}</div>
          <div class="driver-meta">
            <span class="driver-fullname">${escapeHtml(driver.name)}</span>
            <span class="driver-id-sub">ID: ${driver.id.substring(0, 8)}... | ${escapeHtml(driver.region)}</span>
          </div>
        </div>
      </td>
      <td>
        <div>${escapeHtml(driver.licenseNumber)}</div>
        <span class="license-category-badge">${escapeHtml(driver.licenseCategory)}</span>
      </td>
      <td>
        <span class="expiry-pill ${expiryLabelClass}">
          <i data-lucide="${isExpired ? 'shield-alert' : isExpiring ? 'calendar' : 'shield-check'}"></i>
          <span>${expiryLabelText}</span>
        </span>
      </td>
      <td>
        <span>${escapeHtml(driver.contactNumber)}</span>
      </td>
      <td>
        <div class="safety-score-wrapper">
          <div class="score-bar-bg">
            <div class="score-bar-fill ${scoreClass}" style="width: ${driver.safetyScore}%"></div>
          </div>
          <span class="score-number">${driver.safetyScore}</span>
        </div>
      </td>
      <td>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          <span>${driver.status}</span>
        </span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon log-safety-btn" title="Log Safety Event" data-id="${driver.id}">
            <i data-lucide="shield-alert"></i>
          </button>
          <button class="btn-icon edit-btn" title="Edit Profile & View Logs" data-id="${driver.id}">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-icon danger-hover delete-btn" title="Delete Driver" data-id="${driver.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    driverTableBody.appendChild(row);
  });

  // Re-attach Driver Action Handlers
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) openEditModal(id);
    });
  });

  document.querySelectorAll('.log-safety-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) openSafetyModal(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) handleDeleteDriver(id);
    });
  });
}

async function renderVehiclesView() {
  const query = searchVehicleInput.value.toLowerCase().trim();
  const statusSel = statusVehicleFilter.value;
  const typeSel = typeVehicleFilter.value;

  const allVehicles = await vehicleService.getAllVehicles();

  metricTotalVehicles.textContent = allVehicles.length.toString();
  metricAvailableVehicles.textContent = allVehicles.filter(v => v.status === VehicleStatus.Available).length.toString();
  metricInshopVehicles.textContent = allVehicles.filter(v => v.status === VehicleStatus.InShop).length.toString();
  metricRetiredVehicles.textContent = allVehicles.filter(v => v.status === VehicleStatus.Retired).length.toString();

  let filtered = allVehicles;

  if (query) {
    filtered = filtered.filter(
      v => v.registrationNumber.toLowerCase().includes(query) || v.nameModel.toLowerCase().includes(query)
    );
  }

  if (statusSel !== 'ALL') {
    filtered = filtered.filter(v => v.status === statusSel);
  }

  if (typeSel !== 'ALL') {
    filtered = filtered.filter(v => v.type === typeSel);
  }

  // Update Dynamic Type Filter Dropdown list
  const existingTypes = Array.from(new Set(allVehicles.map(v => v.type)));
  const currentSel = typeVehicleFilter.value;
  typeVehicleFilter.innerHTML = '<option value="ALL">All Types</option>' + 
    existingTypes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  typeVehicleFilter.value = currentSel;

  vehicleTableBody.innerHTML = '';

  if (filtered.length === 0) {
    vehicleTableBody.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="7">
          <div class="empty-state">
            <i data-lucide="truck"></i>
            <span>No vehicles found matching current filter criteria.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(vehicle => {
    const row = document.createElement('tr');
    
    let statusClass = 'offduty';
    if (vehicle.status === VehicleStatus.Available) statusClass = 'available';
    else if (vehicle.status === VehicleStatus.OnTrip) statusClass = 'ontrip';
    else if (vehicle.status === VehicleStatus.InShop) statusClass = 'inshop';
    else if (vehicle.status === VehicleStatus.Retired) statusClass = 'retired';

    row.innerHTML = `
      <td>
        <div class="driver-name-cell">
          <div class="driver-initials"><i data-lucide="truck" style="width: 16px; height: 16px;"></i></div>
          <div class="driver-meta">
            <span class="driver-fullname">${escapeHtml(vehicle.nameModel)}</span>
            <span class="driver-id-sub">Reg: ${escapeHtml(vehicle.registrationNumber)} | ${escapeHtml(vehicle.region)}</span>
          </div>
        </div>
      </td>
      <td>
        <span>${escapeHtml(vehicle.type)}</span>
      </td>
      <td>
        <span style="font-weight: 600;">${vehicle.maxLoadCapacity.toLocaleString()} kg</span>
      </td>
      <td>
        <span>${vehicle.odometer.toLocaleString()} km</span>
      </td>
      <td>
        <span>$${vehicle.acquisitionCost.toLocaleString()}</span>
      </td>
      <td>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          <span>${vehicle.status}</span>
        </span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon update-odo-btn" title="Update Odometer" data-id="${vehicle.id}">
            <i data-lucide="wrench"></i>
          </button>
          <button class="btn-icon edit-vehicle-btn" title="Edit Specs" data-id="${vehicle.id}">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-icon danger-hover delete-vehicle-btn" title="Remove Vehicle" data-id="${vehicle.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    vehicleTableBody.appendChild(row);
  });

  // Re-attach Vehicle Actions
  document.querySelectorAll('.update-odo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) openOdometerModal(id);
    });
  });

  document.querySelectorAll('.edit-vehicle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) openVehicleEditModal(id);
    });
  });

  document.querySelectorAll('.delete-vehicle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) handleDeleteVehicle(id);
    });
  });

  lucide.createIcons();
}

async function renderTripsView() {
  const query = searchTripInput.value.toLowerCase().trim();
  const statusSel = statusTripFilter.value;

  const allTrips = await tripService.getAllTrips();

  metricTotalTrips.textContent = allTrips.length.toString();
  metricDispatchedTrips.textContent = allTrips.filter(t => t.status === TripStatus.Dispatched).length.toString();
  metricCompletedTrips.textContent = allTrips.filter(t => t.status === TripStatus.Completed).length.toString();
  metricCancelledTrips.textContent = allTrips.filter(t => t.status === TripStatus.Cancelled).length.toString();

  let filtered = allTrips;

  if (query) {
    filtered = filtered.filter(
      t => t.source.toLowerCase().includes(query) || t.destination.toLowerCase().includes(query)
    );
  }

  if (statusSel !== 'ALL') {
    filtered = filtered.filter(t => t.status === statusSel);
  }

  tripTableBody.innerHTML = '';

  if (filtered.length === 0) {
    tripTableBody.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="7">
          <div class="empty-state">
            <i data-lucide="route"></i>
            <span>No trips found matching current filter criteria.</span>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  for (const trip of filtered) {
    const row = document.createElement('tr');
    
    let driverName = 'Unknown Driver';
    try {
      const drv = await driverService.getDriver(trip.driverId);
      driverName = drv.name;
    } catch {}

    let vehiclePlate = 'Unknown Reg';
    let vehicleModel = '';
    let maxCap = 1;
    try {
      const v = await vehicleService.getVehicle(trip.vehicleId);
      vehiclePlate = v.registrationNumber;
      vehicleModel = v.nameModel;
      maxCap = v.maxLoadCapacity;
    } catch {}

    const capacityPct = Math.min(100, Math.round((trip.cargoWeight / maxCap) * 100));
    let utilClass = 'score-excellent';
    if (capacityPct > 90) utilClass = 'score-critical';
    else if (capacityPct > 70) utilClass = 'score-good';

    let statusClass = 'draft';
    if (trip.status === TripStatus.Dispatched) statusClass = 'dispatched';
    else if (trip.status === TripStatus.Completed) statusClass = 'completed';
    else if (trip.status === TripStatus.Cancelled) statusClass = 'cancelled';

    const isDraft = trip.status === TripStatus.Draft;
    const isDispatched = trip.status === TripStatus.Dispatched;
    const isTerminal = trip.status === TripStatus.Completed || trip.status === TripStatus.Cancelled;

    row.innerHTML = `
      <td>
        <div class="route-cell">
          <div class="route-path">
            <span>${escapeHtml(trip.source)}</span>
            <span class="route-arrow"><i data-lucide="arrow-right"></i></span>
            <span>${escapeHtml(trip.destination)}</span>
          </div>
          <span class="route-subtext">ID: ${trip.id.substring(0, 8)}... | ${escapeHtml(trip.region)}</span>
        </div>
      </td>
      <td>
        <div class="driver-fullname">${escapeHtml(driverName)}</div>
        <span class="driver-id-sub">Driver ID: ${trip.driverId.substring(0, 8)}...</span>
      </td>
      <td>
        <div class="driver-fullname">${escapeHtml(vehiclePlate)}</div>
        <span class="driver-id-sub">${escapeHtml(vehicleModel)}</span>
      </td>
      <td>
        <div class="safety-score-wrapper" style="min-width: 140px;">
          <div class="score-bar-bg" style="height: 6px;">
            <div class="score-bar-fill ${utilClass}" style="width: ${capacityPct}%"></div>
          </div>
          <span class="score-number" style="font-weight: 700;">${capacityPct}%</span>
        </div>
        <span class="route-subtext" style="display: block; margin-top: 4px;">${trip.cargoWeight.toLocaleString()} / ${maxCap.toLocaleString()} kg</span>
      </td>
      <td>
        <span>${trip.plannedDistance} km</span>
      </td>
      <td>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          <span>${trip.status}</span>
        </span>
      </td>
      <td>
        <div class="actions-cell">
          ${isDraft ? `
            <button class="btn btn-secondary btn-icon dispatch-trip-btn" title="Dispatch Trip" data-id="${trip.id}">
              <i data-lucide="send"></i>
            </button>
          ` : ''}
          ${isDispatched ? `
            <button class="btn btn-secondary btn-icon complete-trip-btn" title="Mark Completed" data-id="${trip.id}">
              <i data-lucide="check-square"></i>
            </button>
          ` : ''}
          ${!isTerminal ? `
            <button class="btn btn-secondary btn-icon danger-hover cancel-trip-btn" title="Cancel Trip" data-id="${trip.id}">
              <i data-lucide="slash"></i>
            </button>
          ` : `
            <span class="route-subtext">—</span>
          `}
        </div>
      </td>
    `;
    tripTableBody.appendChild(row);
  }

  // Attach Trip Action Handlers
  document.querySelectorAll('.dispatch-trip-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) {
        try {
          await tripService.dispatchTrip(id);
          renderDashboard();
        } catch (err: any) {
          alert(`Dispatch failed: ${err.message}`);
        }
      }
    });
  });

  document.querySelectorAll('.complete-trip-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id) {
        try {
          await tripService.completeTrip(id);
          renderDashboard();
        } catch (err: any) {
          alert(`Completion failed: ${err.message}`);
        }
      }
    });
  });

  document.querySelectorAll('.cancel-trip-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
      if (id && confirm('Are you sure you want to cancel this trip assignment?')) {
        try {
          await tripService.cancelTrip(id);
          renderDashboard();
        } catch (err: any) {
          alert(`Cancellation failed: ${err.message}`);
        }
      }
    });
  });

  lucide.createIcons();
}

async function renderDashboard() {
  await renderDashboardView();
  await renderDriversView();
  await renderVehiclesView();
  await renderTripsView();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Tab Switching Logic ---
function switchTab(tab: 'dashboard' | 'drivers' | 'trips' | 'vehicles') {
  activeTab = tab;
  navDashboard.classList.remove('active');
  navDrivers.classList.remove('active');
  navTrips.classList.remove('active');
  navVehicles.classList.remove('active');

  dashboardTabContent.classList.add('hidden');
  driversTabContent.classList.add('hidden');
  tripsTabContent.classList.add('hidden');
  vehiclesTabContent.classList.add('hidden');

  if (tab === 'dashboard') {
    navDashboard.classList.add('active');
    dashboardTabContent.classList.remove('hidden');
    mainTitle.textContent = 'Operations Dashboard';
    mainSubtitle.textContent = 'Real-time overview of fleet activities, driver availability, and KPIs.';
  } else if (tab === 'drivers') {
    navDrivers.classList.add('active');
    driversTabContent.classList.remove('hidden');
    mainTitle.textContent = 'Driver Management';
    mainSubtitle.textContent = 'Monitor status, track safety scores, and audit licenses.';
  } else if (tab === 'trips') {
    navTrips.classList.add('active');
    tripsTabContent.classList.remove('hidden');
    mainTitle.textContent = 'Trip Dispatch Center';
    mainSubtitle.textContent = 'Schedule routes, dispatch drivers, and manage lifecycles.';
  } else if (tab === 'vehicles') {
    navVehicles.classList.add('active');
    vehiclesTabContent.classList.remove('hidden');
    mainTitle.textContent = 'Fleet Management Registry';
    mainSubtitle.textContent = 'Track vehicle specifications, odometers, acquisition costs, and maintenance statuses.';
  }
  lucide.createIcons();
}

navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
navDrivers.addEventListener('click', (e) => { e.preventDefault(); switchTab('drivers'); });
navTrips.addEventListener('click', (e) => { e.preventDefault(); switchTab('trips'); });
navVehicles.addEventListener('click', (e) => { e.preventDefault(); switchTab('vehicles'); });

// --- Modal Helper Functions (Drivers) ---
function openAddModal() {
  editingDriverId = null;
  modalTitle.textContent = 'Register New Driver';
  driverForm.reset();
  formDriverId.value = '';
  sliderVal.textContent = '100';
  formSafety.value = '100';
  formRegion.value = 'Texas';
  
  formSafetyLogSection.classList.add('hidden');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  formExpiry.min = tomorrow.toISOString().split('T')[0];
  
  clearDriverErrors();
  driverModal.classList.remove('hidden');
}

async function openEditModal(id: string) {
  editingDriverId = id;
  modalTitle.textContent = 'Edit Driver Profile';
  clearDriverErrors();
  formExpiry.removeAttribute('min');

  try {
    const driver = await driverService.getDriver(id);
    formDriverId.value = driver.id;
    formName.value = driver.name;
    formContact.value = driver.contactNumber;
    formLicenseNum.value = driver.licenseNumber;
    formLicenseCat.value = driver.licenseCategory;
    formRegion.value = driver.region;
    
    const exp = driver.licenseExpiryDate;
    const year = exp.getFullYear();
    const month = (exp.getMonth() + 1).toString().padStart(2, '0');
    const day = exp.getDate().toString().padStart(2, '0');
    formExpiry.value = `${year}-${month}-${day}`;
    
    formStatus.value = driver.status;
    formSafety.value = driver.safetyScore.toString();
    sliderVal.textContent = driver.safetyScore.toString();
    
    formSafetyLogSection.classList.remove('hidden');
    if (driver.safetyLog && driver.safetyLog.length > 0) {
      formSafetyLogList.innerHTML = driver.safetyLog.map(log => {
        const dateStr = new Date(log.timestamp).toLocaleString();
        const deltaClass = log.pointsDelta >= 0 ? 'green-text' : 'red-text';
        const deltaSign = log.pointsDelta >= 0 ? '+' : '';
        return `
          <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
              <span style="font-size: 11px; text-transform: uppercase; color: var(--color-primary-hover);">${escapeHtml(log.eventType)}</span>
              <span class="${deltaClass}" style="font-family: var(--font-display); font-weight: 700; font-size: 11px;">${deltaSign}${log.pointsDelta} pts</span>
            </div>
            <div style="color: var(--text-secondary); font-size: 11px;">${escapeHtml(log.description)}</div>
            <div style="color: var(--text-muted); font-size: 9px; text-align: right;">${dateStr}</div>
          </div>
        `;
      }).reverse().join('');
    } else {
      formSafetyLogList.innerHTML = `<span style="color: var(--text-muted); font-size: 11px;">No safety events logged.</span>`;
    }

    driverModal.classList.remove('hidden');
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

function closeDriverModal() {
  driverModal.classList.add('hidden');
}

function clearDriverErrors() {
  document.querySelectorAll('#driver-form .field-error').forEach(el => { el.textContent = ''; });
  document.querySelectorAll('#driver-form .invalid').forEach(el => { el.classList.remove('invalid'); });
  formSummaryError.classList.add('hidden');
  formSummaryError.textContent = '';
}

function displayDriverFieldError(field: string, message: string) {
  const errSpan = document.getElementById(`error-${field}`);
  const inputEl = document.getElementById(`form-${field}`);
  if (errSpan) errSpan.textContent = message;
  if (inputEl) inputEl.classList.add('invalid');
}

// --- Submit Forms (Driver) ---
async function handleDriverFormSubmit(e: SubmitEvent) {
  e.preventDefault();
  clearDriverErrors();

  const nameVal = formName.value;
  const contactVal = formContact.value;
  const licenseNumVal = formLicenseNum.value;
  const licenseCatVal = formLicenseCat.value;
  const expiryVal = formExpiry.value;
  const statusVal = formStatus.value as DriverStatus;
  const safetyVal = parseInt(formSafety.value, 10);
  const regionVal = formRegion.value;

  let hasMissing = false;
  if (!nameVal) { displayDriverFieldError('name', 'Name is required'); hasMissing = true; }
  if (!contactVal) { displayDriverFieldError('contact', 'Contact number is required'); hasMissing = true; }
  if (!licenseNumVal) { displayDriverFieldError('license-num', 'License number is required'); hasMissing = true; }
  if (!licenseCatVal) { displayDriverFieldError('license-cat', 'License category is required'); hasMissing = true; }
  if (!expiryVal) { displayDriverFieldError('expiry', 'Expiry date is required'); hasMissing = true; }
  if (!regionVal) { displayDriverFieldError('region', 'Region is required'); hasMissing = true; }
  
  if (hasMissing) return;

  const expiryDate = new Date(expiryVal);

  try {
    if (editingDriverId) {
      const updateData: UpdateDriverInput = {
        name: nameVal,
        contactNumber: contactVal,
        licenseNumber: licenseNumVal,
        licenseCategory: licenseCatVal,
        licenseExpiryDate: expiryDate,
        status: statusVal,
        safetyScore: safetyVal,
        region: regionVal,
      };
      await driverService.updateDriver(editingDriverId, updateData);
    } else {
      const createData: CreateDriverInput = {
        name: nameVal,
        contactNumber: contactVal,
        licenseNumber: licenseNumVal,
        licenseCategory: licenseCatVal,
        licenseExpiryDate: expiryDate,
        status: statusVal,
        safetyScore: safetyVal,
        region: regionVal,
      };
      await driverService.createDriver(createData);
    }
    
    closeDriverModal();
    renderDashboard();
  } catch (err: any) {
    if (err instanceof DriverValidationError) {
      let formField = err.field;
      if (formField === 'licenseNumber') formField = 'license-num';
      if (formField === 'licenseCategory') formField = 'license-cat';
      if (formField === 'contactNumber') formField = 'contact';
      if (formField === 'licenseExpiryDate') formField = 'expiry';
      
      displayDriverFieldError(formField, err.message.replace(/Validation failed for field ".*?": /, ''));
    } else if (err instanceof DriverAlreadyExistsError) {
      displayDriverFieldError('license-num', err.message);
    } else if (err instanceof DriverBusinessRuleError) {
      formSummaryError.textContent = err.message;
      formSummaryError.classList.remove('hidden');
    } else {
      formSummaryError.textContent = `Unexpected Error: ${err.message}`;
      formSummaryError.classList.remove('hidden');
    }
  }
}

// --- Safety Event Modal ---
async function openSafetyModal(id: string) {
  try {
    const driver = await driverService.getDriver(id);
    safetyDriverId.value = driver.id;
    safetyDriverName.textContent = driver.name;
    safetyEventType.value = 'REWARD_EXCELLENT';
    safetyEventDesc.value = 'Quarterly safety performance audit reward.';
    customScoreField.classList.add('hidden');
    customScoreInput.value = driver.safetyScore.toString();
    safetyModal.classList.remove('hidden');
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

async function handleSafetySubmit(e: SubmitEvent) {
  e.preventDefault();
  const id = safetyDriverId.value;
  const type = safetyEventType.value;
  const descVal = safetyEventDesc.value.trim();
  
  if (!descVal) {
    alert('Please provide an event description or reason.');
    return;
  }

  try {
    const driver = await driverService.getDriver(id);
    let newScore = driver.safetyScore;

    if (type === 'REWARD_EXCELLENT') newScore = Math.min(100, newScore + 10);
    else if (type === 'REWARD_GOOD') newScore = Math.min(100, newScore + 5);
    else if (type === 'INFRACTION_MINOR') newScore = Math.max(0, newScore - 10);
    else if (type === 'INFRACTION_MEDIUM') newScore = Math.max(0, newScore - 20);
    else if (type === 'INFRACTION_MAJOR') newScore = Math.max(0, newScore - 40);
    else if (type === 'CUSTOM') {
      const val = parseInt(customScoreInput.value, 10);
      if (isNaN(val) || val < 0 || val > 100) {
        alert('Custom score must be a number between 0 and 100');
        return;
      }
      newScore = val;
    }

    await driverService.updateSafetyScore(id, newScore, type, descVal);
    
    if (newScore < 50 && driver.status !== DriverStatus.Suspended) {
      alert(`Notice: ${driver.name}'s safety score fell below 50. Profile auto-suspended.`);
    }

    safetyModal.classList.add('hidden');
    renderDashboard();
  } catch (err: any) {
    alert(`Failed to log event: ${err.message}`);
  }
}

async function handleDeleteDriver(id: string) {
  try {
    const driver = await driverService.getDriver(id);
    if (confirm(`Are you sure you want to delete driver profile for "${driver.name}"?`)) {
      await driverService.deleteDriver(id);
      renderDashboard();
    }
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

// --- Modal Helper Functions (Vehicles) ---
function openVehicleAddModal() {
  editingVehicleId = null;
  vehicleModalTitle.textContent = 'Register New Vehicle';
  vehicleForm.reset();
  formVehicleId.value = '';
  formVehicleReg.removeAttribute('disabled');
  formVehicleRegion.value = 'Texas';
  
  clearVehicleErrors();
  vehicleModal.classList.remove('hidden');
}

async function openVehicleEditModal(id: string) {
  editingVehicleId = id;
  vehicleModalTitle.textContent = 'Edit Vehicle Specifications';
  clearVehicleErrors();

  try {
    const vehicle = await vehicleService.getVehicle(id);
    formVehicleId.value = vehicle.id;
    formVehicleReg.value = vehicle.registrationNumber;
    formVehicleReg.setAttribute('disabled', 'true');
    
    formVehicleModel.value = vehicle.nameModel;
    formVehicleType.value = vehicle.type;
    formVehicleCapacity.value = vehicle.maxLoadCapacity.toString();
    formVehicleOdometer.value = vehicle.odometer.toString();
    formVehicleCost.value = vehicle.acquisitionCost.toString();
    formVehicleStatus.value = vehicle.status;
    formVehicleRegion.value = vehicle.region;

    vehicleModal.classList.remove('hidden');
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

function closeVehicleModal() {
  vehicleModal.classList.add('hidden');
}

function clearVehicleErrors() {
  document.querySelectorAll('#vehicle-form .field-error').forEach(el => { el.textContent = ''; });
  document.querySelectorAll('#vehicle-form .invalid').forEach(el => { el.classList.remove('invalid'); });
  vehicleFormSummaryError.classList.add('hidden');
  vehicleFormSummaryError.textContent = '';
}

function displayVehicleFieldError(field: string, message: string) {
  const errSpan = document.getElementById(`error-vehicle-${field}`);
  const inputEl = document.getElementById(`form-vehicle-${field}`);
  if (errSpan) errSpan.textContent = message;
  if (inputEl) inputEl.classList.add('invalid');
}

// --- Submit Vehicle Form ---
async function handleVehicleFormSubmit(e: SubmitEvent) {
  e.preventDefault();
  clearVehicleErrors();

  const regVal = formVehicleReg.value;
  const modelVal = formVehicleModel.value;
  const typeVal = formVehicleType.value;
  const capacityVal = parseInt(formVehicleCapacity.value, 10);
  const odometerVal = parseInt(formVehicleOdometer.value, 10);
  const costVal = parseInt(formVehicleCost.value, 10);
  const statusVal = formVehicleStatus.value as VehicleStatus;
  const regionVal = formVehicleRegion.value;

  let hasMissing = false;
  if (!regVal) { displayVehicleFieldError('reg', 'Registration is required'); hasMissing = true; }
  if (!modelVal) { displayVehicleFieldError('model', 'Model is required'); hasMissing = true; }
  if (!typeVal) { displayVehicleFieldError('type', 'Vehicle type is required'); hasMissing = true; }
  if (isNaN(capacityVal)) { displayVehicleFieldError('capacity', 'Capacity is required'); hasMissing = true; }
  if (isNaN(odometerVal)) { displayVehicleFieldError('odometer', 'Odometer is required'); hasMissing = true; }
  if (isNaN(costVal)) { displayVehicleFieldError('cost', 'Acquisition cost is required'); hasMissing = true; }
  if (!regionVal) { displayVehicleFieldError('region', 'Region is required'); hasMissing = true; }

  if (hasMissing) return;

  try {
    if (editingVehicleId) {
      await vehicleService.updateVehicle(editingVehicleId, {
        nameModel: modelVal,
        type: typeVal,
        maxLoadCapacity: capacityVal,
        odometer: odometerVal,
        acquisitionCost: costVal,
        status: statusVal,
        region: regionVal,
      });
    } else {
      await vehicleService.createVehicle({
        registrationNumber: regVal,
        nameModel: modelVal,
        type: typeVal,
        maxLoadCapacity: capacityVal,
        odometer: odometerVal,
        acquisitionCost: costVal,
        status: statusVal,
        region: regionVal,
      });
    }

    closeVehicleModal();
    renderDashboard();
  } catch (err: any) {
    if (err instanceof VehicleValidationError) {
      let fieldKey = err.field;
      if (fieldKey === 'registrationNumber') fieldKey = 'reg';
      if (fieldKey === 'nameModel') fieldKey = 'model';
      if (fieldKey === 'maxLoadCapacity') fieldKey = 'capacity';
      if (fieldKey === 'acquisitionCost') fieldKey = 'cost';
      displayVehicleFieldError(fieldKey, err.message.replace(/Validation failed for field ".*?": /, ''));
    } else if (err instanceof VehicleAlreadyExistsError) {
      displayVehicleFieldError('reg', err.message);
    } else if (err instanceof VehicleBusinessRuleError) {
      vehicleFormSummaryError.textContent = err.message;
      vehicleFormSummaryError.classList.remove('hidden');
    } else {
      vehicleFormSummaryError.textContent = `Error: ${err.message}`;
      vehicleFormSummaryError.classList.remove('hidden');
    }
  }
}

// --- Odometer Log Update ---
async function openOdometerModal(id: string) {
  try {
    const vehicle = await vehicleService.getVehicle(id);
    odometerVehicleId.value = vehicle.id;
    odometerVehicleReg.textContent = vehicle.registrationNumber;
    currentOdometerLabel.textContent = `${vehicle.odometer.toLocaleString()} km`;
    newOdometerInput.value = vehicle.odometer.toString();
    newOdometerInput.min = vehicle.odometer.toString();
    
    odometerModal.classList.remove('hidden');
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

async function handleOdometerSubmit(e: SubmitEvent) {
  e.preventDefault();
  const id = odometerVehicleId.value;
  const newVal = parseInt(newOdometerInput.value, 10);

  if (isNaN(newVal)) {
    alert('Please enter a valid mileage reading.');
    return;
  }

  try {
    await vehicleService.updateOdometer(id, newVal);
    odometerModal.classList.add('hidden');
    renderDashboard();
  } catch (err: any) {
    alert(`Odometer Update Failed: ${err.message}`);
  }
}

async function handleDeleteVehicle(id: string) {
  try {
    const vehicle = await vehicleService.getVehicle(id);
    if (confirm(`Are you sure you want to retire and remove vehicle "${vehicle.registrationNumber}"?`)) {
      await vehicleService.deleteVehicle(id);
      renderDashboard();
    }
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

// --- Modal Helper Functions (Trips) ---
async function openTripModal() {
  tripForm.reset();
  clearTripErrors();

  const allDrivers = await driverService.getAllDrivers();
  const availableDrivers = allDrivers.filter(d => d.status === DriverStatus.Available);
  tripFormDriver.innerHTML = '<option value="">-- Choose Driver --</option>' +
    availableDrivers.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (Safety: ${d.safetyScore})</option>`).join('');

  const allVehicles = await vehicleService.getAllVehicles();
  const availableVehicles = allVehicles.filter(v => v.status === VehicleStatus.Available);
  tripFormVehicle.innerHTML = '<option value="">-- Choose Vehicle --</option>' +
    availableVehicles.map(v => `<option value="${v.id}">${escapeHtml(v.registrationNumber)} - ${escapeHtml(v.nameModel)} (Capacity: ${v.maxLoadCapacity.toLocaleString()} kg)</option>`).join('');

  tripFormRegion.value = 'Texas'; // default
  tripModal.classList.remove('hidden');
}

function closeTripModal() {
  tripModal.classList.add('hidden');
}

function clearTripErrors() {
  document.querySelectorAll('#trip-form .field-error').forEach(el => { el.textContent = ''; });
  document.querySelectorAll('#trip-form .invalid').forEach(el => { el.classList.remove('invalid'); });
  tripFormSummaryError.classList.add('hidden');
  tripFormSummaryError.textContent = '';
}

function displayTripFieldError(field: string, message: string) {
  const errSpan = document.getElementById(`error-trip-${field}`);
  const inputEl = document.getElementById(`trip-form-${field}`);
  if (errSpan) errSpan.textContent = message;
  if (inputEl) inputEl.classList.add('invalid');
}

// --- Submit Forms (Trip) ---
async function handleTripFormSubmit(e: SubmitEvent) {
  e.preventDefault();
  clearTripErrors();

  const sourceVal = tripFormSource.value;
  const destVal = tripFormDestination.value;
  const cargoVal = parseFloat(tripFormCargo.value);
  const distanceVal = parseFloat(tripFormDistance.value);
  const driverIdVal = tripFormDriver.value;
  const vehicleIdVal = tripFormVehicle.value;
  const regionVal = tripFormRegion.value;

  let hasMissing = false;
  if (!sourceVal) { displayTripFieldError('source', 'Source location is required'); hasMissing = true; }
  if (!destVal) { displayTripFieldError('destination', 'Destination location is required'); hasMissing = true; }
  if (isNaN(cargoVal)) { displayTripFieldError('cargo', 'Cargo weight is required'); hasMissing = true; }
  if (isNaN(distanceVal)) { displayTripFieldError('distance', 'Planned distance is required'); hasMissing = true; }
  if (!driverIdVal) { displayTripFieldError('driver', 'Driver selection is required'); hasMissing = true; }
  if (!vehicleIdVal) { displayTripFieldError('vehicle', 'Vehicle selection is required'); hasMissing = true; }
  if (!regionVal) { displayTripFieldError('region', 'Region is required'); hasMissing = true; }

  if (hasMissing) return;

  try {
    await tripService.createTrip({
      source: sourceVal,
      destination: destVal,
      cargoWeight: cargoVal,
      plannedDistance: distanceVal,
      driverId: driverIdVal,
      vehicleId: vehicleIdVal,
      region: regionVal,
    });

    closeTripModal();
    renderDashboard();
  } catch (err: any) {
    if (err instanceof TripValidationError) {
      displayTripFieldError(err.field, err.message.replace(/Validation failed for field ".*?": /, ''));
    } else if (err instanceof DriverBusinessRuleError) {
      tripFormSummaryError.textContent = err.message;
      tripFormSummaryError.classList.remove('hidden');
    } else {
      tripFormSummaryError.textContent = `Unexpected Error: ${err.message}`;
      tripFormSummaryError.classList.remove('hidden');
    }
  }
}

// --- Bind Event Listeners ---

// Dashboard Filter Events
dashboardTypeFilter.addEventListener('change', renderDashboard);
dashboardStatusFilter.addEventListener('change', renderDashboard);
dashboardRegionFilter.addEventListener('change', renderDashboard);

// Driver Events
addDriverBtn.addEventListener('click', openAddModal);
formCancelBtn.addEventListener('click', closeDriverModal);
modalCloseBtn.addEventListener('click', closeDriverModal);
driverForm.addEventListener('submit', handleDriverFormSubmit);

// Safety Modal Events
safetyCancelBtn.addEventListener('click', () => safetyModal.classList.add('hidden'));
safetyModalCloseBtn.addEventListener('click', () => safetyModal.classList.add('hidden'));
safetyForm.addEventListener('submit', handleSafetySubmit);
safetyEventType.addEventListener('change', () => {
  if (safetyEventType.value === 'CUSTOM') {
    customScoreField.classList.remove('hidden');
  } else {
    customScoreField.classList.add('hidden');
  }

  const type = safetyEventType.value;
  if (type === 'REWARD_EXCELLENT') safetyEventDesc.value = 'Quarterly safety performance audit reward.';
  else if (type === 'REWARD_GOOD') safetyEventDesc.value = 'Safe operations during harsh weather conditions.';
  else if (type === 'INFRACTION_MINOR') safetyEventDesc.value = 'Exceeded speed limit by less than 10mph.';
  else if (type === 'INFRACTION_MEDIUM') safetyEventDesc.value = 'Hard braking event detected by telematics sensor.';
  else if (type === 'INFRACTION_MAJOR') safetyEventDesc.value = 'Reckless driving violation or tailgating complaint.';
  else safetyEventDesc.value = '';
});

// Trip Events
addTripBtn.addEventListener('click', openTripModal);
tripFormCancelBtn.addEventListener('click', closeTripModal);
tripModalCloseBtn.addEventListener('click', closeTripModal);
tripForm.addEventListener('submit', handleTripFormSubmit);

// Vehicle Events
addVehicleBtn.addEventListener('click', openVehicleAddModal);
vehicleFormCancelBtn.addEventListener('click', closeVehicleModal);
vehicleModalCloseBtn.addEventListener('click', closeVehicleModal);
vehicleForm.addEventListener('submit', handleVehicleFormSubmit);

// Odometer Events
odometerCancelBtn.addEventListener('click', () => odometerModal.classList.add('hidden'));
odometerModalCloseBtn.addEventListener('click', () => odometerModal.classList.add('hidden'));
odometerForm.addEventListener('submit', handleOdometerSubmit);

formSafety.addEventListener('input', () => {
  sliderVal.textContent = formSafety.value;
});

closeAlertBtn.addEventListener('click', () => {
  expiryAlertBanner.classList.add('hidden');
});

// Search and Filter Listeners
searchInput.addEventListener('input', renderDashboard);
statusFilter.addEventListener('change', renderDashboard);
safetyFilter.addEventListener('change', renderDashboard);
expiryFilter.addEventListener('change', renderDashboard);

searchTripInput.addEventListener('input', renderDashboard);
statusTripFilter.addEventListener('change', renderDashboard);

searchVehicleInput.addEventListener('input', renderDashboard);
statusVehicleFilter.addEventListener('change', renderDashboard);
typeVehicleFilter.addEventListener('change', renderDashboard);

// Automatically set trip region to match chosen vehicle's home region
tripFormVehicle.addEventListener('change', async () => {
  const val = tripFormVehicle.value;
  if (val) {
    try {
      const v = await vehicleService.getVehicle(val);
      tripFormRegion.value = v.region;
    } catch {}
  }
});

// --- Initialization Entry Point ---
(async () => {
  await seedMockData();
  await renderDashboard();
  switchTab('dashboard'); // Start on overview dashboard tab
})();
