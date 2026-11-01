// @ts-nocheck -- DOM harness supplies browser globals for component interaction tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import React from 'react';

const window = new Window({ url: 'http://localhost:4321' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'MutationObserver', 'CustomEvent', 'Event', 'EventTarget', 'KeyboardEvent', 'MouseEvent', 'FocusEvent', 'getComputedStyle', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  const value = window[key];
  Object.defineProperty(globalThis, key, { value: typeof value === 'function' && ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(key) ? value.bind(window) : value, configurable: true, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
window.HTMLElement.prototype.scrollIntoView = function () {};
window.scrollTo = () => {};
const { render, screen, fireEvent, waitFor, cleanup } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { default: Study } = await import('../src/components/Study.tsx');

const chapter = { id: 'test', title: 'Fictional course', revision: 1, version: 'fictional-version', approved: true, readingMinutes: 3,
  sections: [{ id: 'concept', title: 'A concept', parts: [{ type: 'html', html: '<p>Fictional concept to study.</p>' },
    { type: 'exercise', id: 'concept-1', label: 'Feedback for concept', html: '<p>Fictional feedback, visible after attempting.</p>' }] }] };

test('study UI saves before revealing feedback; tutor summary needs approval and preferences survive remount', async () => {
  let state = { notes: [], attempts: [], position: null };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (path, options) => {
    const data = JSON.parse(options.body);
    if (path === '/api/tutor') return new Response(JSON.stringify({ answer: data.mode === 'summary' ? 'Fictional summary.' : 'Fictional tutor answer.', provider: 'codex' }), { status: 200 });
    if (data.type === 'attempt') state.attempts.push({ ...data, id: 'attempt', createdAt: new Date().toISOString() });
    if (data.type === 'note') state.notes.push({ ...data, id: 'note', createdAt: new Date().toISOString() });
    return new Response(JSON.stringify(state), { status: 200 });
  };
  try {
    const user = userEvent.setup({ document: window.document });
    render(<Study chapter={chapter} initialState={state} />);
    assert.equal(screen.queryByText('Fictional feedback, visible after attempting.'), null);
    await user.type(screen.getByLabelText('Explica tu razonamiento antes de consultar el feedback.'), 'My first attempt.');
    await user.click(screen.getByRole('button', { name: /Guardar intento y ver feedback/ }));
    await screen.findByText('Fictional feedback, visible after attempting.');
    assert.equal(state.attempts[0].answer, 'My first attempt.');
    await user.click(screen.getByRole('button', { name: 'Preguntar sobre A concept' }));
    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Tu pregunta'), 'What does this mean?');
    await user.click(screen.getByRole('button', { name: 'Preguntar', exact: true }));
    await screen.findByText('Fictional tutor answer.');
    await user.click(screen.getByRole('button', { name: 'Sí, resumir' }));
    const summary = await screen.findByLabelText(/Resumen de lo que quedó claro/);
    assert.equal(state.notes.length, 0); // Nothing is stored until the reader approves it.
    await user.clear(summary);
    await user.type(summary, 'My edited summary.');
    await user.click(screen.getByRole('button', { name: 'Guardar como nota' }));
    await waitFor(() => assert.equal(state.notes.length, 1));
    assert.equal(state.notes[0].question, 'What does this mean?');
    assert.equal(state.notes[0].answer, 'My edited summary.');
    await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
    await user.click(screen.getByRole('button', { name: 'Ajustar lectura' }));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('Tamaño del texto'), { target: { value: '23' } });
    await waitFor(() => assert.equal(JSON.parse(localStorage.getItem('understandly-reading')).size, 23));
    cleanup();
    render(<Study chapter={chapter} initialState={state} />);
    await waitFor(() => assert.match(document.querySelector('.study-app').getAttribute('style'), /23px/));
    assert.equal(state.notes.length, 1);
  } finally { cleanup(); globalThis.fetch = originalFetch; window.happyDOM.cancelAsync(); }
});

test('discarding a tutor summary stores nothing; continuing keeps the conversation', async () => {
  const state = { notes: [], attempts: [], position: null };
  const originalFetch = globalThis.fetch;
  const originalConfirm = globalThis.confirm;
  globalThis.confirm = () => true;
  globalThis.fetch = async (path, options) => path === '/api/tutor'
    ? new Response(JSON.stringify({ answer: JSON.parse(options.body).mode === 'summary' ? 'Fictional summary.' : 'Fictional tutor answer.' }), { status: 200 })
    : new Response(JSON.stringify(state), { status: 200 });
  try {
    const user = userEvent.setup({ document: window.document });
    render(<Study chapter={chapter} initialState={state} />);
    await user.click(screen.getByRole('button', { name: 'Preguntar sobre A concept' }));
    await user.type(await screen.findByLabelText('Tu pregunta'), 'Why?');
    await user.click(screen.getByRole('button', { name: 'Preguntar', exact: true }));
    await user.click(await screen.findByRole('button', { name: 'Sí, resumir' }));
    await screen.findByLabelText(/Resumen de lo que quedó claro/);
    await user.click(screen.getByRole('button', { name: 'Seguir preguntando' }));
    await screen.findByLabelText('Tu pregunta');
    assert.ok(screen.getByText('Fictional tutor answer.'));
    await user.click(screen.getByRole('button', { name: 'Sí, resumir' }));
    await user.click(await screen.findByRole('button', { name: 'Descartar' }));
    await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
    assert.equal(state.notes.length, 0);
  } finally { cleanup(); globalThis.fetch = originalFetch; globalThis.confirm = originalConfirm; window.happyDOM.cancelAsync(); }
});

test('panels collapse independently, persist, and the chapter status names the next step', async () => {
  const originalFetch = globalThis.fetch;
  const state = { notes: [], attempts: [], position: null, visited: [{ section: 'concept', version: 'fictional-version' }] };
  globalThis.fetch = async () => new Response(JSON.stringify(state), { status: 200 });
  localStorage.removeItem('understandly-panels');
  try {
    const user = userEvent.setup({ document: window.document });
    render(<Study chapter={chapter} initialState={state} />);
    assert.ok(screen.getAllByText('1 de 1 secciones · 0 de 1 actividades').length);
    assert.ok(screen.getAllByRole('button', { name: /Siguiente: A concept/ }).length);
    await user.click(screen.getByRole('button', { name: 'Panel de cuaderno' }));
    const workspace = document.querySelector('.workspace');
    assert.match(workspace.className, /right-closed/);
    assert.doesNotMatch(workspace.className, /left-closed/);
    assert.equal(screen.getByRole('button', { name: 'Panel de cuaderno' }).getAttribute('aria-expanded'), 'false');
    await waitFor(() => assert.equal(JSON.parse(localStorage.getItem('understandly-panels')).right, false));
    cleanup();
    render(<Study chapter={chapter} initialState={state} />);
    await waitFor(() => assert.match(document.querySelector('.workspace').className, /right-closed/));
  } finally { cleanup(); localStorage.removeItem('understandly-panels'); globalThis.fetch = originalFetch; window.happyDOM.cancelAsync(); }
});

test('a failed attempt save never reveals its solution or reports success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Fictional disk error.' }), { status: 500 });
  try {
    const user = userEvent.setup({ document: window.document });
    render(<Study chapter={chapter} initialState={{ notes: [], attempts: [], position: null }} />);
    await user.type(screen.getByLabelText('Explica tu razonamiento antes de consultar el feedback.'), 'An unsaved attempt.');
    await user.click(screen.getByRole('button', { name: /Guardar intento y ver feedback/ }));
    await screen.findByRole('alert');
    assert.equal(screen.queryByText('Fictional feedback, visible after attempting.'), null);
    assert.equal(screen.queryByText('1 intento guardado'), null);
  } finally { cleanup(); globalThis.fetch = originalFetch; window.happyDOM.cancelAsync(); }
});


test('shared preview disables tutor and submission without making state requests', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (...args) => { calls.push(args); throw new Error('Must not run'); };
  try {
    render(<Study chapter={chapter} readOnly initialState={{ notes: [], attempts: [], position: null }} />);
    assert.ok(screen.getByText('Vista compartida · Solo lectura'));
    assert.equal(screen.getByRole('button', { name: 'Preguntar sobre A concept' }).disabled, true);
    assert.equal(screen.getByRole('button', { name: /Actividad disponible en el espacio personal/ }).disabled, true);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(calls.length, 0);
  } finally { cleanup(); globalThis.fetch = originalFetch; window.happyDOM.cancelAsync(); }
});
