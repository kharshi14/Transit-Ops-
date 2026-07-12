import { DriverStatus, Driver, CreateDriverInput, UpdateDriverInput, Vehicle, VehicleStatus, Trip, TripStatus, CreateTripInput } from '../domain/types.js';
import { DriverValidationError } from '../domain/driver.js';
import { TripValidationError } from '../domain/trip.js';
import { InMemoryDriverRepository } from '../repository/inMemoryDriverRepository.js';
import { InMemoryVehicleRepository } from '../repository/inMemoryVehicleRepository.js';
import { InMemoryTripRepository } from '../repository/inMemoryTripRepository.js';
import { DriverService, DriverBusinessRuleError, DriverAlreadyExistsError } from '../service/driverService.js';
import { TripService } from '../service/tripService.js';

// Declare global Lucide icon variable from CDN script
declare const lucide: any;

// --- Initialization ---
const driverRepository = new InMemoryDriverRepository();
const vehicleRepository = new InMemoryVehicleRepository();
const tripRepository = new InMemoryTripRepository();

const driverService = new DriverService(driverRepository);
const tripService = new TripService(tripRepository, driverRepository, vehicleRepository);

// Track editing state
let editingDriverId: string | null = null;
let activeTab: 'drivers' | 'trips' = 'drivers';

// --- DOM References ---

// Tab Switching
const navDrivers = document.getElementById('nav-drivers') as HTMLAnchorElement;
const navTrips = document.getElementById('nav-trips') as HTMLAnchorElement;
const driversTabContent = document.getElementById('drivers-tab-content') as HTMLDivElement;
const tripsTabContent = document.getElementById('trips-tab-content') as HTMLDivElement;
const mainTitle = document.getElementById('main-title') as HTMLHeadingElement;
const mainSubtitle = document.getElementById('main-subtitle') as HTMLParagraphElement;

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
const addTripBtn = document.getElementById('add-trip-btn') as HTMLButtonElement;
const tripFormCancelBtn = document.getElementById('trip-form-cancel-btn') as HTMLButtonElement;
const tripModalCloseBtn = document.getElementById('trip-modal-close-btn') as HTMLButtonElement;
const tripFormSummaryError = document.getElementById('trip-form-summary-error') as HTMLDivElement;

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
  nearFuture.setDate(nearFuture.getDate() + 10); // expiring in 10 days

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 30); // expired 30 days ago

  // Seed Drivers with professional names, real CDL formats, and real phone areas
  const driversList: CreateDriverInput[] = [
    {
      name: 'Franklin Vance',
      licenseNumber: 'TX-CDL-88219A',
      licenseCategory: 'CDL Class A',
      licenseExpiryDate: farFuture,
      contactNumber: '+1-512-555-0122',
      safetyScore: 98,
      status: DriverStatus.Available,
    },
    {
      name: 'Sarah Jenkins',
      licenseNumber: 'NY-CDL-44982B',
      licenseCategory: 'CDL Class A',
      licenseExpiryDate: farFuture,
      contactNumber: '+1-212-555-0182',
      safetyScore: 95,
      status: DriverStatus.Available,
    },
    {
      name: 'Marcus Castillo',
      licenseNumber: 'CA-CDL-33104C',
      licenseCategory: 'CDL Class B',
      licenseExpiryDate: nearFuture,
      contactNumber: '+1-415-555-0144',
      safetyScore: 88,
      status: DriverStatus.Available,
    },
    {
      name: 'Timothy Cole',
      licenseNumber: 'FL-CDL-11992A',
      licenseCategory: 'CDL Class A',
      licenseExpiryDate: pastDate,
      contactNumber: '+1-305-555-0188',
      safetyScore: 72,
      status: DriverStatus.OffDuty,
    },
    {
      name: 'Clara Oswald',
      licenseNumber: 'IL-CDL-66277D',
      licenseCategory: 'CDL Class C',
      licenseExpiryDate: farFuture,
      contactNumber: '+1-312-555-0199',
      safetyScore: 52,
      status: DriverStatus.Available,
    },
  ];

  for (const drv of driversList) {
    await driverService.createDriver(drv);
  }

  // Seed Vehicles with standard cargo capacities (kg)
  const vehiclesList: Vehicle[] = [
    {
      id: 'v-101',
      licensePlate: 'TX-TRK-7711',
      makeModel: 'Freightliner Cascadia (Heavy Duty)',
      status: VehicleStatus.Available,
      maxCargoCapacity: 12000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'v-102',
      licensePlate: 'CA-TRK-8840',
      makeModel: 'Volvo VNL 860 (Sleeper Cab)',
      status: VehicleStatus.Available,
      maxCargoCapacity: 8000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'v-103',
      licensePlate: 'IL-TRK-1102',
      makeModel: 'Peterbilt 579 (Semi-Truck)',
      status: VehicleStatus.InMaintenance,
      maxCargoCapacity: 10000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'v-104',
      licensePlate: 'NY-VAN-5529',
      makeModel: 'Ford F-550 Cargo Van',
      status: VehicleStatus.Available,
      maxCargoCapacity: 3500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const v of vehiclesList) {
    await vehicleRepository.save(v);
  }

  // Seed initial professional logistics trips
  const allDrivers = await driverService.getAllDrivers();
  const vance = allDrivers.find(d => d.name === 'Franklin Vance');
  const trk7711 = vehiclesList.find(v => v.licensePlate === 'TX-TRK-7711');
  const jenkins = allDrivers.find(d => d.name === 'Sarah Jenkins');
  const trk8840 = vehiclesList.find(v => v.licensePlate === 'CA-TRK-8840');

  if (vance && trk7711) {
    await tripService.createTrip({
      source: 'Houston Port Terminal D',
      destination: 'Dallas Logistics Center 4',
      driverId: vance.id,
      vehicleId: trk7711.id,
      cargoWeight: 9000, // 75% load capacity
      plannedDistance: 390,
    });
  }

  if (jenkins && trk8840) {
    const activeTrip = await tripService.createTrip({
      source: 'Los Angeles Cargo Depot 2',
      destination: 'Phoenix Distribution Terminal',
      driverId: jenkins.id,
      vehicleId: trk8840.id,
      cargoWeight: 4000, // 50% load capacity
      plannedDistance: 590,
    });
    // Let's dispatch this one immediately to show an active running trip
    await tripService.dispatchTrip(activeTrip.id);
  }
}

// --- Render Operations ---

async function renderDriversView() {
  const query = searchInput.value.toLowerCase().trim();
  const statusSel = statusFilter.value;
  const safetySel = safetyFilter.value;
  const expirySel = expiryFilter.value;

  const allDrivers = await driverService.getAllDrivers();

  // Update Metrics
  metricTotalDrivers.textContent = allDrivers.length.toString();
  metricAvailableDrivers.textContent = allDrivers.filter(d => d.status === DriverStatus.Available).length.toString();
  metricOnTripDrivers.textContent = allDrivers.filter(d => d.status === DriverStatus.OnTrip).length.toString();
  metricSuspendedDrivers.textContent = allDrivers.filter(d => d.status === DriverStatus.Suspended).length.toString();

  // License expiry checks
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

  // Filter list
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
            <span class="driver-id-sub">ID: ${driver.id.substring(0, 8)}...</span>
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

async function renderTripsView() {
  const query = searchTripInput.value.toLowerCase().trim();
  const statusSel = statusTripFilter.value;

  const allTrips = await tripService.getAllTrips();

  // Update Metrics
  metricTotalTrips.textContent = allTrips.length.toString();
  metricDispatchedTrips.textContent = allTrips.filter(t => t.status === TripStatus.Dispatched).length.toString();
  metricCompletedTrips.textContent = allTrips.filter(t => t.status === TripStatus.Completed).length.toString();
  metricCancelledTrips.textContent = allTrips.filter(t => t.status === TripStatus.Cancelled).length.toString();

  // Filter list
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

  // Render rows
  for (const trip of filtered) {
    const row = document.createElement('tr');
    
    // Fetch associated driver name & vehicle plate
    let driverName = 'Unknown Driver';
    try {
      const drv = await driverService.getDriver(trip.driverId);
      driverName = drv.name;
    } catch {}

    let vehiclePlate = 'Unknown Plate';
    let vehicleModel = '';
    let maxCap = 1;
    try {
      const v = await vehicleRepository.findById(trip.vehicleId);
      if (v) {
        vehiclePlate = v.licensePlate;
        vehicleModel = v.makeModel;
        maxCap = v.maxCargoCapacity;
      }
    } catch {}

    // Cargo Capacity Utilization Gauge Calculations
    const capacityPct = Math.min(100, Math.round((trip.cargoWeight / maxCap) * 100));
    let utilClass = 'score-excellent';
    if (capacityPct > 90) utilClass = 'score-critical'; // warning if overloaded/nearly full
    else if (capacityPct > 70) utilClass = 'score-good';

    // Status pill
    let statusClass = 'draft';
    if (trip.status === TripStatus.Dispatched) statusClass = 'dispatched';
    else if (trip.status === TripStatus.Completed) statusClass = 'completed';
    else if (trip.status === TripStatus.Cancelled) statusClass = 'cancelled';

    // Actions enabled state
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
          <span class="route-subtext">ID: ${trip.id.substring(0, 8)}...</span>
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
  await renderDriversView();
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
function switchTab(tab: 'drivers' | 'trips') {
  activeTab = tab;
  if (tab === 'drivers') {
    navDrivers.classList.add('active');
    navTrips.classList.remove('active');
    driversTabContent.classList.remove('hidden');
    tripsTabContent.classList.add('hidden');
    mainTitle.textContent = 'Driver Management';
    mainSubtitle.textContent = 'Monitor status, track safety scores, and audit licenses.';
  } else {
    navDrivers.classList.remove('active');
    navTrips.classList.add('active');
    driversTabContent.classList.add('hidden');
    tripsTabContent.classList.remove('hidden');
    mainTitle.textContent = 'Trip Dispatch Center';
    mainSubtitle.textContent = 'Schedule routes, dispatch drivers, and manage lifecycles.';
  }
  lucide.createIcons();
}

navDrivers.addEventListener('click', (e) => { e.preventDefault(); switchTab('drivers'); });
navTrips.addEventListener('click', (e) => { e.preventDefault(); switchTab('trips'); });

// --- Modal Helper Functions (Drivers) ---
function openAddModal() {
  editingDriverId = null;
  modalTitle.textContent = 'Register New Driver';
  driverForm.reset();
  formDriverId.value = '';
  sliderVal.textContent = '100';
  formSafety.value = '100';
  
  // Hide audit log history for new drivers
  formSafetyLogSection.classList.add('hidden');
  
  // Enforce tomorrow as the minimum expiry date for creating Available driver profiles
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
  
  // Allow date modifications without strict minimum boundaries during historical edits
  formExpiry.removeAttribute('min');

  try {
    const driver = await driverService.getDriver(id);
    formDriverId.value = driver.id;
    formName.value = driver.name;
    formContact.value = driver.contactNumber;
    formLicenseNum.value = driver.licenseNumber;
    formLicenseCat.value = driver.licenseCategory;
    
    const exp = driver.licenseExpiryDate;
    const year = exp.getFullYear();
    const month = (exp.getMonth() + 1).toString().padStart(2, '0');
    const day = exp.getDate().toString().padStart(2, '0');
    formExpiry.value = `${year}-${month}-${day}`;
    
    formStatus.value = driver.status;
    formSafety.value = driver.safetyScore.toString();
    sliderVal.textContent = driver.safetyScore.toString();
    
    // Render safety score log timeline (audit log)
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
      }).reverse().join(''); // Show newest event first
    } else {
      formSafetyLogList.innerHTML = `<span style="color: var(--text-muted); font-size: 11px;">No safety events logged.</span>`;
    }

    driverModal.classList.remove('hidden');
  } catch (err: any) {
    alert(`Error fetching driver: ${err.message}`);
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

  let hasMissing = false;
  if (!nameVal) { displayDriverFieldError('name', 'Name is required'); hasMissing = true; }
  if (!contactVal) { displayDriverFieldError('contact', 'Contact number is required'); hasMissing = true; }
  if (!licenseNumVal) { displayDriverFieldError('license-num', 'License number is required'); hasMissing = true; }
  if (!licenseCatVal) { displayDriverFieldError('license-cat', 'License category is required'); hasMissing = true; }
  if (!expiryVal) { displayDriverFieldError('expiry', 'Expiry date is required'); hasMissing = true; }
  
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
    safetyEventDesc.value = 'Quarterly safety performance audit reward.'; // Default text
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

// --- Modal Helper Functions (Trips) ---
async function openTripModal() {
  tripForm.reset();
  clearTripErrors();

  // Populate dynamic dropdowns
  const allDrivers = await driverService.getAllDrivers();
  const availableDrivers = allDrivers.filter(d => d.status === DriverStatus.Available);
  tripFormDriver.innerHTML = '<option value="">-- Choose Driver --</option>' +
    availableDrivers.map(d => `<option value="${d.id}">${escapeHtml(d.name)} (Safety: ${d.safetyScore})</option>`).join('');

  const allVehicles = await vehicleRepository.findAll();
  const availableVehicles = allVehicles.filter(v => v.status === VehicleStatus.Available);
  tripFormVehicle.innerHTML = '<option value="">-- Choose Vehicle --</option>' +
    availableVehicles.map(v => `<option value="${v.id}">${escapeHtml(v.licensePlate)} - ${escapeHtml(v.makeModel)} (Max: ${v.maxCargoCapacity.toLocaleString()} kg)</option>`).join('');

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

  let hasMissing = false;
  if (!sourceVal) { displayTripFieldError('source', 'Source location is required'); hasMissing = true; }
  if (!destVal) { displayTripFieldError('destination', 'Destination location is required'); hasMissing = true; }
  if (isNaN(cargoVal)) { displayTripFieldError('cargo', 'Cargo weight is required'); hasMissing = true; }
  if (isNaN(distanceVal)) { displayTripFieldError('distance', 'Planned distance is required'); hasMissing = true; }
  if (!driverIdVal) { displayTripFieldError('driver', 'Driver selection is required'); hasMissing = true; }
  if (!vehicleIdVal) { displayTripFieldError('vehicle', 'Vehicle selection is required'); hasMissing = true; }

  if (hasMissing) return;

  try {
    await tripService.createTrip({
      source: sourceVal,
      destination: destVal,
      cargoWeight: cargoVal,
      plannedDistance: distanceVal,
      driverId: driverIdVal,
      vehicleId: vehicleIdVal,
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

  // Update default description prompts based on chosen infractions/rewards
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

// --- Initialization Entry Point ---
(async () => {
  await seedMockData();
  await renderDashboard();
})();
