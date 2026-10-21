import { describe, it, expect } from 'vitest';
import { filterJobs, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

/** Create a job fixture with optional department and location values. */
function makeJob(
    slug: string,
    postedDate: string,
    department = 'Technology',
    location = 'Remote',
): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department,
        location,
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('filterJobs', () => {
    const jobs = [
        makeJob('tech-remote', '2027-01-01', 'Technology', 'Remote'),
        makeJob('tech-vancouver', '2027-01-02', 'Technology', 'Vancouver'),
        makeJob('research-remote', '2027-01-03', 'Research', 'Remote'),
        makeJob('finance-helsinki', '2027-01-04', 'Finance', 'Helsinki'),
    ];

    it('restores all jobs after filters are cleared', () => {
        expect(filterJobs(jobs, ['Technology'], ['Remote'])).toHaveLength(1);
        expect(filterJobs(jobs, [], [])).toEqual(jobs);
    });

    it('filters by department', () => {
        expect(filterJobs(jobs, ['Technology'], []).map((job) => job.slug)).toEqual([
            'tech-remote',
            'tech-vancouver',
        ]);
    });

    it('filters by location', () => {
        expect(filterJobs(jobs, [], ['Remote']).map((job) => job.slug)).toEqual([
            'tech-remote',
            'research-remote',
        ]);
    });

    it('matches any selected value per filter and combines filters with AND', () => {
        expect(
            filterJobs(
                jobs,
                ['Technology', 'Research'],
                ['Remote', 'Vancouver'],
            ).map((job) => job.slug),
        ).toEqual(['tech-remote', 'tech-vancouver', 'research-remote']);
    });

    it('returns an empty array when no jobs match', () => {
        expect(filterJobs(jobs, ['Technology'], ['Helsinki'])).toEqual([]);
    });

    it('does not mutate the input array', () => {
        const original = [...jobs];
        filterJobs(jobs, ['Technology'], ['Remote']);
        expect(jobs).toEqual(original);
    });
});

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
