import { describe, expect, it } from 'vitest';
import { applyTaskView, baseMatch, fleetMatch, isFollowUpDue, isOverdue, qualByAircraft, riskLevel } from '../metrics';
import { csvCell, toCsv } from '../export';
import { buildSeed } from '../../mock/seed';
import type { Task, Trainer } from '../../types';

const T = '2026-11-26';
const task = (p: Partial<Task>): Task => ({
  id: 'x', ref: 'T-1', title: 't', description: '', fleet: 'GEN', contributorIds: [], status: 'open', priority: 'normal',
  createdAt: '', source: 'manual', timeline: [], archived: false, updatedAt: '', ...p,
});

describe('filter rules', () => {
  it('fleet filter keeps General/Both items', () => {
    expect(fleetMatch('GEN', 'B737')).toBe(true);
    expect(fleetMatch('A320', 'B737')).toBe(false);
    expect(fleetMatch('A320', 'ALL')).toBe(true);
  });
  it('base filter keeps non-base-specific items and separates WP bases', () => {
    expect(baseMatch(undefined, 'VIE')).toBe(true);
    expect(baseMatch('WP PRG', 'PRG')).toBe(false);
  });
});

describe('task metrics', () => {
  it('overdue only for active tasks with past due date', () => {
    expect(isOverdue(task({ dueDate: '2026-11-25' }), T)).toBe(true);
    expect(isOverdue(task({ dueDate: '2026-11-25', status: 'completed' }), T)).toBe(false);
    expect(isOverdue(task({ dueDate: T }), T)).toBe(false);
  });
  it('follow-up due when date reached and item not received', () => {
    const t = task({ status: 'waiting', dependencyType: 'external', followUpDate: T, dependencyStatus: 'requested' });
    expect(isFollowUpDue(t, T)).toBe(true);
    expect(isFollowUpDue({ ...t, dependencyStatus: 'received', status: 'in_progress' }, T)).toBe(false);
  });
  it('unassigned view lists active tasks without owner', () => {
    const list = [task({ id: 'a' }), task({ id: 'b', ownerId: 'm' }), task({ id: 'c', status: 'completed' })];
    expect(applyTaskView(list, 'unassigned', 'm', T).map((t) => t.id)).toEqual(['a']);
    expect(applyTaskView(list, 'my', 'm', T).map((t) => t.id)).toEqual(['b']);
  });
});

describe('risk scoring', () => {
  it('uses documented thresholds', () => {
    expect(riskLevel(20)).toBe('critical');
    expect(riskLevel(12)).toBe('high');
    expect(riskLevel(6)).toBe('medium');
    expect(riskLevel(4)).toBe('low');
  });
});

describe('trainer counting rule', () => {
  it('counts qualification records per aircraft, not unique people', () => {
    const t = { quals: ['TRE', 'SEN'], aircraft: ['A320', 'B737'] } as unknown as Trainer;
    const rows = qualByAircraft([t], ['TRE', 'SEN', 'TRI'], 'ALL');
    expect(rows.reduce((s, r) => s + r.A320 + r.B737, 0)).toBe(4);
    expect(qualByAircraft([t], ['TRE'], 'B737')[0]).toEqual({ qual: 'TRE', A320: 0, B737: 1 });
  });
});

describe('CSV export', () => {
  it('neutralises spreadsheet formulas and quotes delimiters', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(toCsv([{ Name: 'Müller' }]).startsWith('﻿')).toBe(true);
  });
});

describe('seed data', () => {
  it('contains no hard-coded shared password and only the two named team members', () => {
    const d = buildSeed();
    expect(JSON.stringify(d).toLowerCase()).not.toMatch(/password"\s*:/);
    expect(d.members.map((m) => m.displayName)).toEqual(['Patrick Thorn', 'Joost Jansen']);
    expect(d.members.filter((m) => m.isSuperadmin).map((m) => m.displayName)).toEqual(['Patrick Thorn']);
  });
  it('has exactly the nine initial bases with WP bases distinct', () => {
    expect(buildSeed().bases.map((b) => b.code)).toEqual(['VIE', 'SZG', 'PMI', 'PRG', 'ARN', 'WP PRG', 'WP PMI', 'WP BCN', 'WP WAW']);
  });
});
