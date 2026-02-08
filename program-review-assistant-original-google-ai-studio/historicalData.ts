import { HistoricalData } from './types';

export const MOCK_HISTORICAL_DATA: HistoricalData = {
  'Nursing': [
    {
      year: 2023,
      type: 'Annual',
      title: '2023 Annual Update',
      content: 'The Nursing program continued to see strong enrollment and high pass rates on the NCLEX exam. A key challenge was securing sufficient clinical placements. Action item: Expand partnerships with local healthcare facilities.'
    },
    {
      year: 2022,
      type: 'Annual',
      title: '2022 Annual Update',
      content: 'Successfully integrated new simulation technology into the curriculum, receiving positive student feedback. However, faculty retention remains a concern due to salary competition. RAR submitted for salary adjustments.'
    },
    {
      year: 2021,
      type: 'Comprehensive',
      title: '2021-2025 Comprehensive Review',
      content: 'The comprehensive review highlighted the program\'s excellent reputation and dedicated faculty. Key goals for the next four years include updating curriculum to match new state standards, increasing student diversity, and investing in new lab equipment.'
    }
  ],
  'Welding': [
     {
      year: 2023,
      type: 'Annual',
      title: '2023 Annual Update',
      content: 'Enrollment has increased by 15% due to new industry partnerships. The program successfully acquired a new virtual reality welding simulator through a grant, improving student safety and skill acquisition.'
    },
     {
      year: 2022,
      type: 'Annual',
      title: '2022 Annual Update',
      content: 'Job placement rates remain high at 95%. A persistent challenge is the aging equipment in the main lab. An RAR was submitted for capital outlay to replace three of the oldest welding stations.'
    }
  ],
  'Administration of Justice': [
    {
      year: 2023,
      type: 'Annual',
      title: '2023 Annual Update',
      content: 'Curriculum was updated to include a new course on cybercrime, which has been very popular. Transfer rates to four-year institutions are steady. We need to improve our outreach to local high schools to boost enrollment.'
    }
  ],
   'Library': [
    {
      year: 2022,
      type: 'Comprehensive',
      title: '2022-2026 Comprehensive Review',
      content: 'The library services have successfully transitioned to a more digital-first model, increasing access to online databases and journals. Student usage of physical spaces has declined post-pandemic. Goals include reimagining library spaces for collaborative learning and increasing digital literacy workshops for students and faculty.'
    }
  ]
};
