import { getStore, updateStore } from '../repositories/store.js';
import { School, SchoolBookMapping, SchoolStationeryMapping } from '../types.js';

export const schoolService = {
  getSchools(query?: { search?: string; status?: string; city?: string }): School[] {
    let schools = getStore().schools;

    if (!query) return schools;

    if (query.search) {
      const q = query.search.toLowerCase();
      schools = schools.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q)
      );
    }

    if (query.status && query.status !== 'All') {
      schools = schools.filter((s) => s.status === query.status);
    }

    if (query.city && query.city !== 'All') {
      schools = schools.filter((s) => s.city.toLowerCase() === query.city?.toLowerCase());
    }

    return schools;
  },

  getSchoolByIdOrCode(idOrCode: string): School | undefined {
    const term = idOrCode.toUpperCase();
    return getStore().schools.find(
      (s) => s.id === idOrCode || s.code.toUpperCase() === term
    );
  },

  createSchool(data: Omit<School, 'id'>): School {
    const store = getStore();
    const newSchool: School = {
      ...data,
      id: `SCH-0${store.schools.length + 1}`,
      code: data.code.toUpperCase(),
      bookMappings: data.bookMappings || [],
      stationeryMappings: data.stationeryMappings || [],
    };

    updateStore((prev) => ({
      ...prev,
      schools: [...prev.schools, newSchool],
    }));

    return newSchool;
  },

  updateSchool(id: string, updates: Partial<School>): School {
    let updated: School | undefined;

    updateStore((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => {
        if (s.id === id) {
          updated = { ...s, ...updates };
          return updated;
        }
        return s;
      }),
    }));

    if (!updated) {
      throw new Error(`School with id ${id} not found`);
    }

    return updated;
  },

  updateBookMappings(schoolId: string, mappings: SchoolBookMapping[]): School {
    let updated: School | undefined;

    updateStore((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => {
        if (s.id === schoolId) {
          updated = { ...s, bookMappings: mappings };
          return updated;
        }
        return s;
      }),
    }));

    if (!updated) {
      throw new Error(`School with id ${schoolId} not found`);
    }

    return updated;
  },

  updateStationeryMappings(schoolId: string, mappings: SchoolStationeryMapping[]): School {
    let updated: School | undefined;

    updateStore((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => {
        if (s.id === schoolId) {
          updated = { ...s, stationeryMappings: mappings };
          return updated;
        }
        return s;
      }),
    }));

    if (!updated) {
      throw new Error(`School with id ${schoolId} not found`);
    }

    return updated;
  },
};
