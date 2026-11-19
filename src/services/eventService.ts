/**
 * Event Service Facade
 * 
 * Re-exports modular domain services for Events, Registrations, and Vipassana Attendance.
 * Fully backwards-compatible with all existing controllers, APIs, and components.
 */

export * from './events/eventCoreService';
export * from './events/eventRegistrationService';
export * from './events/vipassanaService';
